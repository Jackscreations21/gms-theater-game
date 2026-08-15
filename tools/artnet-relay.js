/* ============================================================================
   ART-NET RELAY — RULING EL

   A browser page cannot receive UDP.  Not with a flag, not with a permission,
   not with a clever workaround: there is no UDP socket API in a page, and
   Art-Net is UDP.  So the desk talks to this, and this talks to the game.

       QLC+ ──ArtDmx/UDP 6454──▶ artnet-relay ──WebSocket──▶ the-house.html

   THREE JOBS, ONE PORT (default 8080):

     1. serves the repo directory as static files, so the game itself comes
        from here — which is what makes the WebSocket same-origin;
     2. upgrades  GET /artnet  to a WebSocket and forwards DMX to every
        client connected to it;
     3. listens on UDP 6454 for ArtDmx packets.

   ZERO npm DEPENDENCIES.  Node's own dgram, http, net, crypto and nothing
   else — the WebSocket server side is hand-rolled RFC 6455 (accept-key
   handshake, unmasked server->client binary frames, ping answered with pong,
   close honoured).  The server never needs to parse a large client frame:
   the game sends nothing but the occasional pong.

   usage:
     node tools/artnet-relay.js [--port 8080] [--universe 0] [--art-port 6454]

   --art-port exists for the suite, which must not fight a real desk (or a
   second copy of itself) over a fixed port.  Art-Net's own port IS 6454 and
   no console will send anywhere else, so leave it alone in real use.
   ========================================================================== */
'use strict';
const dgram = require('dgram');
const http  = require('http');
const crypto= require('crypto');
const fs    = require('fs');
const path  = require('path');

const ROOT = path.resolve(__dirname, '..');
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/* ---- arguments ---------------------------------------------------------- */
function argOf(name, dflt){
  const i = process.argv.indexOf('--' + name);
  if(i < 0 || i + 1 >= process.argv.length) return dflt;
  const v = parseInt(process.argv[i + 1], 10);
  return isNaN(v) ? dflt : v;
}
function strArg(name, dflt){
  const i = process.argv.indexOf('--' + name);
  return (i < 0 || i + 1 >= process.argv.length) ? dflt : process.argv[i + 1];
}
const PORT     = argOf('port', 8080);
const UNIVERSE = argOf('universe', 0);
const ART_PORT = argOf('art-port', 6454);
/* LOOPBACK BY DEFAULT.  The web half serves the whole working directory, and
   the working directory is not the published site — it is the repo, with .git
   in it.  Route B (adb reverse) forwards the headset's own localhost to this
   machine's localhost, so nothing that this tool exists for needs a LAN
   listener.  --host 0.0.0.0 is there for the person who genuinely wants to
   open the game from another machine, and it is their decision to make.
   The Art-Net socket is NOT affected: a desk on another machine still
   reaches UDP here either way. */
const HOST = strArg('host', '127.0.0.1');

