/* ============================================================================
   ART-NET — the suite for RULINGS EL..EZ and FB.  Two halves, and they are different
   KINDS of test, which is why they look nothing like each other.

   PART ONE boots the BUILT file under jsdom and drives src/p6d.txt — with a
   REAL ORIGIN (url: below) and a hand-driven fake WebSocket, so the whole
   connection path (open, message, close, the backoff ladder, the teardown)
   is exercised rather than skipped.  An earlier draft booted at about:blank,
   where artUrl() is null and no socket is ever built, and three of its cases
   went green against implementations doing the OPPOSITE of what they claimed.
   If you are tempted to describe this harness as hermetic-because-it-cannot-
   connect: that premise is what hid them.

   PART TWO tests the relay FOR REAL.  There is no way to unit-test a relay:
   the whole of it is two sockets and a protocol, so it spawns
   tools/artnet-relay.js as a child process on free ports, connects with Node
   v24's own global WebSocket, sends a genuine ArtDmx packet over UDP and
   reads the bytes out the other end.

   THE WATCHDOG.  This suite's exit lives in an async tail, and an await on a
   promise that never settles DRAINS the event loop and exits 0 — a hang that
   reads as a pass (TRAPS).  A non-unref'd timer turns that into a loud
   failure instead.  (setTimeout is fine in a test; the standing ban is on
   game timing.)
   ========================================================================== */
'use strict';
const {spawn} = require('child_process');
const dgram = require('dgram');
const net   = require('net');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const crypto= require('crypto');

const RELAY = path.join(__dirname, '..', 'tools', 'artnet-relay.js');
const errs = [];
/* every relay this file spawns, so the failure tail can kill them too.  A
   suite that throws and leaves a node process holding two ports makes the
   NEXT run fail for a reason that has nothing to do with the code. */
const spawned = [];
const killAll = ()=>{ for(const ch of spawned){ try{ ch.kill(); }catch(e){} } };

const wd = setTimeout(()=>{
  console.log('the artnet tail never finished — a socket hung; failing the suite');
  process.exit(1);
}, 60000);

/* this suite needs a global WebSocket (Node 22+).  Without the guard it dies
   inside connect() with a bare ReferenceError, in the one path that skips the
   cleanup — say what is wrong instead. */
if(typeof WebSocket !== 'function'){
  console.log('  ERR this suite needs Node 22 or newer for a global WebSocket; this is ' + process.version);
  console.log('--- failures: 1 ---');
  clearTimeout(wd);
  process.exit(1);
}

const P = async (name, fn)=>{
  try{
    const v = await fn();
    console.log('  ok  ' + name + (v !== undefined ? '  -> ' + JSON.stringify(v).slice(0, 210) : ''));
  }catch(e){
    console.log('  ERR ' + name + ': ' + e.message);
    errs.push(name + ': ' + e.message);
  }
};

