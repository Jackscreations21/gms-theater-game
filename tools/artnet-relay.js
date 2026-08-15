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
const PORT     = argOf('port', 8080);
const UNIVERSE = argOf('universe', 0);
const ART_PORT = argOf('art-port', 6454);

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
  let rel = decodeURIComponent((req.url || '/').split('?')[0]);
  if(rel === '/' || rel === '') rel = '/index.html';
  /* path.join collapses ../ before we compare, so a traversal cannot escape
     the repo by spelling it differently */
  const file = path.join(ROOT, rel);
  if(file !== ROOT && !file.startsWith(ROOT + path.sep)){
    res.writeHead(403); res.end('forbidden'); return;
  }
  fs.stat(file, (err, st)=>{
    if(err || !st.isFile()){ res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(file).pipe(res);
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
function parseArtDmx(msg, universe){
  if(msg.length < 18) return null;
  if(msg.compare(ART_ID, 0, 8, 0, 8) !== 0) return null;
  if(msg.readUInt16LE(8) !== OP_DMX) return null;
  if(msg.readUInt16LE(14) !== universe) return null;
  const len = msg.readUInt16BE(16);
  const data = Buffer.alloc(512);                  // pad short, truncate long
  msg.copy(data, 0, 18, 18 + Math.min(len, 512, msg.length - 18));
  return data;
}

let packets = 0, lastLog = 0;
const udp = dgram.createSocket({type:'udp4', reuseAddr:true});
udp.on('message', msg=>{
  const data = parseArtDmx(msg, UNIVERSE);
  if(!data) return;
  packets++;
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

udp.bind(ART_PORT, ()=>{
  server.listen(PORT, ()=>{
    say('serving ' + ROOT);
    say('http://localhost:' + PORT + '/the-house.html');
    say('ArtDmx on UDP ' + ART_PORT + ', universe ' + UNIVERSE + ' -> ws://localhost:' + PORT + '/artnet');
    say('');
    say('QLC+: output Art-Net to 127.0.0.1, universe ' + UNIVERSE + '. The channel');
    say('      map is docs/ARTNET.md, generated from the build.');
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