/* ---- the static half ---------------------------------------------------- */
const TYPES = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',   '.json':'application/json; charset=utf-8',
  '.md':'text/plain; charset=utf-8',  '.txt':'text/plain; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
  '.m4a':'audio/mp4', '.mp3':'audio/mpeg', '.glb':'model/gltf-binary',
  '.wasm':'application/wasm', '.ico':'image/x-icon'
};
function serveFile(req, res){
  let rel;
  /* decodeURIComponent THROWS on a malformed escape, and this handler runs
     inside http's request event where an uncaught throw takes the process
     down.  One GET /% from a LAN scanner would kill the desk feed mid-show,
     and it would not come back. */
  try{ rel = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch(e){ res.writeHead(400); res.end('bad request'); return; }
  if(rel === '/' || rel === '') rel = '/index.html';
  /* AND A DECODED NUL IS THE SAME BUG WEARING A DISGUISE.  %00 decodes
     perfectly — the try/catch above never fires — and then fs.stat validates
     its path SYNCHRONOUSLY and throws ERR_INVALID_ARG_VALUE before the
     callback exists, straight back out through this handler and into the same
     dead process.  Guard the decoded string, not the decoder. */
  if(rel.indexOf('\0') >= 0){ res.writeHead(400); res.end('bad request'); return; }
  /* path.join collapses ../ before we compare, so a traversal cannot escape
     the repo by spelling it differently */
  const file = path.join(ROOT, rel);
  if(file !== ROOT && !file.startsWith(ROOT + path.sep)){
    res.writeHead(403); res.end('forbidden'); return;
  }
  /* THE REPO IS NOT ALL PUBLISHABLE.  The root here is the working directory,
     which is not the set of files that goes to Pages: .git carries the whole
     history and the remote's config.  Every dot-segment is refused rather
     than just .git, because .env and friends are the same mistake wearing
     another name.  --host defends the same ground from the other side.

     AND THE NAME IN THE URL IS NOT THE ONLY NAME THE FILE HAS.  NTFS keeps
     8.3 aliases — .git is also GIT~1, .gitignore is also GITIGN~1 — and they
     are resolved by the filesystem at stat time, long after a test on the
     spelling has passed.  /GIT~1/config served the remote's config with a
     dot-guard sitting right here.  So the judgement is made on the RESOLVED
     path: realpath collapses the alias, and it collapses a symlink or a
     junction out of the repo at the same time, which the lexical test above
     cannot see either. */
  let real;
  try{ real = fs.realpathSync.native(file); }
  catch(e){ res.writeHead(404); res.end('not found'); return; }   // no such file
  if(real !== ROOT && !real.startsWith(ROOT + path.sep)){
    res.writeHead(403); res.end('forbidden'); return;
  }
  if(path.relative(ROOT, real).split(/[\\/]/).some(s=>s.length > 1 && s.charAt(0) === '.')){
    res.writeHead(403); res.end('forbidden'); return;
  }
  fs.stat(real, (err, st)=>{
    if(err || !st.isFile()){ res.writeHead(404); res.end('not found'); return; }
    const type = TYPES[path.extname(real).toLowerCase()] || 'application/octet-stream';
    /* a media element seeking a 70MB recording ABORTS the response it is
       already reading, on every seek.  A piped stream whose destination goes
       away is not closed by the pipe, so each seek leaks a file handle. */
    const pipe = s=>{ res.on('close', ()=>s.destroy()); s.pipe(res); };
    /* RANGE, BECAUSE THE SHOW SEEKS ITS OWN AUDIO.  The banner tells the
       operator to load the game from here, and the recordings in
       assets/audio are tens of megabytes that RULING BO seeks into.  A server
       that answers every request with the whole file makes a seek re-download
       the recording, which reads as an audio fault rather than a server one.
       One range, the only form a media element asks for. */
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if(m && st.size){
      let start = m[1] === '' ? st.size - parseInt(m[2], 10) : parseInt(m[1], 10);
      let end   = (m[1] === '' || m[2] === '') ? st.size - 1 : parseInt(m[2], 10);
      if(isNaN(start) || isNaN(end) || start < 0) start = 0;
      if(end >= st.size) end = st.size - 1;
      if(start > end){
        res.writeHead(416, {'Content-Range':'bytes */' + st.size}); res.end(); return;
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + st.size,
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes', 'Cache-Control':'no-cache'
      });
      pipe(fs.createReadStream(real, {start, end}));
      return;
    }
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': st.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });
    pipe(fs.createReadStream(real));
  });
}
const server = http.createServer((req, res)=>{
  if((req.url || '').split('?')[0] === '/artnet'){
    res.writeHead(426, {'Content-Type':'text/plain'});
    res.end('/artnet is a WebSocket endpoint - connect with ws://, not http://');
    return;
  }
  serveFile(req, res);
});

/* ---- the WebSocket half (RFC 6455, by hand) ------------------------------ */
const clients = new Set();

/* server->client frames are never masked.  512 bytes needs the 16-bit length
   form (126), which is the only branch this will ever take — but the small
   form is written too, because the close frame uses it. */
function frame(opcode, payload){
  const len = payload.length;
  let head;
  if(len < 126){
    head = Buffer.alloc(2);
    head[0] = 0x80 | opcode; head[1] = len;
  } else if(len < 65536){
    head = Buffer.alloc(4);
    head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | opcode; head[1] = 127;
    head.writeUInt32BE(0, 2); head.writeUInt32BE(len, 6);
  }
  return Buffer.concat([head, payload]);
}

/* the client half of the protocol, only as far as we need it: every client
   frame is masked, and the only ones we ever expect are ping, pong and close.
   Anything longer than the 16-bit form is a client doing something this relay
   has no business with, and the socket is dropped rather than guessed at. */