/* ==========================================================================
   PART ONE — THE GAME SIDE (RULING EM's state, EN, EU, EV)

   Boots the BUILT file under jsdom the way the other suites do, and drives
   src/p6d.txt directly.  The page is given an origin so the socket path is
   real, and `window.WebSocket` is replaced with a fake one that is driven by
   hand — so nothing here touches the network, and nothing here is skipped
   either.  The two halves of this file never meet: part two spawns the relay
   and never boots the game.
   ========================================================================== */
{
  const {JSDOM} = require('jsdom');
  const html = fs.readFileSync(path.join(__dirname, '..', 'the-house.html'), 'utf8');
  const dom = new JSDOM(html.replace(/<script src=.*?<\/script>/, ''),
    /* WITH AN ORIGIN, on purpose.  jsdom's default about:blank has no host,
       so artUrl() returns null and artOpen() never builds a socket — which
       meant the entire connection path (open, message, close, the backoff
       ladder, the teardown) was unreachable, and assertions about it passed
       against implementations that did the opposite.  A fake WebSocket is
       installed below, so nothing here touches the network. */
    {runScripts:'outside-only', pretendToBeVisual:true, url:'http://localhost:8080/'});
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = function(){
    const noop = ()=>{};
    if(this.__ctx) return this.__ctx;
    return this.__ctx = {fillRect:noop, fillStyle:'', strokeStyle:'', lineWidth:1, font:'',
      beginPath:noop, moveTo:noop, lineTo:noop, arc:noop, ellipse:noop, stroke:noop, fill:noop,
      save:noop, restore:noop, translate:noop, rotate:noop, scale:noop, drawImage:noop,
      clearRect:noop, createPattern:()=>null, fillText:noop, strokeText:noop, strokeRect:noop,
      rect:noop, arcTo:noop, setLineDash:noop, measureText:()=>({width:100}), bezierCurveTo:noop,
      quadraticCurveTo:noop, closePath:noop, clip:noop, setTransform:noop,
      globalAlpha:1, globalCompositeOperation:'',
      createLinearGradient:()=>({addColorStop:noop}), createRadialGradient:()=>({addColorStop:noop}),
      getImageData:(x, y, ww, hh)=>({data:new Uint8ClampedArray(Math.max(4, ww*hh*4))}), putImageData:noop};
  };
  const REAL = require('three');
  const THREE = Object.create(REAL);
  THREE.WebGLRenderer = class {
    constructor(){ const c = w.document.createElement('canvas');
      c.requestPointerLock = ()=>{};
      this.domElement = c; this.shadowMap = {enabled:false, type:0}; this.renderCount = 0; }
    setPixelRatio(){} setSize(){}
    render(scene, camera){ this.renderCount++; scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); }
    compile(){}
    getRenderTarget(){ return this._rt || null; }
    setRenderTarget(t){ this._rt = t || null; }
    getClearColor(c){ return c.set(0x000000); }
  };
  w.THREE = THREE;
  /* the frame loop, pumped by hand — the same shim stages.js uses.  Without
     it jsdom's own rAF runs the loop on a timer, which means the loop cannot
     be STEPPED, and anything that only happens on the frame (p7's 10Hz UI
     block, for one) is untestable and gets written off as untestable. */
  w.requestAnimationFrame = cb => { w.__raf = cb; return 1; };

  const probe = `
  (()=>{
    window.__errs = [];
    const P = (name, fn)=>{ try{ const v=fn(); console.log('  ok  '+name+(v!==undefined?'  -> '+JSON.stringify(v).slice(0,210):'')); }
      catch(e){ console.log('  ERR '+name+': '+e.message); if(e.stack) console.log('      '+e.stack.split('\\n').slice(1,4).join(' | ')); window.__errs.push(name+': '+e.message); } };

    /* A FAKE SOCKET, because the real path is the part worth testing and it
       cannot be reached over a real network from a suite.  It is driven by
       hand: open() completes the handshake, deliver() fires a message, drop()
       closes it the way a relay going away does. */
    class FakeWS {
      constructor(url){
        if(FakeWS.refuse){ FakeWS.refused++; throw new Error('connection refused'); }
        this.url = url; this.readyState = 0; this.binaryType = '';
        this.closeCalls = 0;
        FakeWS.made++; FakeWS.last = this;
      }
      close(){ this.closeCalls++; this.readyState = 3; }
      open(){ this.readyState = 1; if(this.onopen) this.onopen(); }
      deliver(bytes){ if(this.onmessage) this.onmessage({data: bytes.buffer}); }
      drop(){ this.readyState = 3; if(this.onclose) this.onclose(); }
    }
    FakeWS.made = 0; FakeWS.refused = 0; FakeWS.last = null; FakeWS.refuse = false;
    window.WebSocket = FakeWS;
    /* THE MARKER LIVES ON AN UNUSED CHANNEL.  Byte 0 is fixture 1's
       intensity, so a marker there is a rig write — which is invisible while
       nothing applies the bytes and becomes a blackout the moment something
       does.  511 is past everything the map uses today. */
    const frame512 = (mark)=>{ const b = new Uint8Array(512); b[511] = mark; return b; };
    /* a frame that actually lights the rig, for the cases that need one */
    const frameLit = (v)=>{ const b = new Uint8Array(512);
      for(let i = 0; i < FIXTURES.length; i++){ b[i*ART_CH_FIX] = v; b[i*ART_CH_FIX + 1] = 255; }
      return b; };
    /* run the game's frame until cond, off dt, the way the loop does */
    const run = (cond, cap)=>{ let n = 0; while(!cond() && n++ < (cap || 20000)) artnetTick(1/60); return n; };

    P('the switch is OFF on every boot, and there is no socket', ()=>{
      if(typeof ART === 'undefined') throw new Error('there is no ART state at all');
      if(ART.on !== false) throw new Error('ART.on booted ' + ART.on);
      if(ART.ws !== null) throw new Error('a socket exists before anybody asked for one');
      if(ART.live !== false) throw new Error('ART.live booted true');
      if(ART.buf !== null) throw new Error('there is a frame buffered before any frame arrived');
      return 'ART.on false and no socket — the built file is unchanged in behaviour until somebody throws it';
    });

    P('the socket is SAME-ORIGIN, and follows the page scheme', ()=>{
      if(artUrl() !== 'ws://localhost:8080/artnet')
        throw new Error('this page gave ' + artUrl());
      const tls = artUrl({protocol:'https:', host:'desk.local:9000'});
      if(tls !== 'wss://desk.local:9000/artnet') throw new Error('https gave ' + tls);
      const none = artUrl({protocol:'http:', host:''});
      if(none !== null) throw new Error('a page with no host gave ' + none);
      return 'ws:// here, wss:// on an https page, and null where there is no origin at all';
    });

    P('the tick does nothing at all while the switch is off', ()=>{
      const before = FIXTURES.map(f=>f.level).join(',');
      ART.buf = frame512(255);
      artnetTick(1/60);
      if(ART.buf !== null) throw new Error('a buffer survived a tick');
      if(ART.frames !== 0) throw new Error('a frame was counted with the switch off');
      if(ART.live !== false) throw new Error('the switch is off and the row would read live');
      if(FIXTURES.map(f=>f.level).join(',') !== before) throw new Error('a level moved');
      return 'buffer dropped, nothing counted, nothing written';
    });

    P('the switch ALONE changes nothing — a running fade carries on (RULING EV)', ()=>{
      /* the case that made this ruling: an operator throws ARTNET to see what
         it does, with no relay running.  Freezing his cue here is exactly the
         indistinguishable-from-broken EV forbids. */
      artSetOn(false);
      const f = chan(1);
      f.level = 0;
      setLevel(1, 1.0, 5);
      updateFades(1);
      const caught = f.level;
      if(!(caught > 0.02 && caught < 0.9)) throw new Error('the fade was not mid-flight: ' + caught);
      artSetOn(true);
      if(artDriving() !== false) throw new Error('no desk is talking and artDriving() is true');
      if(f.lvlDur !== 5) throw new Error('the fade duration was taken by the switch alone: ' + f.lvlDur);
      updateFades(1);
      if(!(f.level > caught + 0.05)) throw new Error('the fade stopped running: ' + caught + ' -> ' + f.level);
      return 'switch on, no relay: the cue fade ran on from ' + caught.toFixed(3) + ' to ' + f.level.toFixed(3);
    });

    P('the HANDOVER halts a running fade — when a desk actually starts (RULING EM)', ()=>{
      const f = chan(1);
      if(!(f.lvlDur > 0)) throw new Error('this case needs the fade from the case above still running');
      const caught = f.level;
      const ws = FakeWS.last;
      if(!ws) throw new Error('no socket was built when the switch went on');
      ws.open();
      ws.deliver(frame512(1));
      artnetTick(1/60);
      if(artDriving() !== true) throw new Error('a frame arrived and artDriving() is still false');
      if(f.lvlDur !== 0) throw new Error('lvlDur survived the handover at ' + f.lvlDur);
      /* the level is the DESK's now — what must not happen is the game's fade
         engine carrying on underneath it */
      const held = f.level;
      updateFades(1);
      if(Math.abs(f.level - held) > 1e-9)
        throw new Error('the fade kept running under the desk: ' + held + ' -> ' + f.level);
      const dur = FIXTURES.filter(x=>x.lvlDur > 0 || x.colDur > 0).length;
      if(dur) throw new Error(dur + ' fixtures still carry a fade duration');
      return 'a fade caught at ' + caught.toFixed(3) + ' stopped dead at the handover and did not run on under the desk';
    });

    P('the handover halts the PALACE, never the stage you happen to be on (RULING EN)', ()=>{
      /* FIXTURES is swapped wholesale by the stage walk, so a sweep taken
         from the Arc halts the ARC's fades and leaves the Palace's running —
         the one rig this is for. */
      const home = STAGE;
      try{
        stageSwitch('arcMain');
        if(STAGE !== 'arcMain') throw new Error('could not get to the Arc to test this');
        ART.took = false;
        setLevel(1, 1.0, 5);
        const f = chan(1);
        if(f.lvlDur !== 5) throw new Error('the Arc fade did not arm');
        FakeWS.last.deliver(frame512(2));
        artnetTick(1/60);
        if(f.lvlDur !== 5)
          throw new Error('an Art-Net frame took the ARC rig at ' + f.lvlDur + ' — EN says the Palace only');
        if(ART.live !== true) throw new Error('the packet was not even counted; the indicator must stay live');
        return 'a frame received at the Arc: counted, indicator live, and not one Arc fade touched';
      } finally { stageSwitch(home); }
    });

    P('the LATEST frame wins, through the socket that really delivers it', ()=>{
      const ws = FakeWS.last;
      const f0 = ART.frames;
      ws.deliver(frame512(11));
      ws.deliver(frame512(22));          // a second frame before the tick
      if(!ART.buf) throw new Error('onmessage did not store anything');
      if(ART.buf[511] !== 22) throw new Error('the buffer holds ' + ART.buf[511] + ' — the FIRST frame won');
      artnetTick(1/60);
      if(ART.frames !== f0 + 1) throw new Error('more than one frame was taken in one tick');
      if(ART.buf !== null) throw new Error('the buffer was not cleared');
      return 'two frames between ticks: the newer is what the tick takes, and the tick takes one';
    });

    P('a frame that is not 512 bytes is not a frame, and it is COUNTED', ()=>{
      const ws = FakeWS.last;
      if(ws !== ART.ws) throw new Error('this case is driving a socket the game is not using');
      const f0 = ART.frames, b0 = ART.bad;
      ws.deliver(new Uint8Array(64));
      artnetTick(1/60);
      if(ART.frames !== f0) throw new Error('a 64-byte frame was counted as DMX');
      if(ART.bad !== b0 + 1) throw new Error('a wrong-sized frame was dropped without being counted');
      ws.onmessage({data:'hello'});
      if(ART.buf !== null) throw new Error('a text frame was stored as if it were channel data');
      return 'a short frame counted as bad and a text frame refused — a silent drop would read as connected-but-stale';
    });

    P('the socket asks for ARRAYBUFFER, or every frame arrives empty', ()=>{
      /* the regression the 512 guard will really catch: a socket left on the
         default binaryType delivers Blobs, new Uint8Array(blob) is length 0,
         and every frame is refused for ever with the row reading connected.
         Assert the cause, not just the symptom. */
      if(!ART.ws) throw new Error('this case needs a live socket');
      if(ART.ws.binaryType !== 'arraybuffer')
        throw new Error('binaryType is ' + JSON.stringify(ART.ws.binaryType) + ' — frames would arrive as Blobs');
      return 'binaryType arraybuffer, set before the handler is attached';
    });

    P('signal loss goes stale, and the look is NOT touched', ()=>{
      if(typeof ART_STALE === 'undefined') throw new Error('ART_STALE does not exist');
      /* LIGHT IT FIRST, and light it FROM THE DESK — taken on a dark rig the
         comparison below passes against a build that blacks the house out. */
      FakeWS.last.deliver(frameLit(200));
      artnetTick(1/60);
      if(ART.live !== true) throw new Error('this case must start LIVE, and it is not');
      const lit = FIXTURES.filter(f=>f.level > 0.01).length;
      if(lit < 3) throw new Error('this case needs a lit rig to mean anything; only ' + lit + ' are up');
      const before = FIXTURES.map(f=>f.level + ':' + f.color.getHexString()).join(',');
      let t = 0;
      while(t < ART_STALE + 0.2){ artnetTick(1/60); t += 1/60; }
      if(ART.live !== false) throw new Error('still live ' + t.toFixed(2) + 's after the last frame');
      if(artDriving() !== false) throw new Error('artDriving() still true on a dead desk');
      if(FIXTURES.map(f=>f.level + ':' + f.color.getHexString()).join(',') !== before)
        throw new Error('the rig moved when the desk went quiet — it must HOLD its last look');
      return 'stale after ' + ART_STALE + 's with ' + lit + ' channels up: board has it back, not one level or colour moved';
    });

    P('a REAL desk idling does not hand the board back (RULING FB)', ()=>{
      /* THE ONE NUMBER IN THIS ROUND THAT CAME OFF HARDWARE.  Jack ran QLC+
         at the relay on 2026-08-16; the relay log, cumulative, every 10s, read
         1, 7, 12, 17 ArtDmx packets in.  Five to six packets per TEN SECONDS:
         QLC+ does not stream at Art-Net nominal ~44Hz while values are not
         changing, it sends on CHANGE plus a slow keepalive.

         SO THE MARGIN IS PINNED AGAINST THAT LOG, NOT AGAINST THE CONSTANT.
         Asserting ART_STALE === 5.0 would be a tripwire on a number: it would
         fire for anyone who changed the value for a good reason and would say
         nothing whatever about what the value has to DO.  What it has to do is
         span a real keepalive gap.

         AND THE GAP IS TWICE THE SLOWEST MEASURED SPACING, DELIBERATELY.  A
         CUMULATIVE COUNT CAN ONLY GIVE A MEAN — four ten-second windows cannot
         resolve one gap, and a send-on-change desk goes quiet for longer than
         its own average whenever nothing at all is happening.  The doubling is
         a stated margin rather than a measurement, and it is the whole of what
         this case claims: a window has to clear a real keepalive by SOMETHING,
         and 0.2s is not something.

         IT FIRES BOTH WAYS.  Under the old 2.0 the first gap ends the case; a
         window widened until a dead desk is never noticed fails the second
         half.  Between them they fence the value rather than fix it. */
      const DESK_MEAN  = 10 / 6;                  // 1.67s — the fastest window logged
      const DESK_WORST = 10 / 5;                  // 2.00s — the slowest window logged
      const DESK_GAP   = DESK_WORST * 2;          // 4.00s — the gap the log cannot resolve
      const HANDBACK_MAX = 10;                    // and a desk that really died is still noticed
      const ws = FakeWS.last;
      if(!ws || ws !== ART.ws) throw new Error('this case needs the live socket the game is using');
      /* the board writer is a SECTION fader — gated on artDriving() in p6, and
         a real writer rather than a re-reading of the gate function.  Its level
         is put back either way, so nothing downstream inherits this. */
      const sec = SECTIONS[0], held = sec.level;
      try{
        ws.deliver(frameLit(180)); artnetTick(1/60);
        if(artDriving() !== true) throw new Error('the desk would not come up for this case');
        const ages = [];
        for(let g = 0; g < 4; g++){
          let t = 0;
          while(t < DESK_GAP){ artnetTick(1/60); t += 1/60; }
          ages.push(Math.round(ART.seen * 100) / 100);
          if(artDriving() !== true)
            throw new Error('keepalive gap ' + (g + 1) + ': an idle desk was called dead after ' +
              ART.seen.toFixed(2) + 's, and a real QLC+ idles ' + DESK_MEAN.toFixed(2) + 's to ' +
              DESK_WORST.toFixed(2) + 's between packets');
          if(ART.live !== true) throw new Error('keepalive gap ' + (g + 1) + ': the row would read STALE mid-show');
          /* and the BOARD IS STILL REFUSED across the gap — the gate being
             obeyed, not merely the gate reading true */
          const want = sec.level > 0.5 ? 0.1 : 0.9;
          setSection(sec, want, 0);
          if(Math.abs(sec.level - want) < 1e-9)
            throw new Error('keepalive gap ' + (g + 1) + ': the board wrote a section while the desk still held the rig');
          ws.deliver(frameLit(180)); artnetTick(1/60);      // the keepalive lands
          if(ART.seen !== 0) throw new Error('the keepalive did not reset the age: ' + ART.seen);
        }
        /* AND A DESK THAT HAS REALLY STOPPED STILL HANDS BACK, PROMPTLY.
           Without this half ART_STALE = 600 passes everything above, and the
           cost RULING FB names — a dead desk holding the rig — would be
           unbounded with nothing to say so. */
        let t = 0;
        while(artDriving() && t < 60){ artnetTick(1/60); t += 1/60; }
        if(artDriving()) throw new Error('a desk that stopped never handed the board back at all');
        if(t > HANDBACK_MAX)
          throw new Error('a dead desk held the rig for ' + t.toFixed(1) + 's, past the ' +
            HANDBACK_MAX + 's this case pins');
        setSection(sec, held, 0);
        return 'held the rig across 4 gaps of ' + DESK_GAP.toFixed(2) + 's (ages ' + ages.join('s, ') +
               's) with the board refused throughout, and handed back ' + t.toFixed(1) +
               's after the desk really stopped';
      } finally { sec.level = held; }
    });

    P('a refused connection backs off 1-2-4-8, counted off the frame dt', ()=>{
      FakeWS.refuse = true;
      artSetOn(false); artSetOn(true);
      const seen = [Math.round(ART.retry * 100) / 100];
      let last = ART.step, guard = 0, ticks = 0;
      while(seen.length < 5 && guard++ < 20000){
        artnetTick(1/60); ticks++;
        if(ART.step !== last){ last = ART.step; seen.push(Math.round(ART.retry * 100) / 100); }
      }
      FakeWS.refuse = false;
      if(guard >= 20000) throw new Error('the ladder stopped advancing off dt at ' + seen.join(','));
      const want = [1, 2, 4, 8, 8].join(',');
      if(seen.join(',') !== want) throw new Error('the ladder read ' + seen.join(',') + ', wanted ' + want);
      if(ticks < 15 * 60 * 0.9) throw new Error('the whole ladder took only ' + ticks + ' frames; it is not counting seconds');
      if(FakeWS.refused < 4) throw new Error('only ' + FakeWS.refused + ' attempts were actually made');
      return 'waits of ' + seen.join('s, ') + 's over ' + ticks + ' frames, and ' + FakeWS.refused + ' real attempts';
    });

    P('a connection that OPENS and drops still escalates (RULING EU)', ()=>{
      /* a relay restarting under a watcher, a proxy that accepts then resets,
         a headset whose wifi flaps: forgiving the ladder on the handshake
         turns all three into a permanent 1Hz reconnect storm. */
      artSetOn(false); artSetOn(true);
      const waits = [];
      for(let n = 0; n < 4; n++){
        const ws = FakeWS.last;
        if(!ws || ws.readyState === 3) throw new Error('no live socket to open at step ' + n);
        ws.open();
        ws.drop();
        waits.push(Math.round(ART.retry * 100) / 100);
        run(()=>ART.ws !== null, 3000);
      }
      if(waits.join(',') !== '1,2,4,8')
        throw new Error('open-then-drop gave ' + waits.join(',') + ' — a handshake is not a working wire');
      return 'four opens that dropped: ' + waits.join('s, ') + 's — it escalates instead of hammering';
    });

    P('a wire that HOLDS UP forgives the backoff — a handshake and one frame do not', ()=>{
      /* self-arming rather than leaning on the case above: a flap that
         carries 23ms of traffic carries a frame, so "one frame forgives"
         would put the 1Hz storm back one frame later. */
      artSetOn(false); artSetOn(true);
      const a = FakeWS.last; a.open(); a.drop();
      if(ART.step === 0) throw new Error('a socket that opened and dropped left the ladder forgiven');
      run(()=>ART.ws !== null, 3000);
      const ws = FakeWS.last;
      ws.open();
      const held = ART.step;
      if(held === 0) throw new Error('the handshake alone reset the ladder');
      if(typeof ART_PROVE === 'undefined') throw new Error('ART_PROVE does not exist');
      ws.deliver(frame512(9));
      artnetTick(1/60);
      if(ART.step !== held)
        throw new Error('ONE frame forgave the ladder; a flap carrying one frame would storm at 1Hz');
      for(let i = 1; i < ART_PROVE; i++){ ws.deliver(frame512(9)); artnetTick(1/60); }
      if(ART.step !== 0) throw new Error(ART_PROVE + ' frames did not forgive the ladder; step is ' + ART.step);
      return 'step held through the handshake and through one frame, and cleared after ' + ART_PROVE + ' of them';
    });

    P('the desk dying and coming back gets its own handover (RULING EM)', ()=>{
      const ws = FakeWS.last;
      const f = chan(4);
      const stale = ()=>{ let t = 0; while(t < ART_STALE + 0.2){ artnetTick(1/60); t += 1/60; } };
      /* START FROM A DEAD DESK.  The handover is once per SPELL of driving,
         so a case that begins mid-spell would arm a fade the handover is not
         due to take and would read as a bug in the code. */
      stale();
      if(ART.live !== false) throw new Error('this case must begin with the desk quiet');
      const halts = [];
      for(let round = 0; round < 2; round++){
        setLevel(4, round ? 0.0 : 1.0, 5);
        if(f.lvlDur !== 5) throw new Error('round ' + round + ': the board could not arm a fade');
        ws.deliver(frame512(5 + round)); artnetTick(1/60);
        if(f.lvlDur !== 0) throw new Error('round ' + round + ': the desk spoke and did not take the rig; lvlDur ' + f.lvlDur);
        halts.push(round);
        stale();
        if(ART.live !== false) throw new Error('round ' + round + ': the desk did not go quiet again');
      }
      if(halts.length !== 2) throw new Error('only ' + halts.length + ' handover(s)');
      return 'desk speaks and halts, dies, board fades again, desk returns and halts again — per spell, not per switch';
    });

    P('walking out of the Palace and back gets the handover AGAIN (RULINGS EN, EM)', ()=>{
      /* the desk stays live the whole way — the walk is the only thing that
         changes.  A version that begins with the handover already cleared
         would pass against an implementation that never clears it on leaving,
         which is exactly what the negative check caught. */
      const home = STAGE;
      const ws = FakeWS.last;
      try{
        if(STAGE !== 'palace') stageSwitch('palace');
        ws.deliver(frame512(7)); artnetTick(1/60);
        if(!ART.took) throw new Error('the handover never happened on the Palace to begin with');
        stageSwitch('arcMain');
        ws.deliver(frame512(7)); artnetTick(1/60);       // still talking, just not to this stage
        if(ART.live !== true) throw new Error('the desk stopped being live during the walk');
        if(ART.took) throw new Error('walking out of the Palace left the handover marked done');
        stageSwitch('palace');
        setLevel(5, 1.0, 5);
        const f = chan(5);
        if(f.lvlDur !== 5) throw new Error('the Palace fade did not arm');
        ws.deliver(frame512(8)); artnetTick(1/60);
        if(f.lvlDur !== 0)
          throw new Error('walked back into the Palace with the desk still talking and it never took the rig');
        return 'handover on the Palace, cleared by the walk to the Arc, taken again on the frame you walk back in';
      } finally { stageSwitch(home); }
    });

    P('a socket stuck in CONNECTING is given up on, not waited on for ever', ()=>{
      artSetOn(false); artSetOn(true);
      const ws = FakeWS.last;
      if(!ws || ws.readyState !== 0) throw new Error('this case needs a socket that never opens');
      if(typeof ART_CONNECT_MAX === 'undefined') throw new Error('ART_CONNECT_MAX does not exist');
      const n = run(()=>ART.ws === null, 20000);
      if(ART.ws !== null) throw new Error('the relay waited out ' + (n/60).toFixed(0) + 's on a socket that never opened');
      if(ws.closeCalls < 1) throw new Error('it let go of the socket without closing it');
      if(!(ART.retry > 0)) throw new Error('it gave up and then did not rejoin the ladder');
      /* BOUND IT TO THE CONSTANT.  "It eventually gave up" was never in
         doubt, and a build that aborts every socket on the first frame — one
         that could never connect in a browser at all, because a real socket
         is in CONNECTING for at least a frame — passed this case and printed
         "gave up after 0.0s" while doing it. */
      const secs = n/60;
      if(secs < ART_CONNECT_MAX*0.9 || secs > ART_CONNECT_MAX*1.3)
        throw new Error('gave up after ' + secs.toFixed(2) + 's against an ART_CONNECT_MAX of ' + ART_CONNECT_MAX);
      return 'waited ' + secs.toFixed(1) + 's of frames against a limit of ' + ART_CONNECT_MAX + ', then closed and armed a ' + ART.retry.toFixed(0) + 's retry';
    });

    P('switching OFF closes the socket and snaps nothing (RULING EM)', ()=>{
      artSetOn(false); artSetOn(true);
      const ws = FakeWS.last;
      ws.open();
      ws.deliver(frame512(4));
      artnetTick(1/60);
      setLevel(1, 0.77, 0); setColorCh(1, '#3366ff', 0);
      setLevel(2, 0.42, 0); setLevel(3, 0.91, 0);
      const lit = FIXTURES.filter(f=>f.level > 0.01).length;
      if(lit < 3) throw new Error('this case needs a lit rig; only ' + lit + ' channels are up');
      const before = FIXTURES.map(f=>f.level + ':' + f.color.getHexString()).join(',');
      artSetOn(false);
      if(ART.live !== false) throw new Error('live survived the switch going off');
      if(ART.ws !== null) throw new Error('a socket survived the switch going off');
      if(ws.closeCalls < 1) throw new Error('the socket was dropped without being closed');
      if(ws.onmessage !== null) throw new Error('the old socket can still write into ART.buf');
      ws.deliver(frame512(200));
      if(ART.buf !== null) throw new Error('a closed socket still delivered a frame into the buffer');
      if(FIXTURES.map(f=>f.level + ':' + f.color.getHexString()).join(',') !== before)
        throw new Error('the rig moved when the operator took it back');
      return 'a rig with ' + lit + ' channels up held every level and colour, and the old socket cannot write again';
    });

    /* ---- RULING EP: the lights are raw writes, and EN: the Palace only --- */

    P('the channel map is COMPUTED off the rig, never written down (RULING EO)', ()=>{
      if(artFixBase() !== 1) throw new Error('the fixtures do not start at channel 1');
      const wantFly = 1 + ART_CH_FIX * FIXTURES.length;
      if(artFlyBase() !== wantFly) throw new Error('the fly block starts at ' + artFlyBase() + ', not ' + wantFly);
      if(artHouseBase() !== wantFly + 2 * FLY.length) throw new Error('the house block is misplaced');
      /* the numbers the map file will print, today */
      if(FIXTURES.length !== 39 || FLY.length !== 14)
        throw new Error('the rig is ' + FIXTURES.length + ' by ' + FLY.length + ' — the bases move WITH it, which is the point');
      if(artFlyBase() !== 274 || artHouseBase() !== 302 || artSelBase() !== 307 || artMoverBase() !== 311)
        throw new Error('bases read ' + [artFlyBase(), artHouseBase(), artSelBase(), artMoverBase()].join(','));
      /* AND THE DERIVATION IS THE CLAIM, not the numbers.  Everything above
         is satisfied by four literals, because 274 IS 1 + 7*39 today — so
         grow the rig by one lantern and watch every base after it move. */
      FIXTURES.push({name:'a lantern that is not there', mover:false});
      try{
        if(artFlyBase() !== 281) throw new Error('a 40th fixture left the fly block at ' + artFlyBase());
        if(artHouseBase() !== 309) throw new Error('a 40th fixture left the house block at ' + artHouseBase());
        if(artMoverBase() !== 318) throw new Error('a 40th fixture left the movers at ' + artMoverBase());
      } finally { FIXTURES.pop(); }
      if(artFlyBase() !== 274) throw new Error('the rig did not go back to 39');
      return '39 x 7 = 1-273, flys 274, house 302, selectors 307, movers 311 — and a 40th lantern moves all four';
    });

    P('a frame lands on intensity, colour and gobo, at the right channels (RULING EP)', ()=>{
      artSetOn(false); artSetOn(true);
      const ws = FakeWS.last; ws.open();
      const b = new Uint8Array(512);
      /* channel 1 is fixture 1 intensity; 2,3,4 its colour; 5 its gobo */
      b[0] = 255; b[1] = 0; b[2] = 128; b[3] = 255; b[4] = 43 * 3;
      /* and fixture 7, to prove the stride is really seven and not six or eight */
      const o = 6 * ART_CH_FIX;
      b[o] = 51; b[o + 1] = 255; b[o + 2] = 255; b[o + 3] = 0;
      ws.deliver(b); artnetTick(1/60);
      const f1 = FIXTURES[0], f7 = FIXTURES[6];
      if(Math.abs(f1.level - 1) > 1e-6) throw new Error('channel 1 gave level ' + f1.level);
      if(Math.abs(f1.color.r) > 1e-6 || Math.abs(f1.color.b - 1) > 1e-6)
        throw new Error('channel 1 colour is ' + f1.color.getHexString());
      if(Math.abs(f1.color.g - 128/255) > 1e-6) throw new Error('green landed at ' + f1.color.g);
      if(f1.gobo !== 3) throw new Error('gobo byte 129 gave index ' + f1.gobo);
      /* read fixture 7 BEFORE the gobo sweep below: every frame it sends is a
         full 512 bytes, so it zeroes fixture 7 on the way past */
      if(Math.abs(f7.level - 51/255) > 1e-6) throw new Error('fixture 7 read ' + f7.level + ' — the stride is wrong');
      if(Math.abs(f7.color.r - 1) > 1e-6 || Math.abs(f7.color.b) > 1e-6)
        throw new Error('fixture 7 colour is ' + f7.color.getHexString());
      /* THE BOUNDARIES, because byte 129 alone cannot tell 43 from 42 — and
         the clamp, because an index past the last gobo is a black texture and
         no error anywhere. */
      const goboOf = (byte)=>{ const g = new Uint8Array(512); g[4] = byte;
        ws.deliver(g); artnetTick(1/60); return FIXTURES[0].gobo; };
      const edges = [[0,0],[42,0],[43,1],[85,1],[86,2],[214,4],[215,5],[255,5]];
      for(const [byte, want] of edges){
        const got = goboOf(byte);
        if(got !== want) throw new Error('gobo byte ' + byte + ' gave ' + got + ', wanted ' + want);
      }
      if(GOBOS.length !== 6) throw new Error('there are ' + GOBOS.length + ' gobos; the /43 divisor is sized for six');
      return 'ch1 full blue-ish with gobo 3, ch43-49 lands on fixture 7 at 0.20 yellow, and gobo edges 42/43 and 214/215 land right';
    });

    P('the desk fades and the game does NOT — durations stay at zero (RULING EP)', ()=>{
      /* QLC+ fades by sending a value every frame.  Stacking the game's fade
         engine on top would make every fade mushy: the desk asks for 0.4 and
         the rig sets off towards it, arriving as the desk asks for 0.45. */
      const ws = FakeWS.last;
      const seen = [];
      for(let n = 0; n <= 10; n++){
        /* ARM A GAME FADE EVERY STEP, or this proves nothing: the handover
           already left every duration at zero, so a version that never
           zeroed them again would sail through a rig that had none to begin
           with.  Give the fade engine something to fight with. */
        setLevel(1, n % 2 ? 0 : 1, 5);
        setColorCh(1, n % 2 ? '#ff0000' : '#00ff00', 5);
        if(FIXTURES[0].lvlDur !== 5) throw new Error('step ' + n + ': the game fade did not arm');
        const b = new Uint8Array(512);
        b[0] = Math.round(255 * n / 10);          // the desk's own ten-step fade
        ws.deliver(b); artnetTick(1/60);
        if(FIXTURES[0].lvlDur !== 0) throw new Error('step ' + n + ': the desk write left a duration of ' + FIXTURES[0].lvlDur);
        if(FIXTURES[0].colDur !== 0) throw new Error('step ' + n + ': the desk write left a COLOUR duration of ' + FIXTURES[0].colDur);
        const col = FIXTURES[0].color.getHexString();
        updateFades(1/60);                        // the engine gets its chance every frame
        if(FIXTURES[0].color.getHexString() !== col)
          throw new Error('step ' + n + ': the colour fade ran on under the desk, ' + col + ' -> ' + FIXTURES[0].color.getHexString());
        seen.push(Math.round(FIXTURES[0].level * 100) / 100);
      }
      const want = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].join(',');
      if(seen.join(',') !== want) throw new Error('the desk fade read ' + seen.join(',') + ', wanted ' + want);
      return 'ten desk steps arrived as ten exact levels, with a five-second level AND colour fade armed against each one';
    });

    P('a mover takes pan and tilt; a fixed lantern ignores them (RULING EP)', ()=>{
      const ws = FakeWS.last;
      const mover = FIXTURES.findIndex(f=>f.mover);
      const fixed = FIXTURES.findIndex(f=>!f.mover);
      if(mover < 0 || fixed < 0) throw new Error('the rig has no mover or no fixed lantern to compare');
      const f0 = FIXTURES[fixed];
      /* PIN THE FIXED LANTERN AGAINST ITS PLOT, NOT AGAINST A SNAPSHOT.  A
         snapshot taken here is already whatever the previous case's frame
         left it — so against a build that writes pan/tilt on everything, the
         value it is compared to has itself been written, and a later frame
         that happens to repeat it makes the whole comparison agree.  The
         plotted rest values are what a fixed lantern must still have. */
      const PLOT_PAN = 0, PLOT_TILT = -45;
      if(f0.panT !== PLOT_PAN || f0.tiltT !== PLOT_TILT)
        throw new Error('the fixed lantern starts at ' + f0.panT + '/' + f0.tiltT +
          ', not its plotted ' + PLOT_PAN + '/' + PLOT_TILT + ' — something has already written it');
      const aim0 = f0.aim.clone();
      const b = new Uint8Array(512);
      b[mover * ART_CH_FIX + 5] = 255; b[mover * ART_CH_FIX + 6] = 0;
      b[fixed * ART_CH_FIX + 5] = 255; b[fixed * ART_CH_FIX + 6] = 0;
      ws.deliver(b); artnetTick(1/60);
      /* read the fixed lantern NOW, before the tilt sweep below sends more
         full frames past it */
      if(f0.panT !== PLOT_PAN || f0.tiltT !== PLOT_TILT)
        throw new Error('a fixed lantern took the pan/tilt bytes: ' + f0.panT + '/' + f0.tiltT);
      if(!f0.aim.equals(aim0)) throw new Error('a fixed lantern had its aim moved by the desk');
      const m = FIXTURES[mover];
      /* THE SPEC'S OWN NUMBERS, not the build's.  Reading ART_PAN back and
         comparing against it is a test that agrees with itself whatever the
         constant says — RULING EP names plus-or-minus 170 degrees, so that is
         what gets asserted. */
      if(Math.abs(m.panT - 170) > 0.01) throw new Error('pan 255 gave ' + m.panT + ', and RULING EP says 170');
      /* TILT IS NOT SYMMETRIC, and that is the point.  updateRig poses a head
         as rotation.x = (tilt + 90), so tilt 0 is straight down and anything
         positive folds it over backwards — a +/-135 range made the top half of
         the channel unusable and put "50%" straight down. */
      if(Math.abs(m.tiltT + 180) > 0.01) throw new Error('tilt byte 0 gave ' + m.tiltT + ', wanted -180 (straight up)');
      if(ART_PAN !== 170 || ART_TILT_LO !== -180 || ART_TILT_HI !== 0)
        throw new Error('the constants read ' + ART_PAN + '/' + ART_TILT_LO + '..' + ART_TILT_HI + ' — the map file would print a lie');
      const tiltOf = (byte)=>{ const t = new Uint8Array(512);
        t[mover * ART_CH_FIX + 6] = byte; ws.deliver(t); artnetTick(1/60); return FIXTURES[mover].tiltT; };
      if(Math.abs(tiltOf(255) - 0) > 0.01) throw new Error('tilt byte 255 gave ' + m.tiltT + ', wanted 0 (straight down)');
      if(Math.abs(tiltOf(128) + 90) > 0.5) throw new Error('tilt byte 128 gave ' + m.tiltT + ', wanted about -90 (horizontal)');
      /* and every byte lands somewhere a head can actually go */
      for(let byte = 0; byte <= 255; byte += 17){
        const t = tiltOf(byte);
        if(t > 0.01 || t < -180.01) throw new Error('tilt byte ' + byte + ' aims at ' + t + ', outside the head travel');
      }
      const c = new Uint8Array(512);
      c[mover * ART_CH_FIX + 5] = 128; c[mover * ART_CH_FIX + 6] = 128;
      ws.deliver(c); artnetTick(1/60);
      if(Math.abs(m.panT) > 1.5)
        throw new Error('pan byte 128 gave ' + m.panT.toFixed(2) + ', which is not the centre of the pan');
      return 'pan +/-170 centred at byte 128; tilt -180..0 with 128 horizontal and every byte on the head travel; the fixed lantern keeps its plotted aim';
    });

    P('the five house circuits land where the map says (RULING EP)', ()=>{
      const ws = FakeWS.last;
      const h = artHouseBase() - 1;
      const b = new Uint8Array(512);
      b[h] = 255; b[h + 1] = 204; b[h + 2] = 153; b[h + 3] = 102; b[h + 4] = 51;
      ws.deliver(b); artnetTick(1/60);
      const got = [HOUSE.house, HOUSE.work, HOUSE.lobby, HOUSE.backstage, HOUSE.practical]
        .map(v=>Math.round(v * 100) / 100).join(',');
      if(got !== '1,0.8,0.6,0.4,0.2') throw new Error('the house circuits read ' + got);
      return 'house/work/lobby/backstage/practicals at channels ' + (h+1) + '-' + (h+5) + ' read 1,0.8,0.6,0.4,0.2';
    });

    P('the grand master still outranks the desk (RULING EM)', ()=>{
      /* deliberately NOT gated: the in-game grand is the safety, the same as
         a house console's grand over a remote desk. */
      const ws = FakeWS.last;
      ws.deliver(frameLit(255)); artnetTick(1/60);
      const g0 = RIG.grand, bo = RIG.blackout;
      try{
        /* KEEP THE DESK TALKING THROUGH IT.  Setting the grand and then
           reading updateRig with no frame in between proves nothing about
           whether an Art-Net frame could take the grand — it would simply
           never get the chance.  A frame lands before every read. */
        const step = ()=>{ ws.deliver(frameLit(255)); artnetTick(1/60); updateRig(1/60, 0); };
        RIG.grand = 1; RIG.blackout = false;
        step();
        const full = FIXTURES[0]._lvl;
        if(!(full > 0.9)) throw new Error('the desk did not light the rig at all: ' + full);
        RIG.grand = 0.25;
        step();
        if(RIG.grand !== 0.25) throw new Error('an Art-Net frame moved the grand master to ' + RIG.grand);
        const quarter = FIXTURES[0]._lvl;
        if(Math.abs(quarter - full * 0.25) > 1e-6)
          throw new Error('the grand at 0.25 gave ' + quarter + ' against ' + full);
        RIG.blackout = true;
        step();
        if(RIG.blackout !== true) throw new Error('an Art-Net frame cleared the blackout');
        if(FIXTURES[0]._lvl !== 0) throw new Error('blackout left ' + FIXTURES[0]._lvl + ' on a desk-driven rig');
        return 'a desk-driven rig at ' + full.toFixed(2) + ' rode the grand to ' + quarter.toFixed(2) + ' and the blackout to 0';
      } finally { RIG.grand = g0; RIG.blackout = bo; }
    });

    P('an Art-Net frame writes NOTHING on another stage (RULING EN)', ()=>{
      const home = STAGE;
      const ws = FakeWS.last;
      try{
        ws.deliver(frameLit(255)); artnetTick(1/60);
        stageSwitch('arcMain');
        if(STAGE !== 'arcMain') throw new Error('could not get to the Arc');
        /* put the Arc rig somewhere the frame below would obviously move */
        setLevel(1, 0.5, 0); setColorCh(1, '#00ff00', 0);
        setLevel(2, 0.5, 0);
        const before = FIXTURES.map(f=>f.level + ':' + f.color.getHexString()).join(',');
        const houseBefore = [HOUSE.house, HOUSE.work, HOUSE.lobby, HOUSE.backstage, HOUSE.practical].join(',');
        const f0 = ART.frames;
        ws.deliver(frameLit(255)); artnetTick(1/60);
        if(ART.frames !== f0 + 1) throw new Error('the packet was not even received — the indicator must stay live');
        if(ART.live !== true) throw new Error('the row would read stale while a desk is talking');
        if(FIXTURES.map(f=>f.level + ':' + f.color.getHexString()).join(',') !== before)
          throw new Error('a full-on Art-Net frame lit the ARC rig');
        if([HOUSE.house, HOUSE.work, HOUSE.lobby, HOUSE.backstage, HOUSE.practical].join(',') !== houseBefore)
          throw new Error('a full-on Art-Net frame moved the house circuits at the Arc');
        return 'a full frame at the Arc: counted and live, and not one level, colour or circuit moved';
      } finally {
        /* put the Arc back dark before leaving it — the next case appended
           after this one would otherwise inherit a lit rig it never set */
        setLevel(1, 0, 0); setColorCh(1, '#ffffff', 0); setLevel(2, 0, 0);
        stageSwitch(home);
      }
    });

    P('the part introduces no setTimeout of its own — game timing is the frame', ()=>{
      /* delimited by the two part HEADERS either side of it in build order,
         so this reads exactly p6d and cannot quietly grow to cover its
         neighbours the way a fixed slice length would. */
      const src = document.documentElement.outerHTML;
      const a = src.indexOf('ART-NET — THE DESK DRIVES THE PALACE');
      if(a < 0) throw new Error('cannot find the part in the built file');
      const b = src.indexOf('SHOWS — a whole production', a);
      if(b < 0) throw new Error('cannot find the part AFTER it, so the slice has no end');
      const part = src.slice(a, b);
      if(part.length < 2000) throw new Error('the slice is only ' + part.length + ' chars; the markers moved');
      if(part.indexOf('setTimeout(') >= 0 || part.indexOf('setInterval(') >= 0)
        throw new Error('the part sets a timer; reconnect must ride the frame dt');
      return 'no timer call in the ' + part.length + ' chars of the part — the backoff is seconds off dt';
    });

    /* ======================================================================
       THE BOARD YIELDS, ON BOTH SURFACES (RULINGS EM and EV)

       Every case below drives the game through the DOM or through a vrHit
       region, never by calling the setter under test — a detached row fires
       its handler perfectly well, and a model poke proves nothing about the
       thing an operator actually presses (TRAPS).

       And every one of them proves the OTHER half too: with the switch on and
       no desk talking, the board works exactly as it does today.  That is
       RULING EV, and it is the case nobody should need a headset to trust.
       ====================================================================== */

    /* a real desk on the wire: switch on, hand the socket its handshake, put a
       frame through it and take that frame on the tick.  artDriving() after. */
    /* A DESK LOOK, because a desk that says nothing is indistinguishable from
       a board that cannot write.  RULING EP means every frame writes all 39
       fixtures, so a frame of zeros blacks the rig — and then "the fader was
       refused" and "the desk set it to 0" produce the same reading.  Every
       look here is deliberately UNLIKE whatever the board set before it. */
    const deskLook = (lvl, r, g, b, goboIx)=>{
      const f = new Uint8Array(512);
      for(let i = 0; i < FIXTURES.length; i++){
        const o = i * ART_CH_FIX;
        f[o] = lvl; f[o + 1] = r; f[o + 2] = g; f[o + 3] = b; f[o + 4] = goboIx * 43;
      }
      return f;
    };
    const DESK_DEFAULT = ()=>deskLook(255, 0, 0, 255, 2);   // full, blue, gobo 2
    /* and a desk holding the rig DARK, for the cases that detect a cue firing
       by something lighting up.  Refused reads as the desk's 0, fired reads
       as the cue's 1 — still two different numbers. */
    const DESK_DARK = ()=>deskLook(0, 0, 0, 0, 0);
    const deskOn = (look)=>{
      artSetOn(false); artSetOn(true);
      const ws = FakeWS.last;
      if(!ws) throw new Error('the switch built no socket for this case');
      ws.open();
      ws.deliver(look || DESK_DEFAULT());
      artnetTick(1/60);
      if(artDriving() !== true) throw new Error('the desk would not come up for this case');
      return ws;
    };
    /* the desk stops talking and NOBODY TOUCHES THE SWITCH — RULING EV's other
       half.  The board simply has it back. */
    const deskQuiet = ()=>{
      let t = 0;
      while(t < ART_STALE + 0.2){ artnetTick(1/60); t += 1/60; }
      if(ART.on !== true) throw new Error('this case wanted the switch left ON');
      if(artDriving() !== false) throw new Error('the desk would not go quiet');
    };
    const at = sel => document.querySelector(sel);

    P('the ARTNET row is on the LIGHTING panel, and its button IS the switch', ()=>{
      artSetOn(false);
      const page = at('#p-lighting');
      if(!page) throw new Error('there is no LIGHTING panel to put it on');
      const btn = page.querySelector('#artOn'), st = page.querySelector('#artState');
      if(!btn) throw new Error('no ARTNET switch inside #p-lighting');
      if(!st)  throw new Error('no ARTNET readout inside #p-lighting');
      artSyncRow();
      if(btn.textContent !== 'OFF') throw new Error('the button reads ' + btn.textContent + ' with the switch off');
      btn.click();
      if(ART.on !== true) throw new Error('pressing the row did not throw artSetOn');
      if(btn.textContent !== 'ON') throw new Error('the button still reads ' + btn.textContent);
      btn.click();
      if(ART.on !== false) throw new Error('pressing it again did not put the board back');
      if(btn.textContent !== 'OFF') throw new Error('the button reads ' + btn.textContent + ' after the second press');
      return 'a row inside the LIGHTING panel whose button drives artSetOn, both ways, through a real click';
    });

    P('both rows read the SWITCH, the LIVE/STALE gate and the age of the last packet', ()=>{
      deskOn();
      artSyncRow();
      const live = at('#artState').textContent;
      if(live.indexOf('LIVE') < 0) throw new Error('a driving desk reads ' + JSON.stringify(live));
      /* the AGE, matched against the state it is printed from rather than
         against a pattern that resembles one */
      if(live.indexOf(ART.seen.toFixed(1) + 's') < 0)
        throw new Error('no packet age in ' + JSON.stringify(live));
      deskQuiet();
      artSyncRow();
      const stale = at('#artState').textContent;
      if(stale.indexOf('STALE') < 0) throw new Error('a desk that stopped reads ' + JSON.stringify(stale));
      if(!(ART.seen > ART_STALE)) throw new Error('the age did not grow: ' + ART.seen);
      if(stale.indexOf(ART.seen.toFixed(1) + 's') < 0)
        throw new Error('the age is not the age: ' + JSON.stringify(stale));
      if(stale === live) throw new Error('the row said the same thing live and stale');
      /* AND THE HEADSET PRINTS THE SAME SENTENCE.  Not a paraphrase of it —
         one function, both surfaces, or they drift the first time either is
         edited.  The canvas is a stub, so the drawing is read by catching
         what the page asks it to write. */
      VR.page = 'lighting';
      vrCanvas();
      const said = [], ctx = VR.ctx, realText = ctx.fillText;
      ctx.fillText = function(s){ said.push(String(s)); };
      try{ vrDrawConsole(true); } finally { ctx.fillText = realText; }
      if(said.indexOf('ART-NET') < 0)
        throw new Error('the headset LIGHTING page draws no ART-NET row');
      if(said.indexOf(stale) < 0)
        throw new Error('the headset prints something else: ' + JSON.stringify(said.slice(-6)));
      artSetOn(false);
      return 'LIVE with an age, STALE with a bigger one, and the headset printing the very same string';
    });

    P('the headset carries the SAME switch, found by META, and moves no row above it', ()=>{
      artSetOn(false);
      VR.page = 'lighting'; vrDrawConsole(true);
      const lk = VR.hits.filter(h=>h.lk);
      if(lk.length !== VR_LK_ROWS.length*2)
        throw new Error(lk.length + ' LK regions against ' + VR_LK_ROWS.length + ' rows — the ARTNET row displaced them');
      const sw = VR.hits.find(h=>h.artnet === 'switch');
      if(!sw) throw new Error('no region tagged artnet on the headset LIGHTING page');
      const lowest = Math.max.apply(null, lk.map(h=>h.y + h.h));
      if(sw.y < lowest) throw new Error('the ARTNET row sits at y ' + sw.y + ', over rows that end at ' + lowest);
      sw.fn();
      if(ART.on !== true) throw new Error('the headset switch does not drive artSetOn');
      const sw2 = VR.hits.find(h=>h.artnet === 'switch');
      if(!sw2) throw new Error('the row vanished from the redrawn page');
      sw2.fn();
      if(ART.on !== false) throw new Error('the headset switch will not put the board back');
      return 'one artnet region under ' + lk.length + ' untouched LK regions, driving the same artSetOn both ways';
    });

    P('GO, BACK and TOP fire nothing while a desk drives — and everything when it stops', ()=>{
      const savedCues = CUES.slice(), savedNext = nextCue;
      try{
        CUES.length = 0;
        setLevel(1, 1.0, 0); setLevel(2, 1.0, 0);
        const mk = n=>({n, label:'gate ' + n, fade:0, follow:null, lx:snapshotLX(), fly:null,
                        sfx:null, house:HOUSE.house, work:HOUSE.work,
                        practical:HOUSE.practical, haze:RIG.haze, lobby:HOUSE.lobby});
        const up = mk(1);
        setLevel(1, 0.0, 0); setLevel(2, 0.0, 0);
        const down = mk(2);
        CUES.push(up, down);
        nextCue = 0;
        refreshCues();
        const f = chan(1);
        /* a clock track that a show would be running on, so the two things
           only the OPERATOR paths do — TOP letting go of the transport and
           GO seeking it (RULING BO) — can be watched.  fireCue never touches
           either, which is exactly why its guard cannot stand in for theirs. */
        const key = audTrackFor(90);
        if(!key) throw new Error('no clock track in the manifest to seek');
        const tr = audTrack(key);          // minted on demand; AUD.tracks is empty until asked
        if(!tr) throw new Error('the clock track ' + key + ' has no record');
        /* MOVE AWAY FROM THE ASSERTED STATE FIRST.  Starting with the rig
           already dark and the pointer already at 0 would pass against a
           build with no gate at all (TRAPS). */
        if(f.level !== 0) throw new Error('this case needs channel 1 dark to begin with');
        deskOn(DESK_DARK());
        at('#btnGo').click();
        if(nextCue !== 0) throw new Error('GO moved the pointer to ' + nextCue + ' with a desk driving');
        if(f.level !== 0) throw new Error('GO put channel 1 up to ' + f.level + ' with a desk driving');
        tr.want = true;
        at('#btnTop').click();
        if(nextCue !== 0 || f.level !== 0) throw new Error('TOP fired its cue with a desk driving');
        /* TOP stops the show's sound BEFORE it fires (RULING BW), so a guard
           only in fireCue would silence the music and light nothing. */
        if(tr.want !== true) throw new Error('TOP stopped the show sound for a cue it never fired');
        deskQuiet();
        at('#btnGo').click();
        if(nextCue !== 1) throw new Error('the desk went quiet and GO still will not fire: pointer ' + nextCue);
        if(!(f.level > 0.9)) throw new Error('the desk went quiet and the cue did not light: ' + f.level);
        at('#btnTop').click();
        if(tr.want !== false) throw new Error('the desk went quiet and TOP no longer lets go of the transport');
        /* BACK is the one that needed its own guard rather than fireCue's: it
           rewinds the pointer BEFORE it ever gets there. */
        /* ENTER AT 2, NOT 1.  A working BACK rewinds by two and fireCue then
           advances by one, so from a pointer of 1 both "refused" and "worked"
           leave it at 1 — and a goBack that did nothing at all passed this
           clause.  From 2 the two answers are 2 and 1. */
        nextCue = 2;
        deskOn(DESK_DARK());
        at('#btnBack').click();
        if(nextCue !== 2) throw new Error('BACK rewound the pointer to ' + nextCue + ' with a desk driving');
        deskQuiet();
        at('#btnBack').click();
        if(nextCue !== 1) throw new Error('the desk went quiet and BACK did nothing: pointer ' + nextCue);
        /* AND THE PATH THAT REACHES fireCue WITHOUT ANY OF THE THREE: a
           double-click on a cue row.  GO, BACK and TOP guard themselves, so
           without this clause fireCue's own guard — the one that also covers
           the script engine and an armed follow — would be unasserted. */
        deskOn();
        const rows = document.querySelectorAll('#cuelist .cue');
        if(rows.length !== 2) throw new Error('the cue list shows ' + rows.length + ' rows for a two-cue stack');
        setLevel(1, 0.0, 0);
        rows[0].dispatchEvent(new MouseEvent('dblclick'));
        if(f.level !== 0) throw new Error('a double-click on a cue row fired it with a desk driving: ' + f.level);
        deskQuiet();
        rows[0].dispatchEvent(new MouseEvent('dblclick'));
        if(!(f.level > 0.9)) throw new Error('the desk went quiet and a cue row will not fire: ' + f.level);
        /* AND WHY GO NEEDS A GUARD OF ITS OWN rather than inheriting fireCue's:
           cueFiredByHand SEEKS THE MUSIC to the cue (RULING BO) after fireCue
           has already refused it, so a guard only downstream would jump the
           show's sound to a cue that never fired.  The pointer and the rig
           cannot see that; the transport can. */
        CUES[1].at = 90;
        nextCue = 1;
        deskOn();
        tr.want = true; tr.seek = null;
        at('#btnGo').click();
        if(tr.seek !== null)
          throw new Error('GO seeked the music to ' + tr.seek + ' for a cue that never fired');
        deskQuiet();
        tr.want = true; tr.seek = null;
        at('#btnGo').click();
        if(tr.seek === null)
          throw new Error('the desk went quiet and GO no longer takes the music with it');
        artSetOn(false);
        return 'with a desk driving: pointer, rig and the MUSIC unmoved by GO, BACK, TOP and a cue row; with it quiet, all four work';
      } finally {
        CUES.length = 0;
        savedCues.forEach(c=>CUES.push(c));
        nextCue = savedNext;
        for(const k in BJ_AUDIO) audStop(k);
        artSetOn(false);
        refreshCues();
      }
    });

    P('a section fader and a submaster write nothing while a desk drives', ()=>{
      artSetOn(false);
      const strip = document.querySelectorAll('#chStrip .fx');
      if(!strip.length) throw new Error('the channel strip was never built');
      const btns = strip[0].querySelectorAll('button');      // 0 and FL
      const subs = document.querySelectorAll('#subs .sub');
      if(!subs.length) throw new Error('the submasters were never built');
      const rec = subs[0].querySelector('button'), fader = subs[0].querySelector('input');
      const f = chan(1);
      /* the board doing it, so the case starts somewhere it is not going */
      btns[1].click(); updateFades(2);
      if(!(f.level > 0.9)) throw new Error('the FL button does not work at all: ' + f.level);
      rec.click();                                            // sub 1 holds this look
      btns[0].click(); updateFades(2);
      if(f.level > 0.01) throw new Error('the 0 button does not work at all: ' + f.level);
      fader.value = 100; fader.dispatchEvent(new Event('input'));
      if(!(f.level > 0.9)) throw new Error('the submaster does not work at all: ' + f.level);
      /* the desk takes it, at FULL — so a refused 0 button and a refused
         submaster both read as "still the desk's 1.0", which is a different
         number from either thing the board was trying to do */
      deskOn();
      if(!(f.level > 0.99)) throw new Error('the desk did not take channel 1 to full: ' + f.level);
      btns[0].click(); updateFades(2);
      if(!(f.level > 0.99)) throw new Error('a fader button took channel 1 to ' + f.level + ' with a desk driving');
      fader.value = 20; fader.dispatchEvent(new Event('input'));
      if(!(f.level > 0.99)) throw new Error('the submaster took channel 1 to ' + f.level + ' with a desk driving');
      deskQuiet();
      btns[0].click(); updateFades(2);
      if(f.level > 0.01) throw new Error('the desk went quiet and the fader still cannot write: ' + f.level);
      artSetOn(false);
      return 'fader and submaster both refused mid-drive and both working again the moment the desk stopped';
    });

    P('the gel and the gobo are refused too — a section has three writers, not one', ()=>{
      artSetOn(false);
      const strip = document.querySelectorAll('#chStrip .fx');
      strip[0].dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
      if(selSec !== 0) throw new Error('the strip would not select section 0: ' + selSec);
      const col = at('#selColor'), gob = at('#goboSel'), f = chan(1);
      col.value = '#ff0000'; col.dispatchEvent(new Event('input'));
      if(f.color.getHexString() !== 'ff0000') throw new Error('the gel picker does not work at all: ' + f.color.getHexString());
      gob.value = '4'; gob.dispatchEvent(new Event('change'));
      if(f.gobo !== 4) throw new Error('the gobo picker does not work at all: ' + f.gobo);
      /* the desk gels it BLUE with gobo 2 — neither the red/4 the board just
         set nor the green/1 it is about to try, so a refusal cannot be
         confused with either of them */
      deskOn();
      if(f.color.getHexString() !== '0000ff' || f.gobo !== 2)
        throw new Error('the desk did not take the gel and gobo: ' + f.color.getHexString() + ' / ' + f.gobo);
      col.value = '#00ff00'; col.dispatchEvent(new Event('input'));
      if(f.color.getHexString() !== '0000ff')
        throw new Error('the gel picker recoloured a desk-driven fixture to ' + f.color.getHexString());
      gob.value = '1'; gob.dispatchEvent(new Event('change'));
      if(f.gobo !== 2) throw new Error('the gobo picker moved a desk-driven wheel to ' + f.gobo);
      deskQuiet();
      col.value = '#00ff00'; col.dispatchEvent(new Event('input'));
      gob.value = '1'; gob.dispatchEvent(new Event('change'));
      if(f.color.getHexString() !== '00ff00' || f.gobo !== 1)
        throw new Error('the desk went quiet and the board cannot gel or gobo: ' +
                        f.color.getHexString() + ' / ' + f.gobo);
      artSetOn(false);
      return 'gel and gobo both refused mid-drive and both working the moment the desk stopped';
    });

    P('the faders still MOVE while the desk drives — they stop writing, not reading', ()=>{
      /* the half of RULING EM that is easy to break by gating one function too
         many: syncSections is the read-back, and without it the strip freezes
         at whatever the board last set while the rig does something else. */
      artSetOn(false);
      const sec = SECTIONS[0];
      const cell = document.querySelectorAll('#chStrip .fx')[0].querySelector('.v');
      sec.chans.forEach(c=>setLevel(c, 1.0, 0));
      refreshChannelStrip();
      if(cell.textContent !== '100') throw new Error('the strip reads ' + cell.textContent + ' on a rig at full');
      deskOn();
      /* what an Art-Net frame will do to the rig, done the way it will do it */
      sec.chans.forEach(c=>setLevel(c, 0.33, 0));
      refreshChannelStrip();
      if(cell.textContent !== '33')
        throw new Error('the desk took the rig to 33 and the fader reads ' + cell.textContent);
      if(Math.abs(sec.level - 0.33) > 0.001) throw new Error('the section model reads ' + sec.level);
      artSetOn(false);
      return 'the desk moved the rig 100 -> 33 and the strip followed it down, with the board locked out of writing';
    });

    P('the transport keeps its clock and its music; only its cue-firing stands down', ()=>{
      /* jsdom media never leaves readyState 0, so audClockTrack can never
         return a running track here and the whole branch this ruling is about
         would be unreachable — the case would be decoration.  Stand one in. */
      const savedCues = CUES.slice(), savedNext = nextCue, realClock = audClockTrack;
      try{
        const fake = {el:{currentTime:100, volume:0, paused:false, readyState:4}, offset:0, vol:1};
        audClockTrack = ()=>fake;
        CUES.length = 0;
        setLevel(1, 1.0, 0);
        CUES.push({n:1, label:'transport', fade:0, follow:null, at:0, lx:snapshotLX(), fly:null,
                   sfx:null, house:HOUSE.house, work:HOUSE.work, practical:HOUSE.practical,
                   haze:RIG.haze, lobby:HOUSE.lobby});
        setLevel(1, 0.0, 0);
        nextCue = 0;
        const f = chan(1);
        deskOn(DESK_DARK());
        AUD.clock = false;
        /* THE SWEEP MUST NOT RUN AT ALL, not merely fail to land.  fireCue
           refuses on its own account, so a transport left ungated still walks
           into it AUD_CATCHUP times a frame and the operator gets forty
           refusals a frame for nothing — which the pointer and the rig cannot
           see, and this can. */
        const said = [], realToast = toast;
        toast = m=>{ said.push(String(m)); };
        try{ showAudioTick(1/60); } finally { toast = realToast; }
        if(said.length)
          throw new Error('the transport walked into the cue engine ' + said.length +
                          ' times in one frame: ' + JSON.stringify(said[0]));
        if(AUD.clock !== true) throw new Error('the transport stopped keeping time when the desk took the rig');
        if(nextCue !== 0) throw new Error('the transport fired a cue with a desk driving: pointer ' + nextCue);
        if(f.level !== 0) throw new Error('the transport lit channel 1 with a desk driving: ' + f.level);
        deskQuiet();
        showAudioTick(1/60);
        if(nextCue !== 1) throw new Error('the desk went quiet and the transport still will not fire: ' + nextCue);
        if(!(f.level > 0.9)) throw new Error('the desk went quiet and the transport cue did not light: ' + f.level);
        artSetOn(false);
        return 'clock kept, music kept, cue held back while the desk drove and fired the moment it stopped';
      } finally {
        audClockTrack = realClock;
        CUES.length = 0;
        savedCues.forEach(c=>CUES.push(c));
        nextCue = savedNext;
        artSetOn(false);
      }
    });

    P('the fly rail yields on BOTH surfaces, and the engine is left alone', ()=>{
      const home = STAGE;
      try{
        if(STAGE !== 'palace') stageSwitch('palace');
        artSetOn(false);
        const ls = FLY[0];
        flyOut(ls);
        const out = ls.target;
        at('#flyAllIn').click();
        if(!(ls.target < out - 0.5)) throw new Error('ALL IN does not work at all: ' + ls.target);
        deskOn();
        flyOut(ls);                       // the engine, which is NOT gated
        if(!(ls.target > out - 0.001))
          throw new Error('the ENGINE flyOut was gated too; a cue could not move a line: ' + ls.target);
        at('#flyAllIn').click();
        if(ls.target < out - 0.001) throw new Error('the desk-side ALL IN hauled a driven line to ' + ls.target);
        /* the headset's rail, found by META rather than by pixel (RULING DP) */
        VR.page = 'fly'; vrDrawConsole(true);
        const inBtn = VR.hits.find(h=>h.fly === ls.id && h.rail === 'in');
        if(!inBtn) throw new Error('the headset fly page has no IN region for lineset ' + ls.id);
        inBtn.fn();
        if(ls.target < out - 0.001) throw new Error('the headset hauled a driven line to ' + ls.target);
        deskQuiet();
        VR.page = 'fly'; vrDrawConsole(true);
        const in2 = VR.hits.find(h=>h.fly === ls.id && h.rail === 'in');
        in2.fn();
        if(!(ls.target < out - 0.5))
          throw new Error('the desk went quiet and the headset rail still will not haul: ' + ls.target);
        artSetOn(false);
        return 'desk rail and headset rail both refused mid-drive, both hauling again after, and flyOut itself untouched';
      } finally { artSetOn(false); if(STAGE !== home) stageSwitch(home); }
    });

    P('a hand on a rope is refused, and the refusal names ART-NET', ()=>{
      const home = STAGE;
      const said = [];
      const realToast = toast;
      try{
        if(STAGE !== 'palace') stageSwitch('palace');
        artSetOn(false);
        /* the grab path needs a controller and the ropes; it does not need a
           session, and the whole FakeXR rig would be a suite of its own */
        VR.controllers[0] = new T.Group();
        scene.add(VR.controllers[0]);
        vrBuildRopes();
        if(!VR.ropes.length) throw new Error('the stage built no ropes to take hold of');
        const r = VR.ropes[0];
        const put = ()=>{
          scene.updateMatrixWorld(true);
          const p = r.mesh.getWorldPosition(new T.Vector3());
          VR.controllers[0].position.copy(p);
          VR.controllers[0].updateMatrixWorld(true);
        };
        put(); vrSqueeze(0, true);
        if(!VR.held || VR.held.rope !== r) throw new Error('a hand cannot take this rope at all');
        vrSqueeze(0, false);
        if(VR.held) throw new Error('the hand would not let go before the case proper');
        deskOn();
        toast = m=>{ said.push(String(m)); };
        put(); vrSqueeze(0, true);
        toast = realToast;
        if(VR.held) throw new Error('a hand took hold of a desk-driven line');
        if(!said.length) throw new Error('the rope said nothing at all');
        if(said[said.length-1].indexOf('on ART-NET') < 0)
          throw new Error('the rope said ' + JSON.stringify(said[said.length-1]));
        deskQuiet();
        put(); vrSqueeze(0, true);
        if(!VR.held || VR.held.rope !== r)
          throw new Error('the desk went quiet and the rope still cannot be taken');
        vrSqueeze(0, false);
        artSetOn(false);
        return 'the rope refused the hand while the desk drove, said ' + JSON.stringify(said[said.length-1]) + ', and came back after';
      } finally {
        toast = realToast;
        VR.held = null;
        VR.controllers.length = 0;
        artSetOn(false);
        if(STAGE !== home) stageSwitch(home);
      }
    });

    P('the in-game GRAND still outranks the desk — what is NOT gated (RULING EM)', ()=>{
      const f = chan(1);
      const g0 = RIG.grand, b0 = RIG.blackout;
      try{
        deskOn();
        RIG.blackout = false; RIG.grand = 1;
        f.level = 1; f.lvlDur = 0;
        updateRig(1/60, 1);
        if(!(f._lvl > 0.5)) throw new Error('the fixture is not up to begin with: ' + f._lvl);
        RIG.grand = 0;
        updateRig(1/60, 1);
        if(f._lvl > 0.001) throw new Error('the grand did not take a desk-driven fixture out: ' + f._lvl);
        RIG.grand = 1; RIG.blackout = true;
        updateRig(1/60, 1);
        if(f._lvl > 0.001) throw new Error('blackout did not take a desk-driven fixture out: ' + f._lvl);
        return 'with a desk driving, the grand and the blackout still multiply the output to nothing — the safety outranks the desk';
      } finally { RIG.grand = g0; RIG.blackout = b0; artSetOn(false); }
    });

    /* ---- RULING EQ: the flys, through their own motor -------------------- */

    const flyFrame = (i, targetByte, speedByte)=>{
      const b = new Uint8Array(512);
      const o = artFlyBase() - 1 + i * 2;
      b[o] = targetByte; b[o + 1] = speedByte;
      return b;
    };

    P('a desk cannot drive a cloth through the deck (RULING EQ, INVARIANTS)', ()=>{
      const ws = deskOn();
      const ls = FLY[0];
      const lo = minTrimOf(ls);
      if(!(lo > 0.6)) throw new Error('line 1 has no goods on it, so this case cannot bite: ' + lo);
      ws.deliver(flyFrame(0, 0, 255)); artnetTick(1/60);
      if(ls.target < lo - 1e-9)
        throw new Error('byte 0 asked for ' + ls.target + ', below the ' + lo.toFixed(2) + 'm its goods reach');
      if(Math.abs(ls.target - lo) > 1e-6)
        throw new Error('byte 0 should be the lowest this line may come (' + lo.toFixed(2) + 'm), got ' + ls.target);
      ws.deliver(flyFrame(0, 255, 255)); artnetTick(1/60);
      if(Math.abs(ls.target - OUT_TRIM) > 1e-6)
        throw new Error('byte 255 should be the grid at ' + OUT_TRIM + ', got ' + ls.target);
      /* AND THE MIDDLE, which is the only place the mapping shows.  flyTo
         clamps, so a version that ramps from the DECK instead of from the
         goods floor still lands on lo at byte 0 and on the grid at 255 — the
         two ends agree and only the travel between them differs. */
      ws.deliver(flyFrame(0, 128, 255)); artnetTick(1/60);
      const mid = lo + (128 / 255) * (OUT_TRIM - lo);
      if(Math.abs(ls.target - mid) > 1e-6)
        throw new Error('byte 128 gave ' + ls.target.toFixed(2) + 'm; half the travel from ' +
          lo.toFixed(2) + ' to ' + OUT_TRIM + ' is ' + mid.toFixed(2));
      /* and it is the GOODS' floor, not the deck: a bare pipe goes lower */
      const bare = FLY.findIndex(l=>minTrimOf(l) < lo - 0.5);
      if(bare >= 0){
        ws.deliver(flyFrame(bare, 0, 255)); artnetTick(1/60);
        if(Math.abs(FLY[bare].target - minTrimOf(FLY[bare])) > 1e-6)
          throw new Error('a barer line did not get its own floor');
      }
      return 'byte 0 lands on ' + lo.toFixed(2) + 'm — where this line\\u2019s goods kiss the deck — and 255 on the grid at ' + OUT_TRIM;
    });

    P('speed byte 0 PARKS the line, whatever the target says (RULING EQ)', ()=>{
      const ws = deskOn();
      const ls = FLY[0];
      /* A RUNAWAY IS NOT A PARKED LINE, and RULING EQ leaves runaway physics
         alone on purpose.  An earlier case can leave one armed, and an
         instant flyTo cannot clear it — the runaway branch clears on
         target-vs-pos DIFFERING, and an instant move makes them equal — so
         the line would fall under gravity here and read as a parking bug. */
      ls.runaway = false; ls.flyVel = 0;
      flyTo(ls, OUT_TRIM, true);
      const at = ls.pos;
      /* a full-travel target with a dead speed byte */
      ws.deliver(flyFrame(0, 0, 0)); artnetTick(1/60);
      for(let i = 0; i < 120; i++){ artnetTick(1/60); updateFly(1/60); }
      if(Math.abs(ls.pos - at) > 1e-6)
        throw new Error('a parked line moved from ' + at.toFixed(2) + ' to ' + ls.pos.toFixed(2));
      /* AND IT IS NOT COMMANDED EITHER.  A version that writes the target and
         relies on the zero speed to hold the line still leaves it standing at
         one place while ordered to another — which updateFly reads as a move
         in progress, so the rail runs its start sound and never its stop. */
      if(Math.abs(ls.target - at) > 1e-6)
        throw new Error('a parked line is commanded to ' + ls.target.toFixed(2) + ' while standing at ' + at.toFixed(2));
      if(ls.moving) throw new Error('a parked line reads as MOVING, so the rail never stops making the sound');
      /* AND THE CASE THAT MATTERS MOST: a line caught MID-TRAVEL by a parked
         desk.  Everything above starts from a line already standing still, so
         "target equals pos" and "not moving" are both true before a single
         byte is applied — the setup satisfies two of the three assertions.
         A desk patched only for the 273 light channels sends zeros on
         274-301, so this is what the first real use does. */
      ls.runaway = false; ls.flyVel = 0;
      flyTo(ls, minTrimOf(ls), true);                       // start at the bottom
      ws.deliver(flyFrame(0, 255, 255)); artnetTick(1/60);  // and send it to the grid
      for(let i = 0; i < 20; i++) updateFly(1/60);
      if(!ls.moving) throw new Error('this clause needs a line actually travelling, and it is not');
      const caught = ls.pos;
      if(Math.abs(caught - ls.target) < 0.05) throw new Error('the line arrived before it could be caught');
      ws.deliver(flyFrame(0, 255, 0)); artnetTick(1/60);
      for(let i = 0; i < 60; i++) updateFly(1/60);
      if(Math.abs(ls.pos - caught) > 0.02)
        throw new Error('a line parked mid-travel drifted ' + Math.abs(ls.pos - caught).toFixed(3) + 'm');
      if(ls.moving)
        throw new Error('a line parked mid-travel still reads MOVING — the rail motor loop never stops');
      if(Math.abs(ls.target - ls.pos) > 0.02)
        throw new Error('a line parked mid-travel is still commanded to ' + ls.target.toFixed(2));
      /* and it is the SPEED that parks it, not a refusal to write: give it a
         speed and the same target now travels */
      ws.deliver(flyFrame(0, 0, 255)); artnetTick(1/60);
      for(let i = 0; i < 120; i++){ artnetTick(1/60); updateFly(1/60); }
      if(Math.abs(ls.pos - at) < 0.5)
        throw new Error('with a live speed byte the line still did not travel: ' + ls.pos.toFixed(2));
      return 'two seconds of a full-travel target at speed 0 moved it 0.00m; the same target at 255 moved it ' +
             Math.abs(ls.pos - at).toFixed(2) + 'm';
    });

    P('the desk speed is what the line travels at, and ls.speed is never written (RULING EQ)', ()=>{
      const ws = deskOn();
      const ls = FLY[0];
      const rigged = ls.speed;
      const travel = (byte)=>{
        flyTo(ls, OUT_TRIM, true);
        ws.deliver(flyFrame(0, 0, byte)); artnetTick(1/60);
        const from = ls.pos;
        for(let i = 0; i < 60; i++){ artnetTick(1/60); updateFly(1/60); }
        return Math.abs(ls.pos - from);
      };
      const full = travel(255), half = travel(128);
      if(ls.speed !== rigged)
        throw new Error('ls.speed was written to ' + ls.speed + ' — hangGoods would silently destroy that');
      if(Math.abs(full - ART_FLY_MAX) > 0.05)
        throw new Error('a second at byte 255 covered ' + full.toFixed(2) + 'm, not ART_FLY_MAX ' + ART_FLY_MAX);
      if(Math.abs(half - full / 2) > 0.1)
        throw new Error('byte 128 covered ' + half.toFixed(2) + 'm against ' + full.toFixed(2) + ' at full');
      /* and the rigged speed comes back the moment the desk stops */
      deskQuiet();
      flyTo(ls, OUT_TRIM, true);
      flyTo(ls, minTrimOf(ls));
      const from = ls.pos;
      for(let i = 0; i < 60; i++) updateFly(1/60);
      const board = Math.abs(ls.pos - from);
      if(Math.abs(board - rigged) > 0.05)
        throw new Error('with the desk quiet the line ran at ' + board.toFixed(2) + 'm/s, not its rigged ' + rigged.toFixed(2));
      artSetOn(false);
      return 'a second at 255 covered ' + full.toFixed(2) + 'm and at 128 covered ' + half.toFixed(2) +
             'm; ls.speed still ' + rigged.toFixed(2) + ' and back in charge once the desk stopped';
    });

    P('the traveler opens and shuts on its own channel (RULING EQ)', ()=>{
      const ws = deskOn();
      const trav = FLY.find(ls=>ls.goods && GOODS[ls.goodsKey] && GOODS[ls.goodsKey].traveler);
      if(!trav) throw new Error('nothing hung declares itself a traveler');
      /* it is the FIRST declaring line, not just any of them */
      const all = FLY.filter(ls=>ls.goods && GOODS[ls.goodsKey] && GOODS[ls.goodsKey].traveler);
      if(trav !== all[0]) throw new Error('the traveler channel found line ' + trav.id + ', not the first of ' + all.length);
      const speedByte = artFlyBase() - 1 + (trav.id - 1) * 2 + 1;
      const frame = (open, spd)=>{ const b = new Uint8Array(512);
        b[artSelBase() + 2] = open; b[speedByte] = spd; return b; };   // channel 310 (EZ)
      /* A DEAD UNIVERSE MOVES NO SCENERY, AND A CURTAIN IS SCENERY.  Written
         unconditionally this was the one thing 512 zeros DID move: the house
         curtain ran itself shut in front of the audience the instant the
         switch went on.  It is parked by its own line's speed byte. */
      trav.travTarget = 1;
      ws.deliver(new Uint8Array(512)); artnetTick(1/60);
      if(trav.travTarget !== 1)
        throw new Error('an unpatched universe shut the house curtain to ' + trav.travTarget);
      ws.deliver(frame(255, 255)); artnetTick(1/60);
      if(Math.abs(trav.travTarget - 1) > 1e-6) throw new Error('255 gave travTarget ' + trav.travTarget);
      ws.deliver(frame(0, 255)); artnetTick(1/60);
      if(trav.travTarget !== 0) throw new Error('0 gave travTarget ' + trav.travTarget);
      ws.deliver(frame(128, 255)); artnetTick(1/60);
      if(Math.abs(trav.travTarget - 128/255) > 1e-6) throw new Error('128 gave travTarget ' + trav.travTarget);
      artSetOn(false);
      return 'line ' + trav.id + ' carries it, first of ' + all.length + '; channel ' + (artSelBase() + 2) +
             ' shut, opened and half-opened it, and 512 zeros left it alone';
    });

    P('a desk move works the lock, because it goes through flyTo (RULING EQ)', ()=>{
      /* "applied via flyTo, which works the lock itself" is a clause of EQ,
         and a version that clamped and wrote ls.target directly would satisfy
         every other assertion in this file. */
      const ws = deskOn();
      const ls = FLY[0];
      ls.runaway = false; ls.flyVel = 0;
      /* a SHORT move at full desk speed, so the arrival happens inside the
         loop below rather than twenty seconds after it */
      const lo = minTrimOf(ls);
      flyTo(ls, lo + 1.0, true);
      ls.locked = true; ls.relock = false;
      ws.deliver(flyFrame(0, 0, 255)); artnetTick(1/60);     // byte 0 = down to lo
      if(ls.locked) throw new Error('the desk commanded a locked line and the lock stayed thrown');
      if(!ls.relock) throw new Error('the desk took the lock off and did not owe it back');
      updateFly(1/60);
      if(ls.locked) throw new Error('the line locked itself mid-travel');
      for(let i = 0; i < 300 && Math.abs(ls.target - ls.pos) > 0.004; i++) updateFly(1/60);
      if(Math.abs(ls.target - ls.pos) > 0.004)
        throw new Error('the line never arrived: ' + ls.pos.toFixed(2) + ' of ' + ls.target.toFixed(2));
      /* ONE MORE FRAME.  The loop stops the moment the gap closes, which is
         the frame BEFORE updateFly runs its arrival branch — and the arrival
         branch is where the flyman throws the lock back on. */
      updateFly(1/60);
      if(!ls.locked) throw new Error('the flyman never locked off on arrival');
      artSetOn(false);
      return 'a locked line: lock off on the command, still off mid-travel, thrown again on arrival — flyTo did the work';
    });

    P('a runaway is still a runaway, and a driving desk takes it back (RULING EQ)', ()=>{
      /* EQ says runaway physics are untouched.  Both halves matter: the fall
         must still happen, and writing the target must still end it. */
      const ws = deskOn();
      const ls = FLY[0];
      ws.deliver(flyFrame(0, 255, 255)); artnetTick(1/60);
      for(let i = 0; i < 400 && Math.abs(ls.target - ls.pos) > 0.004; i++){ artnetTick(1/60); updateFly(1/60); }
      const up = ls.pos;
      if(!(up > 10)) throw new Error('this case needs the line up at the grid, got ' + up.toFixed(2));
      /* a hand lets go at the rail with no lock thrown */
      ls.runaway = true; ls.flyVel = 0; ls.locked = false; ls.relock = false;
      ls.target = ls.pos;
      for(let i = 0; i < 30; i++) updateFly(1/60);
      if(!(ls.pos < up - 0.05)) throw new Error('the line did not fall at all: ' + ls.pos.toFixed(2));
      if(!ls.runaway) throw new Error('the runaway ended on its own with nothing writing a target');
      /* and the desk, which is driving, takes it back */
      ws.deliver(flyFrame(0, 255, 255)); artnetTick(1/60);
      for(let i = 0; i < 30; i++){ artnetTick(1/60); updateFly(1/60); }
      if(ls.runaway) throw new Error('a driving desk did not take the line back off the runaway');
      if(!(ls.pos > up - 5)) throw new Error('the line never flew back: ' + ls.pos.toFixed(2));
      artSetOn(false);
      return 'let go at ' + up.toFixed(2) + 'm it fell under gravity, and a desk commanding it ended the runaway and flew it back';
    });

    P('the desk speed applies ONLY while a desk drives (RULING EQ)', ()=>{
      /* the guarded read is one line in updateFly and it must not leak: a
         line still carrying an artSpeed after the handover would run at the
         desk's speed for ever. */
      const ws = deskOn();
      const ls = FLY[0];
      ws.deliver(flyFrame(0, 255, 26)); artnetTick(1/60);      // a very slow desk speed
      if(!(ls.artSpeed < 0.3)) throw new Error('this case needs a slow desk speed, got ' + ls.artSpeed);
      deskQuiet();
      if(typeof ls.artSpeed !== 'number') throw new Error('the case cannot prove the leak if the field is gone');
      flyTo(ls, minTrimOf(ls), true);
      flyTo(ls, OUT_TRIM);
      const from = ls.pos;
      for(let i = 0; i < 60; i++) updateFly(1/60);
      const moved = Math.abs(ls.pos - from);
      if(moved < ls.speed * 0.9)
        throw new Error('the desk went quiet and the line still ran at its Art-Net speed: ' + moved.toFixed(2) + 'm');
      artSetOn(false);
      return 'a line left holding a 0.20m/s Art-Net speed ran at its rigged ' + ls.speed.toFixed(2) + 'm/s once the desk stopped';
    });

    /* ---- RULINGS ER and ES: the two banded channels ---------------------- */

    P('the three bands land the three houses, on HIS splits (RULING ER)', ()=>{
      showLoad('beetlejuice');
      const sc = SHOW.scenes.find(s=>s.dress && s.dress.maitland && s.dress.deetz && s.dress.bj);
      if(!sc) throw new Error('the interior carries no dressings after a load');
      const ws = deskOn();
      const sel = artSelBase() - 1;
      const band = (byte)=>{ const b = new Uint8Array(512); b[sel] = byte;
        ws.deliver(b); artnetTick(1/60); return b; };
      /* READ THE GRAPH, NOT THE FIELD.  RULING CN holds two of the three
         houses out of the world entirely, so "which one is dressed" is a
         question about parentage — and a build that set dressOn and never
         called bjRedress would satisfy any assertion on the field alone. */
      const inWorld = ()=>Object.keys(sc.dress).filter(k=>{
        const g = sc.dress[k]; return g && g.parent; });
      const splits = [[0,'maitland'], [85,'maitland'], [86,'deetz'], [170,'deetz'],
                      [171,'bj'], [255,'bj']];
      for(const [byte, want] of splits){
        band(byte);
        const up = inWorld();
        if(up.length !== 1) throw new Error('byte ' + byte + ' left ' + up.length + ' houses in the world: ' + up.join(','));
        if(up[0] !== want) throw new Error('byte ' + byte + ' dressed ' + up[0] + ', and his split says ' + want);
      }
      return 'his splits exactly: 0 and 85 maitland, 86 and 170 deetz, 171 and 255 bj — one house in the world each time';
    });

    P('two identical frames redress ONCE (RULING ER)', ()=>{
      /* bjRedress detaches and re-attaches whole scene-graph nodes.  Running
         it 44 times a second would rebuild the graph on every packet.
         Counted through membership rather than a spy: take the dressing OUT
         of the world by hand, send the same band again, and see whether
         anything put it back. */
      const sc = SHOW.scenes.find(s=>s.dress && s.dress.maitland);
      const ws = deskOn();
      const sel = artSelBase() - 1;
      const b = new Uint8Array(512); b[sel] = 200;              // bj
      ws.deliver(b); artnetTick(1/60);
      const g = sc.dress[sc.dressOn];
      if(!g || !g.parent) throw new Error('the first frame did not dress the house');
      const home = g.parent;
      home.remove(g);
      for(let i = 0; i < 5; i++){ ws.deliver(b); artnetTick(1/60); }
      if(g.parent) throw new Error('an unchanged band redressed the house again — five packets, five graph rebuilds');
      /* and a CHANGED band still works */
      const c = new Uint8Array(512); c[sel] = 10;               // maitland
      ws.deliver(c); artnetTick(1/60);
      if(!sc.dress.maitland.parent) throw new Error('a changed band did not redress');
      return 'five identical packets rebuilt nothing; the next different one dressed the maitlands';
    });

    P('the sign is a FLY: target and speed, across its whole travel (RULING EZ)', ()=>{
      /* Jack: "make it so with aretnet the beetljuice sign moves like any
         other fly not just up floor and mid."  So it is two channels in the
         RULING EQ idiom and this SUPERSEDES the sign half of ES.  The three
         named stops (DH) survive as the SHOW's stops and stay reachable — the
         desk simply stops being a three-position switch. */
      const ws = deskOn();
      const x = SHOW.flyExtras.find(e=>e.key === 'bjSign');
      if(!x) throw new Error('the sign is not registered after a load');
      const st = flyExtraStops(x);
      if(!st || st.length !== 3) throw new Error('the sign declares ' + (st ? st.length : 0) + ' stops, not 3');
      const m = flyExtraMover(x);
      if(!m) throw new Error('the sign has no mover');
      /* THE ENDS ARE THE STOPS' OWN EXTENT, and it matters that they are not
         inOff/outOff: the FLOOR is BELOW what the two-state field calls IN
         (RULING DH found exactly that), so a build using the pair puts the
         deck out of reach and byte 0 lands on PRE-SHOW instead. */
      let lo = st[0].off, hi = st[0].off;
      for(const s of st){ if(s.off < lo) lo = s.off; if(s.off > hi) hi = s.off; }
      if(!(hi - lo > 1)) throw new Error('the sign has no travel to drive');
      const sign = (byte, sp)=>{ const b = new Uint8Array(512);
        b[artSelBase()] = byte; b[artSelBase() + 1] = (sp === undefined ? 255 : sp);
        ws.deliver(b); artnetTick(1/60); return m.target; };
      /* CONTINUOUS, not three positions: the middle of the fader is a place
         no stop is, which is the whole of what he asked for */
      for(const byte of [0, 53, 96, 128, 200, 255]){
        const want = lo + (byte / 255) * (hi - lo);
        const got = sign(byte);
        if(Math.abs(got - want) > 1e-6)
          throw new Error('byte ' + byte + ' aimed the sign at ' + got.toFixed(3) + ', not ' + want.toFixed(3));
      }
      /* and every named stop is still reachable, to within a byte */
      const step = (hi - lo) / 255;
      for(let i = 0; i < st.length; i++){
        const byte = Math.round(((st[i].off - lo) / (hi - lo)) * 255);
        const got = sign(byte);
        if(Math.abs(got - st[i].off) > step)
          throw new Error('no byte reaches ' + st[i].name + ' at ' + st[i].off.toFixed(2) +
            ' — byte ' + byte + ' gave ' + got.toFixed(2));
      }
      artSetOn(false);
      return 'the sign spans ' + lo.toFixed(2) + '..' + hi.toFixed(2) +
             'm continuously, and FLOOR/PRE-SHOW/UP are still reachable at bytes 0/' +
             Math.round(((st[1].off - lo) / (hi - lo)) * 255) + '/255';
    });

    P('the sign SPEED byte scales, and 0 is PARKED (RULING EZ)', ()=>{
      /* THIS IS THE HALF THAT RETIRES RULING EY's SIGN CASE.  Under ES the
         sign was banded and band 0 was the FLOOR, so the first frame of an
         unpatched universe hauled it 11.36m to the deck in full view.  With a
         speed byte, zeros park it and a desk patched only for the 273 light
         channels cannot touch it at all. */
      showLoad('beetlejuice');
      const x0 = SHOW.flyExtras.find(e=>e.key === 'bjSign');
      const m0 = flyExtraMover(x0);
      if(!m0) throw new Error('the sign has no mover');
      /* THE DECLARED SPEED, TAKEN BEFORE ANYTHING HAS DRIVEN ANYTHING.  Read
         afterwards it would be whatever the desk had just written, and every
         clause below would be measuring the mutation against itself. */
      const declared0 = m0.speed;
      if(!(declared0 > 0)) throw new Error('the sign declares no speed to protect');
      /* sc.mv RECORDS CARRY NO 'group' FIELD while sc.pmv records do — one of
         the two things docs/ARTNET.md exists to say, and it bit here first
         go.  A whole-group travel moves the SCENE's group. */
      const AXI = {x:12, y:13, z:14};
      const sgn = sceneFind(x0.scene);
      if(!sgn || !sgn.group) throw new Error('the sign scene has no group to watch');
      const world = ()=>{ scene.updateMatrixWorld(true);
                          return sgn.group.matrixWorld.elements[AXI[m0.axis]]; };
      const ws = deskOn();
      const x = x0, m = m0;
      /* PUT IT SOMEWHERE THAT IS NOT WHERE A ZERO FRAME WOULD SEND IT, or the
         case is satisfied by the state it starts in.  Byte 0 on the target
         channel means the FLOOR, so the sign goes UP first. */
      const st = flyExtraStops(x), top = st.length - 1;
      flyExtraToStop(x, top);
      for(let k = 0; k < 20000 && Math.abs(m.off - st[top].off) > 1e-4; k++) sceneMoveStep(1/60);
      if(Math.abs(m.off - st[top].off) > 1e-3) throw new Error('the setup could not put the sign up');
      const up = m.off, wasT = m.target;
      /* 512 ZEROS, for two seconds of frames, with the scene tick running */
      for(let f = 0; f < 120; f++){
        ws.deliver(new Uint8Array(512)); artnetTick(1/60); sceneMoveStep(1/60);
      }
      if(Math.abs(m.target - wasT) > 1e-6)
        throw new Error('a dead universe commanded the sign to ' + m.target.toFixed(2) + 'm');
      if(Math.abs(m.off - up) > 1e-6)
        throw new Error('a dead universe hauled the sign ' + Math.abs(m.off - up).toFixed(2) + 'm');
      /* AND THE SPEED IS A FRACTION OF THE HAUL'S OWN DECLARED SPEED, read
         off the record rather than off ART_FLY_MAX, which is the linesets' */
      const spd = (sp)=>{ const b = new Uint8Array(512);
        b[artSelBase()] = 255; b[artSelBase() + 1] = sp;
        ws.deliver(b); artnetTick(1/60); return m.artSpeed; };
      if(Math.abs(spd(255) - x.speed) > 1e-6)
        throw new Error('speed 255 gave ' + m.artSpeed + ', not the declared ' + x.speed);
      if(Math.abs(spd(128) - x.speed * (128 / 255)) > 1e-6)
        throw new Error('the speed byte does not scale: 128 gave ' + m.artSpeed);
      /* THE DECLARED SPEED SURVIVES BEING DRIVEN.  It is written to artSpeed,
         never to speed, exactly as RULING EQ does on the linesets — otherwise
         one touch of the fader would leave the show hauling at the desk's
         speed for the rest of the session. */
      /* READ THE DECLARED SPEED BACK OFF A LOCAL TAKEN BEFORE ANY DRIVING.
         Comparing m.speed against x.speed is the repo's standing failure
         mode — both are 2.6 from the moment showLoad runs, so the clause is
         satisfied by the state the setup left, and a build that wrote
         m.speed only at byte 255 would pass it. */
      if(m.speed !== declared0)
        throw new Error('the desk overwrote the sign\\u2019s own speed with ' + m.speed);
      /* AND THE PARK MUST CLEAR artSpeed, NOT JUST DECLINE TO WRITE IT.
         Found by a review's sixth negative check, and it was a real bug: the
         park returned early, so the last driven speed stayed on the record
         and sceneMvAdvance — which gates on artDriving(), not on the byte —
         went on using it. One touch of the fader left the SHOW hauling at the
         desk's speed for the rest of the session. The observable is the WALK,
         because the record alone reads perfectly fine. */
      spd(26);                                    // a tenth of the declared speed
      const bPark = new Uint8Array(512);
      bPark[artSelBase()] = 255; bPark[artSelBase() + 1] = 0;   // target, PARKED
      ws.deliver(bPark); artnetTick(1/60);
      const pFrom = world();
      flyExtraToStop(x, 0);                       // the SHOW hauls it, at ITS speed
      const PN = 60;
      for(let f = 0; f < PN; f++){ ws.deliver(bPark); artnetTick(1/60); sceneMoveStep(1/60); }
      const pWent = Math.abs(world() - pFrom);
      const pShow = declared0 * (PN / 60), pDesk = (26 / 255) * declared0 * (PN / 60);
      if(Math.abs(pWent - pDesk) < Math.abs(pWent - pShow))
        throw new Error('after a PARK the show hauled at ' + pWent.toFixed(4) +
          'm/s, which is the DESK\\u2019s stale ' + pDesk.toFixed(4) + ' rather than its own ' +
          pShow.toFixed(4) + ' — artSpeed outlived the park');
      /* AND IT HAS TO REACH THE WALK, which is the clause the record cannot
         prove.  Writing artSpeed is worth nothing unless sceneMvAdvance reads
         it — and the first draft of this case asserted only the record, so
         dropping the guarded read in p5c left every assertion above GREEN.
         Measure the distance the set covers in world space against the DESK's
         speed, which is deliberately nothing like the declared one. */
      const slow = 26;                              // ~1/10 of the declared speed
      const bDrive = new Uint8Array(512);
      bDrive[artSelBase()] = 0; bDrive[artSelBase() + 1] = slow;   // FLOOR, slowly
      ws.deliver(bDrive); artnetTick(1/60);
      const from = world(), N = 60;
      for(let f = 0; f < N; f++){ ws.deliver(bDrive); artnetTick(1/60); sceneMoveStep(1/60); }
      const went = Math.abs(world() - from);
      const wantDesk = (slow / 255) * x.speed * (N / 60);
      const wantShow = x.speed * (N / 60);
      if(Math.abs(went - wantShow) < Math.abs(went - wantDesk))
        throw new Error('the sign walked ' + went.toFixed(3) + 'm in a second, which is the SHOW\\u2019s ' +
          wantShow.toFixed(3) + ' rather than the desk\\u2019s ' + wantDesk.toFixed(3) +
          ' — artSpeed never reached sceneMvAdvance');
      if(Math.abs(went - wantDesk) > 0.02)
        throw new Error('the sign walked ' + went.toFixed(3) + 'm, not the desk\\u2019s ' + wantDesk.toFixed(3));
      artSetOn(false);
      return 'zeros held the sign at ' + up.toFixed(2) + 'm through 120 frames, 255 gave ' +
             x.speed + 'm/s and 128 gave half of it, and the declared speed survived';
    });

    P('the desk taking the rig back re-asserts the house band (RULING ER)', ()=>{
      /* every LIGHT channel says itself again every frame; this one speaks
         only on a change.  A desk that stutters past ART_STALE hands the
         board back (RULING EV says so explicitly) — and if a cue redresses
         while it is away, an unmoved fader would never correct it. */
      showLoad('beetlejuice');
      const sc = SHOW.scenes.find(s=>s.dress && s.dress.bj);
      const ws = deskOn();
      const b = new Uint8Array(512); b[artSelBase() - 1] = 200;   // bj
      ws.deliver(b); artnetTick(1/60);
      if(!sc.dress.bj.parent) throw new Error('the desk did not dress the bj house');
      deskQuiet();                                  // the board has it back
      bjDress(sc, 'maitland');
      if(!sc.dress.maitland.parent) throw new Error('the board could not redress while the desk was away');
      ws.deliver(b); artnetTick(1/60);              // the SAME byte, desk returns
      if(!sc.dress.bj.parent)
        throw new Error('the desk came back on an unmoved fader and the house stayed ' + sc.dressOn);
      artSetOn(false);
      return 'desk dressed bj, went quiet, a cue dressed the maitlands, and the desk took it back on the same byte';
    });

    P('a cue\\u2019s deferred dress does not outlive the desk (RULINGS ER, AY)', ()=>{
      /* RULING AY holds a dress until the set is out of sight.  One armed
         before the desk took over would fire at the next changeover and
         silently overwrite the desk with an older instruction. */
      showLoad('beetlejuice');
      const sc = SHOW.scenes.find(s=>s.dress && s.dress.bj);
      const ws = deskOn();
      SHOW.pendDress = {scene:sc.name || SHOW.scene, key:'deetz'};
      const named = sceneFind(SHOW.pendDress.scene);
      if(named !== sc) throw new Error('this case could not name the dressed scene for the deferral');
      const b = new Uint8Array(512); b[artSelBase() - 1] = 200;
      ws.deliver(b); artnetTick(1/60);
      if(SHOW.pendDress)
        throw new Error('a deferred dress to ' + SHOW.pendDress.key + ' survived the desk dressing the same scene');
      artSetOn(false);
      return 'the desk dressed bj and the cue\\u2019s owed deetz went with it — the newer instruction wins';
    });

    P('the sign is desk-owned now, so it is not also hand-hauled (RULINGS EM, EZ)', ()=>{
      /* the X-rows were ungated because nothing drove them.  RULING EZ gives
         the sign a TARGET and a SPEED channel and writes them every frame, so
         a hand-haul mid-drive is overwritten on the very next packet — which
         is a half-refusal, and the row has to yield instead. */
      showLoad('beetlejuice');
      const ws = deskOn();
      const x = SHOW.flyExtras.find(e=>e.key === 'bjSign');
      const st = flyExtraStops(x), m = flyExtraMover(x);
      const b = new Uint8Array(512);
      b[artSelBase()] = 255; b[artSelBase() + 1] = 255;          // UP, at full speed
      ws.deliver(b); artnetTick(1/60);
      if(Math.abs(m.target - st[2].off) > 1e-6) throw new Error('the desk did not aim the sign UP');
      /* the desk row, through the DOM */
      const rows = document.querySelectorAll('#flyExtraRows button, #lsTable button');
      let floor = null;
      document.querySelectorAll('button').forEach(bt=>{ if(bt.textContent.trim() === 'FLOOR') floor = bt; });
      if(!floor) throw new Error('the desk has no FLOOR button for the sign');
      floor.click();
      if(Math.abs(m.target - st[2].off) > 1e-6)
        throw new Error('the desk FLOOR button hauled a desk-driven sign to ' + m.target);
      /* AND THE HEADSET'S OWN BUTTON.  Draw the page first: without it
         VR.hits is empty, and a case that skips when it finds no button is a
         case that asserts nothing.  Found by meta, never by pixel. */
      VR.page = 'fly'; vrDrawConsole(true);
      const hit = VR.hits.find(h=>h.flyExtra === 'bjSign' && h.stop === 0);
      if(!hit) throw new Error('the headset fly page has no FLOOR button for the sign');
      if(!hit.fn) throw new Error('the headset FLOOR button has no handler to press');
      hit.fn();
      if(Math.abs(m.target - st[2].off) > 1e-6)
        throw new Error('the headset FLOOR button hauled a desk-driven sign to ' + m.target);
      deskQuiet();
      floor.click();
      if(Math.abs(m.target - st[0].off) > 1e-6)
        throw new Error('the desk stopped and the FLOOR button still cannot haul: ' + m.target);
      artSetOn(false);
      return 'the sign refused the desk row AND the headset row mid-drive, and hauled again the moment the desk stopped';
    });

    P('neither selector channel touches a show that has no such scenery (RULINGS ER, EZ)', ()=>{
      showLoad('lostboys');
      const ws = deskOn();
      const sel = artSelBase() - 1;
      /* A PLANTED SCENE, because Beetlejuice's interior is the only thing in
         the game carrying a dress at all — so "no such scenery" would pass
         against the weakest possible guard, one that accepted any dress. */
      const fake = {name:'a planted scene', dress:{maitland:{}}};
      SHOW.scenes.push(fake);
      try{
        const b0 = new Uint8Array(512); b0[sel] = 200;
        ws.deliver(b0); artnetTick(1/60);
        if(fake.dressOn)
          throw new Error('a scene carrying ONE of the three dressings was dressed to ' + fake.dressOn);
      } finally { SHOW.scenes.splice(SHOW.scenes.indexOf(fake), 1); }
      const before = SHOW.scenes.map(s=>s.dressOn === undefined ? '-' : String(s.dressOn)).join(',');
      const mv = SHOW.scenes.map(s=>s.mv ? s.mv.target : '-').join(',');
      const b = new Uint8Array(512);
      b[sel] = 200;                       // the house band
      b[sel + 1] = 200; b[sel + 2] = 255; // the sign, target AND speed (EZ)
      for(let i = 0; i < 5; i++){ ws.deliver(b); artnetTick(1/60); }
      if(SHOW.scenes.map(s=>s.dressOn === undefined ? '-' : String(s.dressOn)).join(',') !== before)
        throw new Error('the house selector dressed something in a show with no dressings');
      if(SHOW.scenes.map(s=>s.mv ? s.mv.target : '-').join(',') !== mv)
        throw new Error('the sign channel moved something in a show with no sign');
      /* AND THE BAND IS NOT REMEMBERED EITHER.  Loading Beetlejuice with the
         fader already at 200 must still dress on the first frame after — a
         version that recorded the band it could not apply would sit there
         showing the wrong house until somebody moved the fader. */
      showLoad('beetlejuice');
      ws.deliver(b); artnetTick(1/60);
      const sc = SHOW.scenes.find(s=>s.dress && s.dress.bj);
      if(!sc || !sc.dress.bj.parent)
        throw new Error('Beetlejuice loaded under a fader already at 200 and never dressed');
      /* AND RELOADING THE SAME SHOW IS A NEW SET OF SCENERY.  The production
         name has not changed, so a memory keyed on the name still reads as
         applied — and the fresh house sits there in its default dressing
         under a fader that has not moved.  Object identity is what changes. */
      showLoad('beetlejuice');
      const fresh = SHOW.scenes.find(s=>s.dress && s.dress.bj);
      if(fresh === sc) throw new Error('the reload did not build a new scene, so this clause proves nothing');
      if(fresh.dress.bj.parent) throw new Error('the reload came up already dressed; move it away first');
      const x2 = SHOW.flyExtras.find(e=>e.key === 'bjSign');
      const st2 = x2 && flyExtraStops(x2), m2 = x2 && flyExtraMover(x2);
      if(!m2 || !st2) throw new Error('the reloaded sign has no mover or no stops');
      /* RULING EZ: the sign has no band memory at all any more — it is a
         per-frame fly write — so what this clause now proves is that the
         write finds the RELOADED record.  Byte 200 is a metre, not a band,
         and it is computed off the reloaded sign's OWN declared stops. */
      let lo2 = st2[0].off, hi2 = st2[0].off;
      for(const s of st2){ if(s.off < lo2) lo2 = s.off; if(s.off > hi2) hi2 = s.off; }
      const want2 = lo2 + (200 / 255) * (hi2 - lo2);
      if(Math.abs(m2.target - want2) < 1e-6)
        throw new Error('the reloaded sign already reads ' + want2.toFixed(2) + ', so this clause proves nothing');
      ws.deliver(b); artnetTick(1/60);
      if(!fresh.dress.bj.parent)
        throw new Error('the same show reloaded under an unmoved fader never dressed — the band memory outlived its scenery');
      if(Math.abs(m2.target - want2) > 1e-6)
        throw new Error('the reloaded SIGN was never re-commanded: ' + m2.target.toFixed(3) +
          ', and byte 200 on its own travel is ' + want2.toFixed(3));
      artSetOn(false);
      return 'a show with neither scenery took nothing from either channel; the band was not banked while unusable, and a reload re-dressed under an unmoved fader';
    });

    /* ---- RULING EW: the writers EM's list forgot ------------------------- */

    P('standing by at the top does not half-refuse (RULING EW)', ()=>{
      const savedCues = CUES.slice(), savedNext = nextCue;
      try{
        CUES.length = 0;
        setLevel(1, 1.0, 0); setColorCh(1, '#00ff00', 0);
        CUES.push({n:0, label:'preset', fade:0, follow:null, lx:snapshotLX(), fly:null, sfx:null,
                   house:HOUSE.house, work:HOUSE.work, practical:HOUSE.practical,
                   haze:RIG.haze, lobby:HOUSE.lobby});
        nextCue = 0;
        const f = chan(1);
        deskOn();                       // full blue: unlike the green preset above
        if(f.color.getHexString() !== '0000ff') throw new Error('the desk did not take the colour');
        const said = [], realToast = toast;
        toast = m=>{ said.push(String(m)); };
        try{ standByAtTheTop(); } finally { toast = realToast; }
        /* it refused fireCue and then wrote all 39 fixtures itself: a toast
           saying the board had yielded, a frame of the wrong look, and a cue
           pointer that had moved */
        if(f.color.getHexString() !== '0000ff')
          throw new Error('the preset wrote a desk-driven fixture to ' + f.color.getHexString());
        if(Math.abs(f.level - 1) > 1e-6) throw new Error('the preset wrote a desk-driven level: ' + f.level);
        if(nextCue !== 0) throw new Error('the preset moved the cue pointer to ' + nextCue + ' with a desk driving');
        if(said.length) throw new Error('it refused and told the operator, then wrote anyway: ' + said[0]);
        deskQuiet();
        standByAtTheTop();
        if(nextCue !== 1 || f.color.getHexString() !== '00ff00')
          throw new Error('the desk went quiet and the preset will not stand by: ' + nextCue + '/' + f.color.getHexString());
        return 'refused whole with a desk driving — no write, no pointer move, no toast — and works the moment it stops';
      } finally { CUES.length = 0; CUES.push(...savedCues); nextCue = savedNext; artSetOn(false); }
    });

    P('the firelight stands down and comes back (RULING EW)', ()=>{
      const saved = SHOW.flicker;
      try{
        SHOW.flicker = {t:0, v:1, base:0.8, chans:[1]};
        const f = chan(1);
        updateStorm(1/60);
        if(!(f.level > 0.4)) throw new Error('the firelight does not drive channel 1 at all: ' + f.level);
        deskOn(DESK_DARK());
        if(f.level !== 0) throw new Error('the desk did not take channel 1 to 0');
        updateStorm(1/60); updateStorm(1/60);
        if(f.level !== 0) throw new Error('the firelight overrode a desk-driven channel to ' + f.level);
        deskQuiet();
        updateStorm(1/60);
        if(!(f.level > 0.4)) throw new Error('the desk went quiet and the firelight never came back: ' + f.level);
        return 'the flame stops writing while the desk drives and picks up again when it stops';
      } finally { SHOW.flicker = saved; artSetOn(false); }
    });

    P('an audience effect stands down, and can still be cleared afterwards (RULING EW)', ()=>{
      /* the sharp half: AUD.fx is only ever cleared by showCueFx, which only
         fireCue reaches — and RULING EM gates fireCue.  So an effect armed in
         the last cue before the handover could never be turned off again. */
      const saved = JSON.stringify(Object.keys(AUD.fx || {}));
      try{
        showCueFx({on:'blind', kind:'strobe', rate:6});
        const chans = audFxChans('blind');
        if(!chans.length) throw new Error('the blinder target names no channels');
        const lit = ()=>chans.some(c=>{ const x = chan(c); return x && x.level > 0.01; });
        let armed = false;
        for(let i = 0; i < 40 && !armed; i++){ audFxStep(0.05); armed = lit(); }
        if(!armed) throw new Error('the audience effect does not drive the blinders at all');
        deskOn(DESK_DARK());
        if(lit()) throw new Error('the desk did not take the blinders to 0');
        for(let i = 0; i < 40; i++){
          audFxStep(0.05);
          if(lit()) throw new Error('the audience effect overrode a desk-driven channel');
        }
        for(const c of chans){ const x = chan(c);
          if(x && x.colDur !== 0) throw new Error('it also armed a colour fade on a desk-driven fixture'); }
        deskQuiet();
        let back = false;
        for(let i = 0; i < 40 && !back; i++){ audFxStep(0.05); back = lit(); }
        if(!back) throw new Error('the desk went quiet and the effect never came back');
        /* and the thing that made this a ruling: it can still be turned off,
           because showCueFx is reachable without going through fireCue */
        showCueFx(null);
        if(Object.keys(AUD.fx).length) throw new Error('the effect could not be cleared after the handover');
        return 'the effect stood down under the desk, resumed when it stopped, and could still be cleared afterwards';
      } finally { artSetOn(false); if(saved === '[]') for(const k in AUD.fx) delete AUD.fx[k]; }
    });

    P('the pan, tilt and house sliders are refused too (RULING EW)', ()=>{
      /* these four write the rig DIRECTLY, bypassing setSection*, so EM's
         gates never saw them */
      const movers = SECTIONS.findIndex(s=>s.mover && s.chans);
      const saved = selSec;
      try{
        selSec = movers;
        const pan = at('#panR'), tilt = at('#tiltR'), hl = at('#hl'), wl = at('#wl');
        const f = chan(SECTIONS[movers].chans[0]);
        pan.value = 40; pan.dispatchEvent(new Event('input'));
        if(Math.abs(f.panT - 40) > 1e-6) throw new Error('the pan slider does not work at all: ' + f.panT);
        deskOn();                                  // full blue, pan byte 0 -> -170
        const dPan = f.panT, dTilt = f.tiltT, dHouse = HOUSE.house, dWork = HOUSE.work;
        if(Math.abs(dPan + 170) > 0.01) throw new Error('the desk did not take pan: ' + dPan);
        pan.value = 70;  pan.dispatchEvent(new Event('input'));
        tilt.value = -20; tilt.dispatchEvent(new Event('input'));
        hl.value = 80; hl.dispatchEvent(new Event('input'));
        wl.value = 60; wl.dispatchEvent(new Event('input'));
        if(f.panT !== dPan) throw new Error('the pan slider moved a desk-driven head to ' + f.panT);
        if(f.tiltT !== dTilt) throw new Error('the tilt slider moved a desk-driven head to ' + f.tiltT);
        if(HOUSE.house !== dHouse) throw new Error('the house slider wrote a desk-driven circuit: ' + HOUSE.house);
        if(HOUSE.work !== dWork) throw new Error('the work slider wrote a desk-driven circuit: ' + HOUSE.work);
        deskQuiet();
        pan.value = 70; pan.dispatchEvent(new Event('input'));
        if(Math.abs(f.panT - 70) > 1e-6) throw new Error('the desk stopped and the pan slider still cannot write');
        return 'pan, tilt, house and work all refused mid-drive and all working again the moment the desk stopped';
      } finally { selSec = saved; artSetOn(false); }
    });

    P('a running script HOLDS rather than fighting the desk (RULING EW)', ()=>{
      const wasRunning = Prog.running;
      try{
        /* DOUBLED backslashes: this is inside a probe template, which eats a
           single one, and a real newline in a quoted string is a parse error
           pointing at the eval rather than at this line (TRAPS). */
        runProgram('at 1 @ 100\\nwait 10\\nat 1 @ 0');
        stepProgram(1/60);
        const f = chan(1);
        if(!(f.level > 0.9)) throw new Error('the script does not drive channel 1 at all: ' + f.level);
        const pc = Prog.pc, wait = Prog.wait;
        deskOn(DESK_DARK());
        if(f.level !== 0) throw new Error('the desk did not take channel 1');
        const said = [], realToast = toast;
        toast = m=>{ said.push(String(m)); };
        try{ stepProgram(1/60); stepProgram(1/60); } finally { toast = realToast; }
        if(f.level !== 0) throw new Error('the script wrote a desk-driven channel to ' + f.level);
        if(Prog.pc !== pc) throw new Error('the script ran on invisibly: pc ' + pc + ' -> ' + Prog.pc);
        if(Math.abs(Prog.wait - wait) > 1e-9) throw new Error('the script burned its wait while held');
        if(said.length) throw new Error('the script raised ' + said.length + ' refusals in two frames');
        deskQuiet();
        stepProgram(1/60);
        if(Prog.wait >= wait) throw new Error('the desk stopped and the script did not pick up again');
        return 'held at pc ' + pc + ' with its wait intact, silent, and stepping again the moment the desk stopped';
      } finally { haltProgram(); Prog.running = false; artSetOn(false); }
    });

    /* ---- the gates and the row that had no assertions at all ------------- */

    P('every fly UI path is refused, not just the two that were tested', ()=>{
      const rows = document.querySelectorAll('#lsTable tbody tr');
      if(!rows.length) throw new Error('the fly table was never built');
      const ls = FLY[0];
      const btnOf = (row, label)=>{
        const bs = row.querySelectorAll('button');
        for(const b of bs) if(b.textContent.trim() === label) return b;
        return null;
      };
      const rowIn = btnOf(rows[0], 'IN');
      if(!rowIn) throw new Error('no IN button on the first lineset row');
      artSetOn(false);
      flyTo(ls, OUT_TRIM, true);
      rowIn.click();
      if(Math.abs(ls.target - OUT_TRIM) < 0.01) throw new Error('the row IN button does not work at all');
      deskOn();
      flyTo(ls, OUT_TRIM, true);
      const t0 = ls.target;
      rowIn.click();
      if(ls.target !== t0) throw new Error('a row IN button hauled a desk-driven line to ' + ls.target);
      at('#flyPreset').click();
      if(ls.target !== t0) throw new Error('the show-look preset hauled a desk-driven line to ' + ls.target);
      if(typeof flyStartOfShow === 'function'){ flyStartOfShow();
        if(ls.target !== t0) throw new Error('START OF SHOW hauled a desk-driven line to ' + ls.target); }
      if(typeof railCall === 'function'){ railCall('in');
        if(ls.target !== t0) throw new Error('a rail call hauled a desk-driven line to ' + ls.target); }
      deskQuiet();
      rowIn.click();
      if(ls.target === t0) throw new Error('the desk went quiet and the row IN button still will not haul');
      artSetOn(false);
      return 'row IN, the show-look preset, START OF SHOW and the rail call all refused, and hauling again once the desk stopped';
    });

    P('the ARTNET row really is refreshed by the frame loop, not only by hand', ()=>{
      /* the 10Hz call in p7's UI block.  The suite CAN drive the real loop —
         stages.js pumps window.__raf — so this does not have to go untested. */
      const el = at('#artState');
      if(!el) throw new Error('the DOM row has no state element');
      artSetOn(false);
      artSyncRow();
      const off = el.textContent;
      const tick = n=>{ for(let i = 0; i < n; i++){ const cb = window.__raf; window.__raf = null; if(cb) cb(Date.now() + i * 120); } };
      /* move the state WITHOUT touching the row, then let the loop find it */
      ART.on = true;
      if(el.textContent !== off) throw new Error('this case must change the state behind the row');
      tick(12);
      if(el.textContent === off)
        throw new Error('twelve frames of the real loop and the row still reads ' + JSON.stringify(off));
      return 'the row moved from ' + JSON.stringify(off) + ' to ' + JSON.stringify(el.textContent) + ' without anybody calling artSyncRow';
    });

    /* ---- RULINGS ET AND EX: the set movers, one target channel each ------
       NOTHING ABOVE THIS LINE HAS A SHOW LOADED, so every one of these cases
       loads Beetlejuice first — it is the show ET is for, and the only one of
       the five that carries any scene movers at all.

       AND WHERE THE CLAIM IS THAT A SET MOVED, IT IS READ OFF A WORLD MATRIX
       RATHER THAN A RECORD.  The set is FROZEN (lockShowStatic), so a group
       position that "moved" may be a number in an object and nothing on the
       stage.  scene.updateMatrixWorld(true) from the ROOT, never from the
       child, or the composition is against a stale parent (TRAPS).

       NOT every case does, and saying "every one" here was an overclaim a
       review caught.  The four that assert WHICH RECORD reads WHICH BYTE —
       declaration order, mv-before-pmv, the re-base, and the computed base —
       read m.target and nothing else, because the claim under test IS the
       record write.  That is only sound because the case below them proves
       separately that a target write becomes real world-space travel; without
       it the whole block would be marking its own homework. */

    const AX = {x:12, y:13, z:14};
    const mvWorld = (g, axis)=>{ scene.updateMatrixWorld(true); return g.matrixWorld.elements[AX[axis]]; };
    /* the channel order this suite believes, built the same way the ruling
       reads: SHOW.scenes in declaration order, sc.mv then sc.pmv.  It is only
       ever used to say WHICH record a channel should have moved — the cases
       below assert on metres, so a wrong order shows up as a wrong distance. */
    const mvHauled = sc => (SHOW.flyExtras || []).some(x=>x && x.scene === sc.name);
    const mvAll = ()=>{
      const out = [];
      for(const sc of SHOW.scenes){
        if(mvHauled(sc)) continue;               // the rail hauls it (CW, ES)
        if(sc.mv) out.push({scene:sc.name, name:'mv', m:sc.mv, g:sc.group});
        if(sc.pmv) for(const k in sc.pmv) out.push({scene:sc.name, name:k, m:sc.pmv[k], g:sc.pmv[k].group});
      }
      return out;
    };
    const mvOut = m => (typeof m.out === 'number') ? m.out : 0;
    /* RULING EX: 1..255 spans home..out, and 0 is NOT a position — it is the
       absence of a command, so mvWant has nothing to say about it. */
    const mvWant = (m, byte) => m.home + ((byte - 1) / 254) * (mvOut(m) - m.home);
    /* a frame carrying these bytes from artMoverBase() on — built off the
       FUNCTION, so a case that shifts the rig shifts the frame with it */
    const mvFrame = (bytes)=>{
      const b = new Uint8Array(512);
      const base = artMoverBase() - 1;
      for(let i = 0; i < bytes.length; i++) if(base + i < 512) b[base + i] = bytes[i];
      return b;
    };
    /* send a part somewhere and let the SCENE TICK take it there, so a case
       can start from a set that is genuinely standing in the wing rather than
       from a record that says so */
    const mvPark = (scName, part, to)=>{
      const m = sceneFind(scName).pmv[part];
      sceneMovePartTo(scName, part, to);
      for(let i = 0; i < 6000 && Math.abs(m.off - to) > 1e-4; i++) sceneMoveStep(1/60);
      if(Math.abs(m.off - to) > 1e-3)
        throw new Error('the setup could not get ' + scName + ':' + part + ' to ' + to);
      return m;
    };

    P('every set mover takes ONE channel, in declaration order (RULING ET)', ()=>{
      if(!showLoad('beetlejuice')) throw new Error('Beetlejuice would not load');
      const ws = deskOn();
      const list = mvAll();
      /* TWELVE, not thirteen: the show declares thirteen scene movers and the
         sign is the one the rail hauls, so it is addressed on 308 and is not
         on this map at all (CW, ES). */
      if(list.length < 10)
        throw new Error('only ' + list.length + ' movers were found; this show maps twelve');
      /* A DISTINCT BYTE PER CHANNEL.  A uniform frame is satisfied by any
         order at all — the whole claim here is WHICH mover reads WHICH byte,
         so two movers that swapped places have to land on wrong metres. */
      const bytes = list.map((x, i)=> 20 + i * 17);
      /* mvFrame writes into a Uint8Array, so a byte past 255 would WRAP and
         this case would quietly compare against a number never delivered */
      if(bytes[bytes.length - 1] > 255)
        throw new Error('this show grew to ' + bytes.length + ' movers; a distinct byte each no longer fits');
      ws.deliver(mvFrame(bytes)); artnetTick(1/60);
      const said = [];
      for(let i = 0; i < list.length; i++){
        const it = list[i], want = mvWant(it.m, bytes[i]);
        if(Math.abs(it.m.target - want) > 1e-6)
          throw new Error('channel ' + (artMoverBase() + i) + ' (' + it.scene + ':' + it.name +
            ') read byte ' + bytes[i] + ' as ' + it.m.target.toFixed(3) + 'm, not ' + want.toFixed(3));
        said.push(it.scene + ':' + it.name + ' ' + it.m.home.toFixed(2) + '..' + mvOut(it.m).toFixed(2));
      }
      /* and the block STOPS: the channel after the last mover belongs to
         nobody.  Under RULING EX a zero is silence rather than a position, so
         the block is driven to HOME with byte 1 and the channel past it is lit
         — a build that reads one channel too far puts the LAST mover at its
         out instead of its home, and a zeroed frame could not have told. */
      const past = [];
      for(let i = 0; i < list.length + 1; i++) past.push(i === list.length ? 255 : 1);
      ws.deliver(mvFrame(past)); artnetTick(1/60);
      for(const it of list){
        if(Math.abs(it.m.target - it.m.home) > 1e-6)
          throw new Error(it.scene + ':' + it.name + ' answered the channel PAST the block');
      }
      return list.length + ' movers on ' + artMoverBase() + '..' + (artMoverBase() + list.length - 1) +
             ': ' + said.join(', ');
    });

    P('a scene carrying both is driven mv FIRST, then its parts (RULING ET)', ()=>{
      /* NO SCENE IN THIS SHOW DECLARES BOTH — the graveyard has two part
         movers and no travel, the exterior a travel and no parts — so the
         half of the ruling that orders them inside a scene is unexercised by
         the data, and an implementation that read pmv first would have passed
         every case above.  So give one both, through the game's own
         declaration API rather than by poking a record together. */
      const cem = sceneFind('cemetery');
      if(!cem) throw new Error('there is no cemetery in this show');
      if(cem.mv) throw new Error('the graveyard already travels; this case no longer builds what it thinks');
      const n0 = mvAll().length;
      const z0 = cem.group.position.z;
      const auto0 = cem.group.matrixAutoUpdate;
      const ws = deskOn();
      try{
        sceneTravel(cem, 'z', -6, 2.0);            // home -6, no out, so 0 at byte 255
        const list = mvAll();
        if(list.length !== n0 + 1) throw new Error('the new travel did not take a channel');
        /* EVERY mover channel at 255 EXCEPT the first, which gets 128 — and
           128 rather than 1 because sceneTravel leaves the new travel AT its
           home, so a byte-1 reading would be the state the setup was already
           in (and byte 0 under RULING EX says nothing at all).  Read in the
           right order this frame says: the travel half way from -6 to 0, and
           the first hill at its out.  Read pmv-first it is the hill half way
           to ITS out and the travel at 0 — four numbers, and all four differ. */
        const bytes = [];
        for(let i = 0; i < list.length; i++) bytes.push(i === 0 ? 128 : 255);
        const wantMv = -6 + (127 / 254) * 6;
        if(Math.abs(cem.mv.target - wantMv) < 1e-6)
          throw new Error('this case is measuring the state it starts in');
        ws.deliver(mvFrame(bytes)); artnetTick(1/60);
        if(Math.abs(cem.mv.target - wantMv) > 1e-6)
          throw new Error('the first channel drove the travel to ' + cem.mv.target.toFixed(2) +
            'm; byte 128 on a travel homed at -6 with no out is ' + wantMv.toFixed(2));
        const hill = cem.pmv.hillR;
        if(Math.abs(hill.target - hill.out) > 1e-6)
          throw new Error('the second channel left hillR at ' + hill.target.toFixed(2) +
            'm; it should be its out at ' + hill.out.toFixed(2));
        return 'a scene given both reads its travel on ' + artMoverBase() +
               ' and its first part on ' + (artMoverBase() + 1);
      } finally {
        /* sceneTravel sets more than the record: it flags the group and turns
           matrixAutoUpdate back on, both of which lockShowStatic had cleared.
           Leaving them was harmless only because the next case reloads the
           show — which is a dependency between cases, not a cleanup. */
        cem.mv = null;
        cem.group.position.z = z0;
        if(cem.group.userData) delete cem.group.userData.sceneTravels;
        cem.group.matrixAutoUpdate = auto0;
        artSetOn(false);
      }
    });

    P('a desk target is WALKED to at the mover speed, never teleported (RULING ET)', ()=>{
      showLoad('beetlejuice');
      const sc = sceneFind('attic'), m = sc.pmv.all, i = mvAll().findIndex(x=>x.m === m);
      if(i < 0) throw new Error('the attic tracking mover is not on the map');
      /* THE RIGGED SPEED IS READ BEFORE A SINGLE BYTE HAS BEEN APPLIED, and
         that means before deskOn, which delivers a frame of its own.  RULING
         ET gives a set mover no speed channel at all; read afterwards, this
         number would be whatever the desk had just written to it and every
         timing assertion below would measure the mutation against itself. */
      const rigged = m.speed;
      const ws = deskOn();
      /* START IT IN THE WING.  Homed first, every assertion below would be
         true of a build that wrote nothing at all. */
      mvPark('attic', 'all', m.out);
      const away = mvWorld(m.group, m.axis);
      /* BYTE 1, not byte 0 — RULING EX makes 0 silence, and a silent channel
         would leave the attic in the wing and every assertion below vacuous */
      const bytes = []; for(let k = 0; k < i + 1; k++) bytes.push(k === i ? 1 : 0);
      ws.deliver(mvFrame(bytes)); artnetTick(1/60);
      if(Math.abs(m.target - m.home) > 1e-6)
        throw new Error('byte 1 asked for ' + m.target.toFixed(2) + 'm, not the home at ' + m.home);
      /* THE FRAME THE BYTE ARRIVES ON MOVES NOTHING.  This is the whole of
         "no teleporting": the write is the target, and the walk belongs to
         the scene tick. */
      if(Math.abs(mvWorld(m.group, m.axis) - away) > 1e-9)
        throw new Error('the set moved in world space on the frame the byte arrived — that is a teleport');
      if(Math.abs(m.off - m.out) > 1e-9)
        throw new Error('the offset jumped to ' + m.off.toFixed(2) + ' on the tick that took the byte');
      if(m.speed !== rigged)
        throw new Error('the desk wrote the mover speed to ' + m.speed + ' — ET gives set movers no speed channel');
      /* one scene tick is one speed x dt, and no more */
      sceneMoveStep(1/60);
      const step = Math.abs(mvWorld(m.group, m.axis) - away);
      if(Math.abs(step - rigged / 60) > 1e-6)
        throw new Error('one tick moved ' + step.toFixed(4) + 'm; the rigged speed says ' + (rigged / 60).toFixed(4));
      /* and the whole travel takes the time that speed says, in the world */
      const need = Math.abs(m.out - m.home) / rigged;
      let t = 1 / 60, n = 0;
      while(Math.abs(m.off - m.home) > 1e-4 && n++ < 20000){ sceneMoveStep(1/60); t += 1 / 60; }
      const moved = Math.abs(mvWorld(m.group, m.axis) - away);
      if(Math.abs(moved - Math.abs(m.out - m.home)) > 1e-3)
        throw new Error('the world matrix moved ' + moved.toFixed(3) + 'm against a ' +
          Math.abs(m.out - m.home).toFixed(3) + 'm travel — the record moved and the set did not');
      if(Math.abs(t - need) > 0.1)
        throw new Error('the walk took ' + t.toFixed(2) + 's; at ' + rigged + 'm/s it is ' + need.toFixed(2));
      artSetOn(false);
      return 'a desk byte walked the attic ' + moved.toFixed(2) + 'm in world space over ' + t.toFixed(2) +
             's at its own ' + rigged + 'm/s, and moved it 0.00m on the frame the byte landed';
    });

    P('the mover block RE-BASES on the show that is loaded (RULING ET)', ()=>{
      showLoad('beetlejuice');
      const old = sceneFind('attic').pmv.all, i = mvAll().findIndex(x=>x.m === old);
      /* TWO FRAMES, AND THE FIRST ONE IS THE SETUP.  A show loads with its
         parked sets AT their out (sceneShow strikes them there), so "the desk
         drove it to its out" is the state the reload already left it in — the
         first draft of this case asserted exactly that and passed against a
         build with the map cached at first use.  So the desk HOLDS it at out
         to come up, and the frame that is measured drives it HOME. */
      const hold = []; for(let k = 0; k < i + 1; k++) hold.push(k === i ? 255 : 0);
      const home = []; for(let k = 0; k < i + 1; k++) home.push(k === i ? 1 : 0);   // RULING EX: 1 is home
      /* a show with no scene machinery at all: the block is empty, and a
         frame that is all mover bytes must simply pass through it */
      showLoad('goeswrong');
      if(SHOW.scenes.length) throw new Error('this case wanted a show with no scenes; it has ' + SHOW.scenes.length);
      let ws = deskOn();
      const full = []; for(let k = 0; k < 40; k++) full.push(255);
      ws.deliver(mvFrame(full)); artnetTick(1/60);
      const held = old.target;
      showLoad('beetlejuice');
      const now = sceneFind('attic').pmv.all;
      if(now === old)
        throw new Error('the reload reused the same mover record, so nothing here can tell a cached map from a live one');
      if(Math.abs(now.out - now.home) < 1)
        throw new Error('the reloaded attic reads home ' + now.home + ' out ' + now.out +
          ' — with no travel between them this case cannot tell a write from a silence');
      ws = deskOn(mvFrame(hold));
      if(Math.abs(now.target - now.out) > 1e-6)
        throw new Error('the setup meant to leave the reloaded attic at its out and it reads ' + now.target.toFixed(2));
      ws.deliver(mvFrame(home)); artnetTick(1/60);
      if(Math.abs(now.target - now.home) > 1e-6)
        throw new Error('channel ' + (artMoverBase() + i) + ' left the NEW attic at ' +
          now.target.toFixed(2) + 'm, not its home at ' + now.home.toFixed(2));
      if(Math.abs(old.target - held) > 1e-9)
        throw new Error('the STRUCK show\\u2019s mover was written to ' + old.target.toFixed(2) +
          'm — the map is cached, and it is writing into a show that is gone');
      artSetOn(false);
      return 'the block emptied for a show with no scenery and came back pointed at the NEW record, ' +
             'walked from its out at ' + now.out.toFixed(2) + 'm to home while the struck one held at ' +
             held.toFixed(2) + 'm';
    });

    P('the mover block is where the RIG puts it, not at 310 (RULINGS EO, ET)', ()=>{
      showLoad('beetlejuice');
      const ws = deskOn();
      const m = sceneFind('attic').pmv.all, i = mvAll().findIndex(x=>x.m === m);
      const at0 = []; for(let k = 0; k < i + 1; k++) at0.push(k === i ? 1 : 0);   // RULING EX: 1 is home
      ws.deliver(mvFrame(at0)); artnetTick(1/60);
      if(Math.abs(m.target - m.home) > 1e-6) throw new Error('the setup did not home the attic first');
      /* a fortieth lantern moves every base after it by seven, and the mover
         block with them.  A frame built off artMoverBase() follows; a build
         that wrote 310 down reads seven channels short of it. */
      const ghost = {name:'a lantern that is not there', mover:false, level:0, lvlDur:0,
                     colDur:0, gobo:0, color:new T.Color()};
      FIXTURES.push(ghost);
      try{
        if(artMoverBase() !== 318)
          throw new Error('a 40th fixture left the mover block at ' + artMoverBase());
        const bytes = []; for(let k = 0; k < i + 1; k++) bytes.push(k === i ? 255 : 0);
        ws.deliver(mvFrame(bytes)); artnetTick(1/60);
        if(Math.abs(m.target - m.out) > 1e-6)
          throw new Error('with the block at 317 the attic read ' + m.target.toFixed(2) +
            'm — the base is written down somewhere, not computed');
      } finally { FIXTURES.pop(); }
      artSetOn(false);
      return 'a 40th lantern moved the mover block to 317 and the desk still found the attic';
    });

    P('a scene the RAIL hauls takes no mover channel at all (RULINGS CW, ES, ET)', ()=>{
      /* THE SIGN IS RULING ES\\u2019S, ON CHANNEL 308, AND ES WRITES ON A BAND
         CHANGE ONLY.  This block writes every frame, and a per-frame write
         beats a change-only one absolutely — so a mover channel on a hauled
         scene would not merely duplicate 308, it would make it dead on
         arrival: the stop lands, and the next packet hauls it back.
         ES itself is not in this build yet, so its own write is made here the
         way ES makes it, through flyExtraToStop — which is the collision. */
      showLoad('beetlejuice');
      const x = (SHOW.flyExtras || []).find(y=>y.key === 'bjSign');
      if(!x) throw new Error('the sign is not declared as a fly extra any more');
      const sc = sceneFind(x.scene), m = sc.mv;
      if(!m) throw new Error('the sign carries no travel, so nothing here can collide');
      const stops = flyExtraStops(x);
      if(!stops || stops.length < 2) throw new Error('the sign has no stops to be dragged off');
      const ws = deskOn();
      /* put it on its TOP stop and let the scene tick take it there */
      const top = stops.length - 1, want = stops[top].off;
      /* and the stop has to be somewhere a mover channel would NOT leave it:
         this travel is home 0 with no out, so every byte of it maps to 0 */
      if(Math.abs(want) < 1)
        throw new Error('the top stop is at ' + want + 'm, which is where a mover channel would put it anyway');
      flyExtraToStop(x, top);
      for(let k = 0; k < 20000 && Math.abs(m.off - want) > 1e-4; k++) sceneMoveStep(1/60);
      if(Math.abs(m.off - want) > 1e-3) throw new Error('the sign would not go to its stop for the setup');
      const up = mvWorld(sc.group, m.axis);
      /* EVERY BYTE OF EVERY CHANNEL from the base to the end of the universe,
         for two seconds of frames.  Not "the channel we think it would take" —
         if this block can reach the sign on ANY channel at all, this finds it. */
      const b = new Uint8Array(512);
      for(let k = artMoverBase() - 1; k < 512; k++) b[k] = 255;
      for(let f = 0; f < 120; f++){ ws.deliver(b); artnetTick(1/60); sceneMoveStep(1/60); }
      if(Math.abs(m.target - want) > 1e-6)
        throw new Error('the mover block commanded the sign to ' + m.target.toFixed(2) +
          'm, off its stop at ' + want.toFixed(2) + ' — channel 308 would be dead on arrival');
      if(Math.abs(mvWorld(sc.group, m.axis) - up) > 1e-6)
        throw new Error('the sign travelled ' + Math.abs(mvWorld(sc.group, m.axis) - up).toFixed(2) +
          'm in world space under a desk that has no business driving it');
      if(flyExtraAtStop(x) !== top)
        throw new Error('the sign is no longer reading as being at its stop');
      artSetOn(false);
      return 'the sign held its ' + stops[top].name + ' stop at ' + want.toFixed(2) +
             'm through 120 frames of every mover channel at 255 — the rail keeps what the rail hauls';
    });

    P('a record the desk cannot read is left alone, not run away with (RULING EX)', ()=>{
      /* typeof NaN is 'number', so the obvious guard is the one that does NOT
         catch the value that matters — and a NaN target makes sceneMvAdvance
         take its step branch every single frame (Math.abs(NaN) <= step is
         false), so the set walks off in +axis at its own speed and NEVER
         ARRIVES, with no error anywhere.  Unreachable through the game's own
         declaration API today; the safe guard costs the same as the broken
         one, and the failure it prevents is a runaway rather than a wrong
         number, which is why it is worth pinning. */
      showLoad('beetlejuice');
      const ws = deskOn();
      const sc = sceneFind('attic'), m = sc.pmv.all, i = mvAll().findIndex(x=>x.m === m);
      if(i < 0) throw new Error('the attic tracking mover is not on the map');
      const home0 = m.home, out0 = m.out;
      const bytes = []; for(let k = 0; k <= i; k++) bytes.push(k === i ? 200 : 0);
      try{
        /* A NaN NEAR END: no command at all, because there is nothing to
           interpolate FROM.  The target the show left is what stands. */
        m.home = NaN;
        m.target = -3.25;
        ws.deliver(mvFrame(bytes)); artnetTick(1/60);
        if(m.target !== -3.25)
          throw new Error('a NaN home was driven to ' + m.target + ' — the desk read a record it cannot read');
        m.home = home0;
        /* A NaN FAR END reads as NO far end, which is the existing fallback —
           a real number, and the set arrives.  Not "left alone": the two ends
           are not the same claim and the code does not treat them alike. */
        m.out = NaN;
        m.target = -3.25;
        ws.deliver(mvFrame(bytes)); artnetTick(1/60);
        const want = home0 + ((200 - 1) / 254) * (0 - home0);
        if(!Number.isFinite(m.target) || Math.abs(m.target - want) > 1e-6)
          throw new Error('a NaN out gave the target ' + m.target + ', not the 0 fallback at ' + want.toFixed(3));
        /* AND IT ARRIVES.  A runaway does not announce itself as a wrong
           number — it announces itself by never stopping, so the observable
           has to be the walk, not the record. */
        let n = 0;
        while(Math.abs(m.off - m.target) > 1e-4 && n++ < 20000) sceneMoveStep(1/60);
        if(n >= 20000 || !Number.isFinite(m.off))
          throw new Error('the mover never arrived: off ' + m.off + ' after ' + n + ' ticks');
        return 'a NaN home took no command and a NaN out fell back to 0, arriving in ' + n + ' ticks';
      } finally {
        m.home = home0; m.out = out0; artSetOn(false);
      }
    });

    P('the SET list yields on BOTH surfaces, and works again after (RULINGS EW, EX)', ()=>{
      /* PR 7 CREATES THIS GAP, SO PR 7 CLOSES IT.  Before the set movers had
         channels, calling a set on under a desk was harmless.  Now artMovers
         writes every frame, so ungated the changeover runs, the set is marked
         ON and drawn — and the very next frame puts it back wherever the
         desk's byte says, with a toast telling the operator it worked.  That
         is a HALF-REFUSAL, which RULING EW names as worse than either whole
         answer, and it was measured standing 9.75m into the wing.

         Driven through the DOM and through a vrHit region, never by calling
         sceneChangeTo — a detached row fires its handler perfectly well. */
      showLoad('beetlejuice');
      const sets = SHOW.scenes.filter(sc=>!sc.always);
      const want = sets.find(sc=>sc.name !== SHOW.scene);
      if(!want) throw new Error('this show has only one set, so nothing here can be refused');
      const was = SHOW.scene;
      const rowFor = (nm)=>{
        refreshSceneUI();
        const rows = document.querySelectorAll('#sceneList .cue');
        if(!rows.length) throw new Error('the set list has no rows at all');
        for(const r of rows) if(r.dataset.s === nm) return r;
        throw new Error('no set row for ' + nm);
      };
      const row = rowFor(want.name);
      const ws = deskOn();
      row.onclick();
      if(SHOW.scene !== was)
        throw new Error('the desk set list called ' + SHOW.scene + ' on while a desk was driving');
      VR.page = 'sets'; vrDrawConsole(true);
      const btn = VR.hits.filter(h=>h.setCall).find(c=>c.setCall === want.name);
      if(!btn) throw new Error('there is no VR call button for ' + want.name);
      btn.fn();
      if(SHOW.scene !== was)
        throw new Error('the VR set list called ' + SHOW.scene + ' on while a desk was driving');
      /* AND THE OTHER HALF (RULING EV): the moment the desk stops, it works.
         Without this the case is satisfied by a set list that never works. */
      artSetOn(false);
      rowFor(want.name).onclick();
      if(SHOW.scene !== want.name)
        throw new Error('the set list refused with no desk driving — it is gated on the switch, not on the signal');
      return 'both set lists refused ' + want.label + ' while the desk drove, and the desk one called it on the moment the desk stopped';
    });

    P('the exclusion is keyed on the SCENE, and it shifts every channel after it (CW, ES)', ()=>{
      /* TWO CLAUSES OF THE RULING THAT TODAY'S DATA CANNOT TELL APART, and
         both were found by a review running mutations that did NOT fire.

         (1) THE ONLY HAUL IN THE GAME IS {key:'bjSign', scene:'bjSign'} —
             key and scene are the SAME STRING, so a build matching on the KEY
             instead of the scene passes every other case in this file.
         (2) bjSign is the LAST scene declared, so skipping it and consuming
             its channels before skipping it number every other mover
             identically.  "Takes NO channel" was tested only as "takes no
             write"; the channel-SHIFTING half was decoration.

         ONE FIXTURE KILLS BOTH: a second haul whose key is NOT its scene
         name, declared on the FIRST scene that carries movers. */
      showLoad('beetlejuice');
      const cem = sceneFind('cemetery'), house = sceneFind('house');
      if(!cem || !cem.pmv || !cem.pmv.hillR) throw new Error('the cemetery has no part movers to be excluded');
      if(!house || !house.mv) throw new Error('there is no house travel to be shifted');
      const before = mvAll();
      if(before[0].scene !== 'cemetery')
        throw new Error('the cemetery is no longer the first scene with movers; this case is built on that');
      const iBefore = before.findIndex(x=>x.m === house.mv);
      const nCem = before.filter(x=>x.scene === 'cemetery').length;
      if(iBefore < 0) throw new Error('the house travel is not on the map to begin with');
      if(!nCem) throw new Error('the cemetery contributes no channels, so excluding it shifts nothing');
      SHOW.flyExtras.push({key:'testHaul', label:'A HAUL WHOSE KEY IS NOT ITS SCENE',
                           scene:'cemetery', inOff:0, outOff:5, speed:2});
      const ws = deskOn();
      try{
        const after = mvAll();
        if(after.length !== before.length - nCem)
          throw new Error('the new haul did not take the cemetery off the map');
        const iAfter = after.findIndex(x=>x.m === house.mv);
        if(iAfter !== iBefore - nCem)
          throw new Error('the map moved the house travel to channel ' + (artMoverBase() + iAfter) +
            '; dropping ' + nCem + ' channels from channel ' + artMoverBase() + ' should put it on ' +
            (artMoverBase() + iBefore - nCem));
        /* THE HOUSE TRAVEL IS SENT OFF ITS OWN TARGET FIRST.  Its home and its
           out are BOTH 0 (it is the one-way channel), so a case that measured
           "target is 0" from where the show left it would be asserting the
           state it started in — which is the shape fifteen assertions in this
           round were green on. */
        sceneMoveTo('house', house.mv.home + 5);
        if(Math.abs(house.mv.target - house.mv.home) < 1e-6)
          throw new Error('the house travel would not move off its home for the setup');
        const hR = cem.pmv.hillR.target, hL = cem.pmv.hillL.target;
        const bytes = []; for(let k = 0; k <= iAfter; k++) bytes.push(k === iAfter ? 255 : 0);
        ws.deliver(mvFrame(bytes)); artnetTick(1/60);
        if(Math.abs(house.mv.target - mvWant(house.mv, 255)) > 1e-6)
          throw new Error('channel ' + (artMoverBase() + iAfter) + ' did not reach the house travel — ' +
            'the block did not shift when the cemetery left it');
        /* and a FULL universe, so nothing hides behind a zero */
        const all = new Uint8Array(512);
        for(let k = artMoverBase() - 1; k < 512; k++) all[k] = 255;
        ws.deliver(all); artnetTick(1/60);
        if(Math.abs(cem.pmv.hillR.target - hR) > 1e-6 || Math.abs(cem.pmv.hillL.target - hL) > 1e-6)
          throw new Error('every mover channel at 255 reached a HAULED scene\\u2019s part movers');
        return 'a haul keyed testHaul on the cemetery took its ' + nCem + ' channels off the map and moved the house travel from ' +
               (artMoverBase() + iBefore) + ' to ' + (artMoverBase() + iAfter);
      } finally {
        SHOW.flyExtras.pop();
        artSetOn(false);
      }
    });

    P('512 ZEROS MOVE NO SCENERY AT ALL (RULING EX)', ()=>{
      /* THIS CASE IS THE REVERSAL, AND IT IS WORTH SAYING WHAT IT REVERSED.
         ET as first written gave byte 0 the meaning 'home', and measured, a
         frame of 512 zeros commanded every mover in the loaded show home —
         it walked the parked attic 19.50m onto the deck while it was drawn
         and flew the exterior cloth in.  A desk patched only for the 273
         light channels sends exactly this frame, which is the likeliest first
         real use, and RULING EQ says in as many words that a dead universe
         moves no scenery.  Jack ruled it PARKED UNLESS DRIVEN, so 0 is the
         absence of a command and 1..255 spans home..out. */
      showLoad('beetlejuice');
      const ws = deskOn();
      const sc = sceneFind('attic'), m = sc.pmv.all;
      const list = mvAll();
      /* EVERY ONE OF THEM SENT SOMEWHERE THAT IS NOT ITS HOME FIRST, through
         the game's own move calls — deskOn has itself just delivered a frame
         with zeros across this block, so a case that measured from there would
         be asserting the state it started in.  A whole-group travel is moved
         by sceneMoveTo and a part by sceneMovePartTo; the part movers have an
         out to go to and the three travels are simply sent 5m off home. */
      for(const it of list){
        if(it.name === 'mv') sceneMoveTo(it.scene, it.m.home + 5);
        else sceneMovePartTo(it.scene, it.name, mvOut(it.m));
        if(Math.abs(it.m.target - it.m.home) < 1e-6)
          throw new Error(it.scene + ':' + it.name + ' would not move off its home for the setup');
      }
      mvPark('attic', 'all', m.out);
      const drawn = !sc.group.userData.sceneOff;
      const away = mvWorld(m.group, m.axis);
      const held = list.map(it=>it.m.target);
      /* TWO SECONDS OF AN UNPATCHED UNIVERSE, with the scene tick running
         between the frames.  Not one frame: the old behaviour needed the
         scene tick to show itself at all — the write was the target and the
         walk belonged to sceneMoveStep — so a case that delivered one frame
         and read the world matrix would have passed against the build this
         reverses. */
      for(let f = 0; f < 120; f++){
        ws.deliver(new Uint8Array(512));          // an unpatched universe, exactly
        artnetTick(1/60);
        sceneMoveStep(1/60);
      }
      for(let k = 0; k < list.length; k++){
        const it = list[k];
        if(Math.abs(it.m.target - held[k]) > 1e-6)
          throw new Error(it.scene + ':' + it.name + ' was commanded to ' + it.m.target.toFixed(2) +
            'm by 512 zeros; the show had left it asking for ' + held[k].toFixed(2));
      }
      const moved = Math.abs(mvWorld(m.group, m.axis) - away);
      if(moved > 1e-6)
        throw new Error('the parked attic walked ' + moved.toFixed(2) +
          'm under a dead universe — RULING EQ says a dead universe moves no scenery');
      artSetOn(false);
      return 'all ' + list.length + ' movers held their own targets through 120 frames of 512 zeros, and the parked attic moved 0.00m' +
             (drawn ? ' — which matters because it is drawn while it is parked' : '');
    });

    P('a zero is silence, not a STOP — a move the show started runs on (RULING EX)', ()=>{
      /* WHERE THIS PARTS COMPANY WITH THE FLYS, and the difference is real.
         RULING EQ makes a fly line's speed byte 0 a STOP — the line is parked
         where it stands and its target is rewritten to its position, because
         a line that kept a target it was not at left ls.moving set and the
         rail motor loop playing for the rest of the session.  A set mover has
         no such loop and no such flag: sceneMvAdvance simply walks its offset
         towards its target.  So silence here means the show's own move carries
         on to the end, which is what "the desk is not driving this" should
         look like — and a build that wrote m.target = m.off on a zero would
         freeze the show mid-changeover every frame a dead desk was connected. */
      showLoad('beetlejuice');
      const ws = deskOn();
      const sc = sceneFind('attic'), m = sc.pmv.all;
      mvPark('attic', 'all', m.out);
      const away = mvWorld(m.group, m.axis);
      const travel = Math.abs(m.out - m.home);
      if(travel < 1) throw new Error('the attic has no travel to be stopped mid-way through');
      sceneMovePartTo('attic', 'all', m.home);     // the SHOW asks for home
      for(let f = 0; f < 30; f++){ ws.deliver(new Uint8Array(512)); artnetTick(1/60); sceneMoveStep(1/60); }
      const part = Math.abs(mvWorld(m.group, m.axis) - away);
      if(part < 1e-3)
        throw new Error('thirty frames of silence froze a move the show had started');
      if(Math.abs(m.target - m.home) > 1e-6)
        throw new Error('the desk overwrote the show\\u2019s target with ' + m.target.toFixed(2) + 'm');
      for(let k = 0; k < 20000 && Math.abs(m.off - m.home) > 1e-4; k++){
        ws.deliver(new Uint8Array(512)); artnetTick(1/60); sceneMoveStep(1/60);
      }
      const moved = Math.abs(mvWorld(m.group, m.axis) - away);
      if(Math.abs(moved - travel) > 1e-3)
        throw new Error('the move stopped ' + moved.toFixed(2) + 'm into a ' + travel.toFixed(2) + 'm travel');
      artSetOn(false);
      return 'a move the show started ran its full ' + moved.toFixed(2) +
             'm through a dead universe — 0 is silence, not a stop';
    });

    console.log(window.__errs.length ? '--- part one failures: '+window.__errs.length+' ---'
                                     : '--- part one failures: 0 ---');
    window.__errs.forEach(e=>console.log('  '+e));
  })();
`;

  const script = html.match(/<script>([\s\S]*)<\/script>/g).pop().replace(/<\/?script>/g, '');
  try{ w.eval(script + probe); }
  catch(e){
    console.log('PART ONE THREW: ' + e.message);
    if(e.stack) console.log(e.stack.split('\n').slice(0, 6).join('\n'));
    errs.push('part one threw: ' + e.message);
  }
  for(const e of (w.__errs || [])) errs.push(e);
}

