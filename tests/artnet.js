/* ============================================================================
   ART-NET — the suite for RULINGS EL..EU.

   THIS PR COVERS RULING EL: the relay, tested FOR REAL.  There is no way to
   unit-test a relay: the whole of it is two sockets and a protocol, so this
   spawns tools/artnet-relay.js as a child process on free ports, connects to
   it with Node v24's own global WebSocket, sends a genuine ArtDmx packet over
   UDP, and reads the bytes out the other end.

   This file is plain node, not a probe template — the game is not booted here
   at all, because nothing in RULING EL is in the game.  Later PRs in this
   chain append a jsdom probe above this section for the parts that are.

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
    for(const u of ['/.git/config', '/.git/refs/heads/main', '/.gitignore', '/%2Egit/config']){
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