function readFrames(sock, buf){
  let off = 0;
  while(buf.length - off >= 2){
    const b0 = buf[off], b1 = buf[off + 1];
    const opcode = b0 & 0x0f, masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f, hdr = 2;
    if(len === 126){
      if(buf.length - off < 4) break;
      len = buf.readUInt16BE(off + 2); hdr = 4;
    } else if(len === 127){ sock.destroy(); return buf.slice(buf.length); }
    const maskLen = masked ? 4 : 0;
    if(buf.length - off < hdr + maskLen + len) break;
    const mask = masked ? buf.slice(off + hdr, off + hdr + 4) : null;
    const body = Buffer.from(buf.slice(off + hdr + maskLen, off + hdr + maskLen + len));
    if(mask) for(let i = 0; i < body.length; i++) body[i] ^= mask[i & 3];
    off += hdr + maskLen + len;

    if(opcode === 0x8){                      // close: answer and go
      try{ sock.write(frame(0x8, Buffer.alloc(0))); }catch(e){}
      sock.end(); return buf.slice(off);
    }
    if(opcode === 0x9) try{ sock.write(frame(0xa, body)); }catch(e){}   // ping -> pong
    /* 0xa (pong) and any data frame: nothing to do.  The game never sends. */
  }
  return buf.slice(off);
}