/* ==========================================================================
   PART ONE AND A HALF — THE LIST THAT CANNOT DRIFT (RULINGS EO and FA)

   RULING EO says docs/ARTNET.md is GENERATED and "cannot drift from the code
   because it is read off the code".  That is only true while something checks
   it, so this runs tools/artnet-map.js — a second jsdom boot of the same
   built file, in its own process, which is why it is not folded into part one
   — and compares its output with the committed file.

   RULING FA SAYS WHAT SHAPE THE FILE TAKES: two header lines, a blank, and
   then ONE LINE PER CHANNEL from channel 1 to the last one in use, in numeric
   order, with no gaps.  That is checked separately below, and it is not
   pedantry — THE LINE DIFF CANNOT SAY WHAT THE TWO TEXTS AGREE ON.  A probe
   that quietly stopped emitting a block would be regenerated into a committed
   file matching it perfectly, and every check here would stay green over a
   list with a hole in it.  The probe holds the same check on its own rows
   (SELF-CHECK 10); this one is an independent reading of what was committed.

   WHAT IS COMPARED, INCLUDING THE FIRST LINE.  The probe's first line is the
   byte size of the built file it read.  It is there because a probe that
   reads the BUILT artifact measures the LAST BUILD, so an src-only edit
   leaves it describing bytes nobody is running (TRAPS, last entry).

   IT USED TO BE EXEMPT FROM THE COMPARISON AND THAT MADE IT THE ONE NUMBER IN
   A GENERATED FILE THAT NOTHING VERIFIED.  The bound that was supposed to
   cover it — "the PROBE's number is checked against the real byte size" — is
   a tautology: the probe gets that number by calling statSync on the same
   path this suite then calls statSync on, in the same run, so the two agree
   whatever the committed file says.  Setting the committed line to "1 bytes"
   left this suite at zero failures.

   So the committed number is compared to the probe's, and the shape checks
   stay on both sides.  The comparison is a VALUE comparison rather than a
   line diff, so the failure can say what actually happened — the map was
   generated against a different build — instead of pointing at line 1 of a
   text diff.  The cost is real and is written into the map itself: an src
   change now needs `node tools/artnet-map.js > docs/ARTNET.md` alongside the
   rebuild.  That is the same cost the repo already pays for committing
   the-house.html built, and it is what makes the whole file, first line
   included, a thing that was measured rather than typed.

   The body is still compared line for line from the second line down, so
   every label, band, metre, warning and channel number is checked; and no
   OTHER line may begin with the size prefix, so the first line cannot be
   widened into a hole by moving text into it.

   WHAT NONE OF THIS CATCHES: a stale BUILD.  An src-only edit leaves a stale
   the-house.html, the probe reads it, this suite stats the same stale file,
   and every number agrees with every other.  `sh build.sh` first.
   ========================================================================== */
{
  const name = 'docs/ARTNET.md is exactly what tools/artnet-map.js emits now, ' +
               'one line per channel with no gaps (RULINGS EO, FA)';
  const MAP_HEAD = 'THE BUILT FILE  the-house.html  ';
  const MAP_TAIL = ' bytes  (generated by tools/artnet-map.js)';
  /* the size line, checked WITHOUT a regex.  TRAPS: a backslash in a regex is
     eaten by a probe template — this block is not inside one, but indexOf is
     exact and immune either way, which is the advice that entry ends with. */
  const sizeOf = line=>{
    if(typeof line !== 'string') return null;
    if(line.indexOf(MAP_HEAD) !== 0) return null;
    if(line.length <= MAP_HEAD.length + MAP_TAIL.length) return null;
    if(line.slice(line.length - MAP_TAIL.length) !== MAP_TAIL) return null;
    const mid = line.slice(MAP_HEAD.length, line.length - MAP_TAIL.length);
    if(!mid.length) return null;
    for(const c of mid) if(c < '0' || c > '9') return null;
    return +mid;
  };
  /* THE PROBE'S OWN MESSAGE, NOT THE TEMPLATE OF IT.  Node's uncaught-throw
     format is `path:line`, the RAW SOURCE of the throw statement, a caret and
     a blank line — and only THEN `Error: <the substituted message>`.  Slicing
     the first four lines therefore printed the source of the throw and never
     the channel numbers and metres the message was built to name, which is
     the whole reason the self-checks build them.  No regex: a backslash in
     one is eaten by a probe template, and indexOf is exact either way. */
  const probeErr = txt=>{
    const lines = String(txt || '').split('\n');
    const named = [];
    for(const line of lines){
      if(line.indexOf('    at ') === 0) continue;          // a stack frame
      const t = line.trim();
      if(!t || t.indexOf('throw ') === 0) continue;        // the raw source of the throw
      if(t.indexOf('Error: ') < 0) continue;
      named.push(t);
      if(named.length >= 4) break;
    }
    if(named.length) return named.join(' | ');
    return lines.map(s=>s.trim()).filter(Boolean).slice(0, 4).join(' | ');
  };
  try{
    /* required HERE rather than at the top of the file: this whole case is one
       contiguous block, so a branch that lands beside it has nothing to
       conflict with (TESTING — different insertion anchors). */
    const {spawnSync} = require('child_process');
    const MAP = path.join(__dirname, '..', 'tools', 'artnet-map.js');
    const DOC = path.join(__dirname, '..', 'docs', 'ARTNET.md');
    const BUILT = path.join(__dirname, '..', 'the-house.html');
    /* NODE_PATH is handed over rather than assumed: the probes are documented
       as needing it exported, and a map that only matches when an environment
       variable happens to be set would fail for a reason that has nothing to
       do with the channels. */
    /* A TIMEOUT, BECAUSE THIS BLOCK IS OUTSIDE THE SUITE'S OWN WATCHDOG.
       spawnSync blocks the event loop, so the watchdog timer cannot fire
       while the probe runs — a jsdom boot that never returns would hang
       `npm test` for ever with no output and nothing to kill. */
    const r = spawnSync(process.execPath, [MAP], {encoding:'utf8', maxBuffer: 64*1024*1024,
      timeout: 120000,
      env: Object.assign({}, process.env, {NODE_PATH: path.join(__dirname, 'node_modules')})});
    /* THE TIMEOUT ARRIVES DIFFERENTLY ON DIFFERENT PLATFORMS, and both ways
       have to say the same thing.  On Windows spawnSync sets `error` with code
       ETIMEDOUT and never reaches the signal branch; elsewhere the child is
       SIGTERMed and comes back with `signal` set and `status` null. */
    if(r.error)
      throw new Error('the map probe would not run: ' + r.error.message +
        (String(r.error.code) === 'ETIMEDOUT'
          ? ' — it ran past the 120s timeout and was killed' : ''));
    /* ON A KILL, `status` IS null AND `signal` CARRIES THE REASON — a message
       reading "exited null" names nothing an operator can act on. */
    if(r.signal)
      throw new Error('the map probe was killed by ' + r.signal +
        (r.signal === 'SIGTERM' ? ' — it ran past the 120s timeout' : ''));
    if(r.status !== 0)
      throw new Error('the map probe exited ' + r.status + ' — ' + probeErr(r.stderr));
    const got = String(r.stdout).split('\n');
    const want = fs.readFileSync(DOC, 'utf8').split('\n');

    const gotSize = sizeOf(got[0]), wantSize = sizeOf(want[0]);
    if(gotSize === null)
      throw new Error('the probe no longer prints the built file size first: ' +
        JSON.stringify(String(got[0]).slice(0, 80)));
    if(wantSize === null)
      throw new Error('docs/ARTNET.md no longer opens with the built file size: ' +
        JSON.stringify(String(want[0]).slice(0, 80)));
    const real = fs.statSync(BUILT).size;
    if(gotSize !== real)
      throw new Error('the probe says it read ' + gotSize + ' bytes of a ' + real +
        '-byte the-house.html — the file moved under the run');
    /* THE ONE THAT CAN ACTUALLY FIRE.  The line above compares two statSync
       calls on the same path in the same run; this one compares the COMMITTED
       number against the build in the tree. */
    if(wantSize !== gotSize)
      throw new Error('docs/ARTNET.md was generated against a ' + wantSize +
        '-byte the-house.html and the build in the tree is ' + gotSize + ' bytes — ' +
        'the map and the build are not from the same moment.\n' +
        '        rebuild first, then regenerate it: sh build.sh && ' +
        'node tools/artnet-map.js > docs/ARTNET.md');
    for(const lines of [got, want])
      for(let i = 1; i < lines.length; i++)
        if(lines[i].indexOf(MAP_HEAD) === 0)
          throw new Error('line ' + (i + 1) + ' also opens with the size prefix — the ' +
            'exempted line must be the first one and only the first one');

    for(let i = 1; i < Math.max(got.length, want.length); i++){
      if(got[i] === want[i]) continue;
      throw new Error('docs/ARTNET.md line ' + (i + 1) + ' has drifted from the code.\n' +
        '        committed: ' + JSON.stringify(String(want[i]).slice(0, 100)) + '\n' +
        '        the probe:  ' + JSON.stringify(String(got[i]).slice(0, 100)) + '\n' +
        '        regenerate it: node tools/artnet-map.js > docs/ARTNET.md');
    }
    /* RULING FA — AND WHAT THE COMMITTED FILE IS, read on its own terms and
       without a regex (a backslash in one is eaten by a probe template, and
       indexOf and a digit walk are exact either way — the same reasoning as
       `sizeOf` above). */
    /* THREE HEADER LINES, EACH PINNED BY WHAT IT IS FOR.  A review asked for
       the universe and the Palace-only gate back: both were in the grouped
       file RULING FA replaced, both are things an operator must know before
       touching the first fader, and neither is derivable from a channel
       line. */
    if(String(want[1]).indexOf('UNIVERSE ') !== 0)
      throw new Error('docs/ARTNET.md line 2 no longer names the universe and the ' +
        'Palace-only gate: ' + JSON.stringify(String(want[1]).slice(0, 60)));
    if(String(want[2]).indexOf('SHOW LOADED  ') !== 0)
      throw new Error('docs/ARTNET.md line 3 no longer says which show is loaded — the set ' +
        'mover lines and the lineset goods are that show\'s, which is why RULING FA keeps ' +
        'that header line: ' + JSON.stringify(String(want[2]).slice(0, 60)));
    if(want[3] !== '')
      throw new Error('docs/ARTNET.md line 4 is not the blank between the header and the ' +
        'list: ' + JSON.stringify(String(want[3]).slice(0, 60)));
    const body = want.slice(4);
    while(body.length && body[body.length - 1] === '') body.pop();
    let prev = null;
    for(let i = 0; i < body.length; i++){
      const line = String(body[i]);
      let d = 0;
      while(d < line.length && line[d] === ' ') d++;
      let n = 0, digits = 0;
      while(d < line.length && line[d] >= '0' && line[d] <= '9'){
        n = n * 10 + (line.charCodeAt(d) - 48); d++; digits++;
      }
      if(!digits || line[d] !== ' ')
        throw new Error('docs/ARTNET.md line ' + (i + 4) + ' does not begin with a channel ' +
          'number. RULING FA is one line per channel and nothing else: ' +
          JSON.stringify(line.slice(0, 60)));
      if(prev === null){
        if(n !== 1)
          throw new Error('docs/ARTNET.md starts the list at channel ' + n + ', not 1');
      } else if(n !== prev + 1)
        throw new Error('docs/ARTNET.md goes from channel ' + prev + ' to ' + n + ' at line ' +
          (i + 4) + ' — RULING FA is every channel, in order, with no gaps' +
          (n <= prev ? ' and none listed twice' : ''));
      prev = n;
    }
    if(prev === null)
      throw new Error('docs/ARTNET.md has no channel lines at all');
    console.log('  ok  ' + name + '  -> ' + (want.length - 1) + ' lines matched line for line, ' +
      'channels 1..' + prev + ' one line each with no gaps, and the committed size line ' +
      'matches the ' + gotSize + '-byte build the probe read');
  }catch(e){
    console.log('  ERR ' + name + ': ' + e.message);
    errs.push(name + ': ' + e.message);
  }
}

