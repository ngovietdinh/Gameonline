'use strict';
// Máy chủ mạng LAN cho Hẻm Mưa: phát trang web và mở cổng WebSocket cho phòng đấu.
// Chạy: node server.js   (đổi cổng: PORT=9000 node server.js)
// Logic phòng, đồng hồ trận nằm ở src/hub.mjs, dùng chung với bản Cloudflare (src/worker.js).
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const PORT = +process.env.PORT || 8080, ROOT = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };

const lanAddrs = () => {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push('http://' + a.address + ':' + PORT);
  return out;
};

const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Không tìm thấy'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

/* ---------- WebSocket tối giản, không cần cài thêm gói ---------- */
function frame(str) {
  const data = Buffer.from(str), n = data.length;
  let head;
  if (n < 126) head = Buffer.from([0x81, n]);
  else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(n, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([head, data]);
}

import('./src/hub.mjs').then(({ createHub }) => {
  const hub = createHub({ addrs: lanAddrs, log: s => console.log(s) });
  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    if ((req.url || '').split('?')[0] !== '/ws' || !key) { socket.destroy(); return; }
    const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    socket.setNoDelay(true);
    const c = hub.connect(s => { if (!socket.destroyed) socket.write(frame(s)); }, () => socket.destroy());
    if (!c) { socket.destroy(); return; }
    let buf = Buffer.alloc(0);
    const drop = () => { hub.disconnect(c); socket.destroy(); };
    socket.on('data', d => {
      buf = Buffer.concat([buf, d]); if (buf.length > 65536) return drop();
      while (buf.length >= 2) {
        const b0 = buf[0], b1 = buf[1], op = b0 & 15;
        let len = b1 & 127, off = 2;
        if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
        else if (len === 127) return drop();
        if (!(b1 & 128)) return drop();
        if (buf.length < off + 4 + len) return;
        const mask = buf.subarray(off, off + 4), payload = Buffer.from(buf.subarray(off + 4, off + 4 + len));
        for (let i = 0; i < len; i++) payload[i] ^= mask[i & 3];
        buf = buf.subarray(off + 4 + len);
        if (op === 8) return drop();
        if (op === 9) { if (len < 126) socket.write(Buffer.concat([Buffer.from([0x8A, len]), payload])); continue; }
        if (op !== 1 || !(b0 & 128) || len > 4096) continue;
        hub.message(c, payload.toString('utf8'));
      }
    });
    socket.on('close', drop);
    socket.on('error', drop);
  });
  setInterval(() => hub.sweep(), 5000);
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Hẻm Mưa đang chạy.');
    console.log('  Máy này mở:        http://localhost:' + PORT);
    const a = lanAddrs();
    if (a.length) a.forEach(u => console.log('  Máy khác cùng mạng: ' + u));
    else console.log('  Không thấy địa chỉ mạng LAN. Kiểm tra máy đã nối Wi-Fi hoặc dây mạng chưa.');
    console.log('Bấm Ctrl+C để tắt.');
  });
});