server.on('upgrade', (req, sock, head)=>{
  if((req.url || '').split('?')[0] !== '/artnet'){ sock.destroy(); return; }
  const key = req.headers['sec-websocket-key'];
  if(!key){ sock.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  sock.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  sock.setNoDelay(true);
  clients.add(sock);
  say('a client is on /artnet  (' + clients.size + ' connected)');
  /* A CONNECTED GAME AND A SILENT DESK IS THE COMMONEST WAY THIS GOES WRONG,
     and every other symptom of it is indistinguishable from a broken game.
     The question is "is the desk talking NOW", not "has it ever talked" — a
     desk that dies mid-show is exactly the case this describes, and a
     cumulative count would have gone quiet for good after the first packet. */
  if(!quietWarned) setTimeout(()=>{
    if(quietWarned || Date.now() - lastPacketAt < 5000) return;
    quietWarned = true;
    say('a client is connected but NO ArtDmx has arrived on UDP ' + ART_PORT + ' for 5s —');
    say('      check the desk is outputting Art-Net, and that it is on universe ' + UNIVERSE + '.');
  }, 5000).unref();

  let pending = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
  sock.on('data', d=>{ pending = readFrames(sock, Buffer.concat([pending, d])); });
  const drop = ()=>{ if(clients.delete(sock)) say('a client left  (' + clients.size + ' connected)'); };
  sock.on('close', drop);
  sock.on('error', drop);
});

/* ---- the Art-Net half ---------------------------------------------------- */
const ART_ID = Buffer.from('Art-Net\0', 'latin1');
const OP_DMX = 0x5000;

/* Returns the packet's 512 channel bytes, or null if this is not an ArtDmx
   packet for our universe.  Every rejection is silent by ruling: a network
   with other Art-Net traffic on it must not print a line per packet.        */
let lastSeq = 0, lastPacketAt = 0;
function parseArtDmx(msg, universe){
  if(msg.length < 18) return null;
  if(msg.compare(ART_ID, 0, 8, 0, 8) !== 0) return null;
  if(msg.readUInt16LE(8) !== OP_DMX) return null;
  if(msg.readUInt16LE(14) !== universe) return null;
  const len = msg.readUInt16BE(16);
  /* ART-NET'S LENGTH IS 2..512, AND A HEADER-ONLY PACKET IS NOT A BLACKOUT.
     Without this an 18-byte packet — which passes all four checks above —
     copies nothing into a zeroed buffer and forwards 512 bytes of zero: one
     stray packet from anything on the network takes the rig to black on the
     next tick, and the game has no way to know it was not asked for.

     BOUNDING THE DECLARED LENGTH IS ONLY HALF OF IT.  A header-only packet
     that CLAIMS Length 2 satisfies a 2..512 test and then copies nothing,
     because the copy is clamped by `msg.length - 18` — the same blackout,
     reached by declaring a number instead of by declaring zero.  The packet
     must actually CARRY what it says it carries. */
  if(len < 2 || len > 512 || msg.length - 18 < len) return null;
  /* AND AN OLD PACKET MUST NOT OVERWRITE A NEW ONE.  UDP reorders; Art-Net
     carries Sequence for exactly this.  0 means the desk has the feature
     switched off, and a DUPLICATE sequence is deliberately accepted — some
     desks send a constant, and dropping those would silently forward nothing
     at all.  Only a strictly older packet is refused.

     A GAP MEANS THE BASELINE IS MEANINGLESS.  A desk sends ~44 packets a
     second, so a second of silence is a desk that stopped — and one that
     restarts its count at 1 against a stale `lastSeq` of 128 would have up
     to 127 packets (nearly three seconds) refused as "old" before it caught
     up.  A gap forgets the baseline instead. */
  const now = Date.now();
  if(now - lastPacketAt > 1000) lastSeq = 0;
  lastPacketAt = now;
  const seq = msg[12];
  if(seq !== 0 && lastSeq !== 0 && ((seq - lastSeq) & 0xff) > 128) return null;
  lastSeq = seq;
  const data = Buffer.alloc(512);                  // pad short, truncate long
  msg.copy(data, 0, 18, 18 + Math.min(len, 512, msg.length - 18));
  return data;
}

let packets = 0, lastLog = 0, quietWarned = false;
/* NO reuseAddr.  It looks like politeness and it is a trap: on Windows a
   second bind to a port QLC+ (or another relay) already holds SUCCEEDS, the
   first binder keeps receiving everything, and this process prints a banner
   claiming it is listening while no packet ever arrives.  Without it the
   collision is a loud EADDRINUSE, which is the one diagnostic that saves the
   evening. */
const udp = dgram.createSocket({type:'udp4'});
udp.on('message', msg=>{
  const data = parseArtDmx(msg, UNIVERSE);
  if(!data) return;
  packets++;
  quietWarned = false;          // a desk that comes back may go away again
  /* no batching and no rate logic: Art-Net's own refresh (~44Hz) is the rate,
     and the game keeps only the latest frame per render tick anyway. */
  const f = frame(0x2, data);
  for(const sock of clients){ try{ sock.write(f); }catch(e){} }
  const now = Date.now();
  if(now - lastLog > 10000){ lastLog = now; say(packets + ' ArtDmx packets in, ' + clients.size + ' client(s)'); }
});
udp.on('error', e=>{ say('UDP error: ' + e.message); process.exit(1); });

/* ---- go ------------------------------------------------------------------ */
function say(s){ console.log('[artnet] ' + s); }

/* the UDP half already says its errors in one line; the web half was left to
   print a raw stack, and 8080 is a commonly occupied port */
server.on('error', e=>{
  say('cannot serve on ' + HOST + ':' + PORT + ' — ' + e.code + '. Try --port <other>.');
  process.exit(1);
});

udp.bind(ART_PORT, ()=>{
  server.listen(PORT, HOST, ()=>{
    say('serving ' + ROOT + '  on ' + HOST + ':' + PORT);
    say('http://localhost:' + PORT + '/the-house.html');
    say('ArtDmx on UDP ' + ART_PORT + ', universe ' + UNIVERSE + ' -> ws://localhost:' + PORT + '/artnet');
    say('');
    say('QLC+: output Art-Net to 127.0.0.1, universe ' + UNIVERSE + '. The channel');
    /* the map is generated by tools/artnet-map.js later in this chain; do not
       send anybody to a file that is not there yet */
    say(fs.existsSync(path.join(ROOT, 'docs', 'ARTNET.md'))
      ? '      map is docs/ARTNET.md, generated from the build.'
      : '      map (docs/ARTNET.md) is not generated yet on this build.');
    say('');
    say('VR (Quest 3), Route B — the headset loads the game FROM HERE:');
    say('      adb reverse tcp:' + PORT + ' tcp:' + PORT);
    say('      then open  http://localhost:' + PORT + '/the-house.html  in the headset');
    say('ART-NET FROM THE GITHUB PAGES URL DOES NOT WORK AND IS NOT SUPPORTED:');
    say('      that page is HTTPS and a LAN ws:// is mixed content, which the');
    say('      browser blocks. Same-origin off this relay is the whole trick.');
  });
});

/* deliberately NOT module.exports'd: requiring this file would bind two ports
   as a side effect.  tests/artnet.js spawns it as a child process and speaks
   to it over a real socket, which is the only way to test a relay anyway. */