/* ==========================================================================
   PART TWO — THE RELAY (RULING EL), tested for real over sockets
   ========================================================================== */

/* ---- a real ArtDmx packet, built the way a console builds one ------------ */
function artDmx(universe, data, opts){
  const o = opts || {};
  const pkt = Buffer.alloc(18 + data.length);
  pkt.write(o.id === undefined ? 'Art-Net\0' : o.id, 0, 8, 'latin1');
  pkt.writeUInt16LE(o.opcode === undefined ? 0x5000 : o.opcode, 8);
  pkt[10] = 0; pkt[11] = 14;          // protocol version 14, hi byte first
  pkt[12] = o.seq === undefined ? 1 : o.seq;
  pkt[13] = 0;                        // physical
  pkt.writeUInt16LE(universe, 14);
  pkt.writeUInt16BE(data.length, 16);
  Buffer.from(data).copy(pkt, 18);
  return pkt;
}

/* a free port, taken by binding one and letting go.  The relay wants an HTTP
   port and an Art-Net port, and a fixed 6454 would fight a real desk — or a
   second copy of this suite — for it.

   TCP AND UDP PORT SPACES ARE SEPARATE, so the Art-Net one has to be reserved
   with a UDP socket.  Proving a TCP port free says nothing about the UDP port
   of the same number — and while the relay now refuses a collision loudly
   (EADDRINUSE, since it dropped reuseAddr), a suite that walked into one
   would fail at startRelay with a port message rather than at the assertion
   it meant to make. */
function freePort(kind){
  return new Promise((res, rej)=>{
    if(kind === 'udp'){
      const s = dgram.createSocket('udp4');
      s.on('error', rej);
      s.bind(0, '127.0.0.1', ()=>{ const p = s.address().port; s.close(()=>res(p)); });
      return;
    }
    const s = net.createServer();
    s.on('error', rej);
    s.listen(0, '127.0.0.1', ()=>{ const p = s.address().port; s.close(()=>res(p)); });
  });
}

/* ---- a WebSocket client built by hand ------------------------------------
   Node's global WebSocket never sends a ping of its own and closes without
   letting us watch the frames, so two clauses RULING EL names outright —
   "answer ping with pong" and "honour close" — cannot be reached through it.
   These speak the protocol directly so both can be proved.               */
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function rawOpen(port){
  return new Promise((res, rej)=>{
    const key = crypto.randomBytes(16).toString('base64');
    const sock = net.connect(port, '127.0.0.1', ()=>{
      sock.write('GET /artnet HTTP/1.1\r\n' +
                 'Host: 127.0.0.1:' + port + '\r\n' +
                 'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
                 'Sec-WebSocket-Key: ' + key + '\r\n' +
                 'Sec-WebSocket-Version: 13\r\n\r\n');
    });
    const t = setTimeout(()=>rej(new Error('the handshake never answered')), 8000);
    let buf = Buffer.alloc(0);
    const onData = d=>{
      buf = Buffer.concat([buf, d]);
      const i = buf.indexOf('\r\n\r\n');
      if(i < 0) return;
      clearTimeout(t);
      sock.removeListener('data', onData);
      res({sock, head:buf.slice(0, i).toString(), rest:buf.slice(i + 4), key});
    };
    sock.on('data', onData);
    sock.on('error', e=>{ clearTimeout(t); rej(e); });
  });
}

/* every client->server frame is masked; RFC 6455 requires it and the relay's
   parser has to unmask correctly or the payload comes back as noise */
function clientFrame(opcode, payload){
  const mask = crypto.randomBytes(4);
  const body = Buffer.from(payload);
  for(let i = 0; i < body.length; i++) body[i] ^= mask[i & 3];
  const head = Buffer.from([0x80 | opcode, 0x80 | body.length]);   // <126 only
  return Buffer.concat([head, mask, body]);
}

/* the next SERVER frame off a raw socket, unmasked, small-length form */
function rawFrame(state, ms){
  return new Promise(res=>{
    const t = setTimeout(()=>{ state.sock.removeListener('data', onData); res(null); }, ms);
    const take = ()=>{
      const b = state.rest;
      if(b.length < 2) return false;
      const opcode = b[0] & 0x0f;
      let len = b[1] & 0x7f, hdr = 2;
      if(len === 126){ if(b.length < 4) return false; len = b.readUInt16BE(2); hdr = 4; }
      if(b.length < hdr + len) return false;
      state.rest = b.slice(hdr + len);
      clearTimeout(t);
      state.sock.removeListener('data', onData);
      res({opcode, masked:(b[1] & 0x80) !== 0, payload:b.slice(hdr, hdr + len)});
      return true;
    };
    const onData = d=>{ state.rest = Buffer.concat([state.rest, d]); take(); };
    if(take()) return;
    state.sock.on('data', onData);
  });
}

function startRelay(args){
  return new Promise((res, rej)=>{
    const ch = spawn(process.execPath, [RELAY].concat(args), {stdio:['ignore', 'pipe', 'pipe']});
    spawned.push(ch);
    let out = '';
    const t = setTimeout(()=>{ ch.kill(); rej(new Error('the relay never announced itself: ' + out)); }, 15000);
    /* wait for the LAST line of the banner, not the first: the relay is
       listening by then, and the banner assertion below reads the whole of
       it.  Resolving on 'ArtDmx on UDP' catches the relay mid-sentence. */
    ch.stdout.on('data', d=>{
      out += d.toString();
      if(out.indexOf('the whole trick') >= 0){ clearTimeout(t); res({ch, banner:out}); }
    });
    ch.stderr.on('data', d=>{ out += d.toString(); });
    ch.on('exit', c=>{ clearTimeout(t); rej(new Error('the relay exited with ' + c + ': ' + out)); });
  });
}

function connect(port){
  return new Promise((res, rej)=>{
    const ws = new WebSocket('ws://127.0.0.1:' + port + '/artnet');
    ws.binaryType = 'arraybuffer';
    const t = setTimeout(()=>rej(new Error('the WebSocket never opened')), 10000);
    ws.onopen = ()=>{ clearTimeout(t); res(ws); };
    ws.onerror = e=>{ clearTimeout(t); rej(new Error('the WebSocket errored')); };
  });
}

/* the next binary frame, or null if none arrives inside ms.  The silence
   cases need the null as much as the delivery cases need the bytes. */
function nextFrame(ws, ms){
  return new Promise(res=>{
    const t = setTimeout(()=>{ ws.onmessage = null; res(null); }, ms);
    ws.onmessage = ev=>{ clearTimeout(t); ws.onmessage = null; res(new Uint8Array(ev.data)); };
  });
}

function getUrl(port, url, headers){
  return new Promise((res, rej)=>{
    http.get({host:'127.0.0.1', port, path:url, headers:headers || {}}, r=>{
      const chunks = [];
      r.on('data', c=>chunks.push(c));
      r.on('end', ()=>res({status:r.statusCode, head:r.headers, body:Buffer.concat(chunks)}));
    }).on('error', rej);
  });
}

(async ()=>{
  const httpPort = await freePort('tcp'), artPort = await freePort('udp');
  const send = dgram.createSocket('udp4');
  let relay;
  try{
    relay = await startRelay(['--port', String(httpPort), '--art-port', String(artPort), '--universe', '0']);
  }catch(e){
    console.log('  ERR the relay would not start: ' + e.message);
    console.log('--- failures: 1 ---');
    clearTimeout(wd); send.close(); process.exit(1);
  }
  const udpSend = pkt=>new Promise((res, rej)=>
    send.send(pkt, 0, pkt.length, artPort, '127.0.0.1', e=>e ? rej(e) : res()));

  await P('the relay serves the repo, so the game and the socket are same-origin', async ()=>{
    const want = fs.readFileSync(path.join(__dirname, '..', 'the-house.html'));
    const got = await getUrl(httpPort, '/the-house.html');
    if(got.status !== 200) throw new Error('the built file came back ' + got.status);
    if(got.body.length !== want.length)
      throw new Error('served ' + got.body.length + ' bytes of a ' + want.length + '-byte file');
    if(!got.body.equals(want)) throw new Error('the served bytes are not the built file');
    return 'the-house.html served whole, ' + want.length + ' bytes, from the same origin as /artnet';
  });

  await P('the banner says Art-Net cannot come off the Pages URL, so nobody rediscovers it', ()=>{
    const b = relay.banner;
    if(b.indexOf('adb reverse') < 0) throw new Error('no Route B recipe in the banner');
    if(b.indexOf('NOT SUPPORTED') < 0) throw new Error('the banner does not rule out the Pages URL');
    if(b.indexOf('mixed content') < 0) throw new Error('the banner does not say WHY');
    return 'the startup banner carries the adb recipe and the mixed-content refusal';
  });

  const ws = await connect(httpPort);

  await P('a genuine ArtDmx packet arrives as 512 bytes, intact', async ()=>{
    const data = Buffer.alloc(512);
    for(let i = 0; i < 512; i++) data[i] = (i * 7 + 3) & 0xff;
    await udpSend(artDmx(0, data));
    const f = await nextFrame(ws, 4000);
    if(!f) throw new Error('nothing arrived');
    if(f.length !== 512) throw new Error('frame is ' + f.length + ' bytes, not 512');
    for(let i = 0; i < 512; i++)
      if(f[i] !== data[i]) throw new Error('byte ' + i + ' arrived as ' + f[i] + ', sent ' + data[i]);
    return 'all 512 channel bytes survived UDP -> WebSocket unchanged';
  });

  await P('a SHORT packet is padded to 512 rather than delivered short', async ()=>{
    const data = Buffer.from([9, 8, 7, 6]);
    await udpSend(artDmx(0, data));
    const f = await nextFrame(ws, 4000);
    if(!f) throw new Error('nothing arrived');
    if(f.length !== 512) throw new Error('a 4-channel packet arrived as ' + f.length + ' bytes');
    if(f[0] !== 9 || f[3] !== 6) throw new Error('the four real channels did not survive');
    if(f[4] !== 0 || f[511] !== 0) throw new Error('the padding is not zero');
    return '4 channels in, 512 bytes out, the rest zero — one fixed frame size for the game';
  });

  await P('a packet for ANOTHER universe is dropped silently', async ()=>{
    await udpSend(artDmx(1, Buffer.alloc(512, 200)));
    const f = await nextFrame(ws, 1200);
    if(f) throw new Error('universe 1 was forwarded to a universe-0 relay');
    return 'universe 1 reached the socket and went no further';
  });

  await P('a packet with the wrong opcode is dropped silently', async ()=>{
    await udpSend(artDmx(0, Buffer.alloc(512, 200), {opcode:0x2000}));   // ArtPoll
    const f = await nextFrame(ws, 1200);
    if(f) throw new Error('an ArtPoll was forwarded as if it were DMX');
    return 'ArtPoll (0x2000) on the right universe is still not DMX';
  });

  await P('a packet with the wrong id is dropped silently', async ()=>{
    await udpSend(artDmx(0, Buffer.alloc(512, 200), {id:'Art-Nyt\0'}));
    const f = await nextFrame(ws, 1200);
    if(f) throw new Error('a packet that is not Art-Net at all was forwarded');
    return 'the eight id bytes are checked, not assumed';
  });

  await P('the relay still works after the rejects — the drops are not fatal', async ()=>{
    const data = Buffer.alloc(512); data[41] = 255;
    await udpSend(artDmx(0, data));
    const f = await nextFrame(ws, 4000);
    if(!f) throw new Error('the relay stopped forwarding after three rejected packets');
    if(f[41] !== 255) throw new Error('channel 42 came through as ' + f[41]);
    return 'a good packet after three bad ones still lands';
  });

  await P('GET /artnet over plain http is refused rather than served as a file', async ()=>{
    const got = await getUrl(httpPort, '/artnet');
    if(got.status !== 426) throw new Error('/artnet answered ' + got.status + ', expected 426');
    return 'http://.../artnet -> 426 Upgrade Required';
  });

  await P('a malformed escape in the URL is refused, and does not kill the relay', async ()=>{
    const bad = await getUrl(httpPort, '/%');
    if(bad.status !== 400) throw new Error('GET /% answered ' + bad.status + ', expected 400');
    /* the point is not the 400.  decodeURIComponent throws, and an uncaught
       throw in an http handler exits the process — so the assertion that
       matters is that the relay is still there afterwards. */
    const after = await getUrl(httpPort, '/the-house.html');
    if(after.status !== 200) throw new Error('the relay died on a malformed URL');
    const data = Buffer.alloc(512); data[7] = 123;
    await udpSend(artDmx(0, data));
    const f = await nextFrame(ws, 4000);
    if(!f || f[7] !== 123) throw new Error('the DMX feed did not survive a malformed URL');
    return 'GET /% -> 400, and both the file server and the desk feed carried on';
  });

  await P('the repo is served but .git is not, by any of its names', async ()=>{
    /* THESE ARE REFUSED WHETHER OR NOT THEY EXIST, which is the point: a
       fresh clone packs its refs away and a git WORKTREE has `.git` as a
       FILE, so several of these resolve to nothing at all in a perfectly
       ordinary checkout.  Forbidden and not-there are different answers, and
       a dot-segment gets the first one either way. */
    for(const u of ['/.git/config', '/.git/HEAD', '/.git/refs/heads/main',
                    '/.gitignore', '/%2Egit/config', '/.env']){
      const r = await getUrl(httpPort, u);
      if(r.status !== 403) throw new Error(u + ' answered ' + r.status + ', expected 403');
    }
    /* AND THE NAME IN THE URL IS NOT THE ONLY NAME THE FILE HAS.  NTFS keeps
       8.3 aliases, so .git is also GIT~1 and .gitignore is also GITIGN~1 —
       resolved by the filesystem at stat time, long after any test on the
       spelling has passed.  A guard that reads the URL alone served the
       remote's config to anything that asked for /GIT~1/config. */
    for(const u of ['/GIT~1/config', '/git~1/head', '/GIT~1/refs/heads/main', '/GITIGN~1']){
      const r = await getUrl(httpPort, u);
      if(r.status === 200) throw new Error(u + ' served ' + r.body.length +
        ' bytes — the 8.3 alias walks straight past a guard that reads the URL');
      if(r.status !== 403 && r.status !== 404)
        throw new Error(u + ' answered ' + r.status);
    }
    const ok = await getUrl(httpPort, '/build.sh');
    if(ok.status !== 200) throw new Error('the refusal ate an ordinary file');
    const deep = await getUrl(httpPort, '/docs/guide/TRAPS.md');
    if(deep.status !== 200) throw new Error('the refusal ate a nested ordinary file');
    return '.git refused as .git, as %2Egit and as GIT~1; build.sh and docs/guide still served';
  });

  await P('a NUL in the URL is refused too — decodeURIComponent is not the only way in', async ()=>{
    /* %00 decodes cleanly, so the try/catch never sees it; fs.stat then
       validates its path SYNCHRONOUSLY and throws before the callback exists,
       out through the same handler and into the same dead process. */
    const bad = await getUrl(httpPort, '/a%00b');
    if(bad.status !== 400) throw new Error('GET /a%00b answered ' + bad.status + ', expected 400');
    const after = await getUrl(httpPort, '/the-house.html');
    if(after.status !== 200) throw new Error('the relay died on a NUL byte in the path');
    return 'GET /a%00b -> 400 and the relay is still serving — the guard is on the decoded string';
  });

  await P('a range request is answered with a range, not the whole file', async ()=>{
    /* the banner tells the operator to load the game from here, and the show
       SEEKS its own recordings (RULING BO).  A server that answers every
       request with the whole file makes a seek re-fetch tens of megabytes,
       and it reads as an audio fault rather than a server one. */
    const r = await getUrl(httpPort, '/the-house.html', {Range:'bytes=100-199'});
    if(r.status !== 206) throw new Error('a Range request answered ' + r.status + ', expected 206');
    if(r.body.length !== 100) throw new Error('asked for 100 bytes, got ' + r.body.length);
    const whole = fs.readFileSync(path.join(__dirname, '..', 'the-house.html'));
    if(!r.body.equals(whole.slice(100, 200))) throw new Error('the 100 bytes are the wrong 100 bytes');
    if((r.head['content-range'] || '') !== 'bytes 100-199/' + whole.length)
      throw new Error('Content-Range reads ' + r.head['content-range']);
    return '206 with bytes 100-199 of ' + whole.length + ', and the right hundred';
  });

  await P('a header-only ArtDmx does NOT black the rig out', async ()=>{
    /* an 18-byte packet passes the id, opcode and universe checks; without a
       length guard it copies nothing into a zeroed buffer and forwards 512
       bytes of zero.  One stray packet would take the rig to black on the
       next tick and the game would have no way to know it was not asked. */
    const lit = Buffer.alloc(512, 255);
    await udpSend(artDmx(0, lit));
    const on = await nextFrame(ws, 4000);
    if(!on || on[0] !== 255) throw new Error('the setup frame never landed');
    await udpSend(artDmx(0, Buffer.alloc(0)));
    const f = await nextFrame(ws, 1200);
    if(f) throw new Error('a header-only packet was forwarded as ' +
      (Array.prototype.every.call(f, b=>b === 0) ? '512 bytes of BLACKOUT' : 'a frame'));
    return 'Length 0 is outside Art-Net 2..512 and goes no further — the rig keeps its look';
  });

  await P('a packet that LIES about its length is refused too', async ()=>{
    /* bounding the DECLARED length is only half of it: a header-only packet
       claiming Length 2 satisfies a 2..512 test, and the copy is then clamped
       by what actually arrived — so it copies nothing and forwards the same
       512 bytes of blackout, reached by declaring a number instead of zero. */
    const lit = Buffer.alloc(512, 255);
    await udpSend(artDmx(0, lit));
    const on = await nextFrame(ws, 4000);
    if(!on || on[0] !== 255) throw new Error('the setup frame never landed');
    for(const claim of [2, 512]){
      const pkt = artDmx(0, Buffer.alloc(0));
      pkt.writeUInt16BE(claim, 16);          // 18 bytes long, claiming `claim`
      await udpSend(pkt);
      const f = await nextFrame(ws, 1200);
      if(f) throw new Error('a header-only packet claiming Length ' + claim + ' was forwarded as ' +
        (Array.prototype.every.call(f, b=>b === 0) ? '512 bytes of BLACKOUT' : 'a frame'));
    }
    return 'Length 2 and Length 512 with no payload both refused — the packet must carry what it declares';
  });

  await P('an OLDER packet does not overwrite a newer one', async ()=>{
    /* UDP reorders, and Art-Net carries Sequence for exactly this.  Run LAST
       of the DMX cases on this relay: it deliberately leaves the sequence
       high, and a later packet at seq 1 would look like the stale one. */
    /* ORDER MATTERS HERE.  A gap of a second means the desk stopped, and the
       relay then forgets its baseline on purpose — so the duplicate has to be
       proved BEFORE the case that waits out a timeout, or it would be
       accepted by the gap rule rather than by the duplicate rule and the
       assertion would be measuring the wrong thing. */
    await udpSend(artDmx(0, Buffer.alloc(512, 100), {seq:40}));
    const a = await nextFrame(ws, 4000);
    if(!a || a[0] !== 100) throw new Error('the seq-40 frame never landed');
    /* a duplicate sequence is accepted — some desks send a constant, and
       refusing those would forward nothing at all */
    await udpSend(artDmx(0, Buffer.alloc(512, 55), {seq:40}));
    const c = await nextFrame(ws, 4000);
    if(!c || c[0] !== 55) throw new Error('a repeated sequence number was refused; a constant-seq desk would go dead');
    await udpSend(artDmx(0, Buffer.alloc(512, 7), {seq:5}));
    const b = await nextFrame(ws, 1200);
    if(b) throw new Error('a packet 35 sequence numbers OLD was forwarded on top of the newer one');
    return 'seq 40 then 40 accepted, then seq 5 refused — both inside the one-second window';
  });

  /* ---- the two RFC 6455 clauses RULING EL names by hand ------------------ */
  await P('the handshake computes a real accept key, not a fixed string', async ()=>{
    const st = await rawOpen(httpPort);
    try{
      if(st.head.indexOf('101') < 0) throw new Error('no 101: ' + st.head.split('\r\n')[0]);
      const want = crypto.createHash('sha1').update(st.key + WS_GUID).digest('base64');
      const m = /sec-websocket-accept:\s*(\S+)/i.exec(st.head);
      if(!m) throw new Error('no Sec-WebSocket-Accept header');
      if(m[1] !== want) throw new Error('accept key ' + m[1] + ', expected ' + want);
      return 'sha1(key + GUID) base64 — computed from the key this client actually sent';
    } finally { st.sock.destroy(); }
  });

  await P('a ping is answered with a pong carrying the same payload', async ()=>{
    const st = await rawOpen(httpPort);
    try{
      const body = Buffer.from('are you there');
      st.sock.write(clientFrame(0x9, body));
      const f = await rawFrame(st, 4000);
      if(!f) throw new Error('no answer to a ping at all');
      if(f.opcode !== 0xa) throw new Error('answered a ping with opcode 0x' + f.opcode.toString(16));
      if(f.masked) throw new Error('the server masked its own frame');
      if(!f.payload.equals(body)) throw new Error('the pong payload came back as ' + JSON.stringify(f.payload.toString()));
      return 'ping -> pong, same 13 bytes, unmasked — the clause that only bites on a long headset session';
    } finally { st.sock.destroy(); }
  });

  await P('a close is answered with a close, and the socket is let go', async ()=>{
    const st = await rawOpen(httpPort);
    let ended = false;
    st.sock.on('end', ()=>{ ended = true; });
    try{
      st.sock.write(clientFrame(0x8, Buffer.alloc(0)));
      const f = await rawFrame(st, 4000);
      if(!f) throw new Error('the close was never answered');
      if(f.opcode !== 0x8) throw new Error('answered a close with opcode 0x' + f.opcode.toString(16));
      await new Promise(r=>setTimeout(r, 300));
      if(!ended) throw new Error('the relay answered the close and then held the socket open');
      return 'close -> close, then the relay ends its side';
    } finally { st.sock.destroy(); }
  });

  /* ---- the universe filter, on a universe that can tell the byte order --- */
  await P('--universe really moves the filter, and the read is LITTLE-endian', async ()=>{
    const p2 = await freePort('tcp'), a2 = await freePort('udp');
    const r2 = await startRelay(['--port', String(p2), '--art-port', String(a2), '--universe', '3']);
    try{
      const ws2 = await connect(p2);
      const send2 = pkt=>new Promise((res, rej)=>
        send.send(pkt, 0, pkt.length, a2, '127.0.0.1', e=>e ? rej(e) : res()));
      /* universe 3 is [3,0] little-endian and [0,3] big-endian, so a relay
         that read these two bytes the wrong way round would see 768 here and
         drop it.  Universe 0 is [0,0] either way, which is exactly why the
         Palace's own universe cannot prove the byte order. */
      const data = Buffer.alloc(512); data[100] = 77;
      await send2(artDmx(3, data));
      const f = await nextFrame(ws2, 4000);
      if(!f) throw new Error('universe 3 did not reach a --universe 3 relay');
      if(f[100] !== 77) throw new Error('the bytes arrived wrong');
      /* and the flag really moved the filter rather than being ignored */
      await send2(artDmx(0, Buffer.alloc(512, 200)));
      const f0 = await nextFrame(ws2, 1200);
      if(f0) throw new Error('a --universe 3 relay forwarded universe 0 — the flag is ignored');
      /* AND THE READ IS SIXTEEN BITS, NOT EIGHT.  Universe 259 is [3,1] little
         endian, so a relay comparing only byte 14 sees a 3 and forwards it.
         Every other case in this suite is under 256 and cannot tell. */
      await send2(artDmx(259, Buffer.alloc(512, 200)));
      const f259 = await nextFrame(ws2, 1200);
      if(f259) throw new Error('universe 259 reached a universe-3 relay — only byte 14 is being read');
      try{ ws2.close(); }catch(e){}
      return 'universe 3 in; 0 and 259 refused — the flag works, and bytes 14-15 are read LE as sixteen bits';
    } finally { r2.ch.kill(); }
  });

  await P('the three defaults RULING EL names are the three in the file', ()=>{
    /* A DECLARATION CHECK, AND IT SAYS SO.  Binding 8080 and UDP 6454 in a
       suite would fight a real desk or a second test run for them, which is
       the whole reason --port and --art-port exist — so the defaults are
       pinned where they are written instead.  It is a tripwire against
       someone changing them, not proof of the bind. */
    const src = fs.readFileSync(RELAY, 'utf8');
    const want = ["argOf('port', 8080)", "argOf('universe', 0)", "argOf('art-port', 6454)"];
    for(const w of want)
      if(src.indexOf(w) < 0) throw new Error('the file no longer declares ' + w);
    return 'port 8080, universe 0, Art-Net on UDP 6454 — declared, and now pinned';
  });

  try{ ws.close(); }catch(e){}
  send.close();
  killAll();

  console.log(errs.length ? '--- failures: ' + errs.length + ' ---' : '--- failures: 0 ---');
  errs.forEach(e=>console.log('  ' + e));
  clearTimeout(wd);
  process.exit(errs.length ? 1 : 0);
})().catch(e=>{
  console.log('ARTNET TAIL THREW: ' + e.message);
  if(e.stack) console.log(e.stack.split('\n').slice(0, 6).join('\n'));
  killAll();
  clearTimeout(wd);
  process.exit(1);
});
