// Bản Cloudflare của Hẻm Mưa: Worker phát trang game (nhúng sẵn từ public/), còn /ws đi vào một Durable Object
// giữ mọi kết nối WebSocket, phòng đấu và đồng hồ trận. Logic phòng dùng chung với bản LAN (hub.mjs).
import { DurableObject } from 'cloudflare:workers';
import { createHub } from './hub.mjs';
import indexHtml from '../public/index.html';
import threeJs from '../public/three.min.js';
import threeLicense from '../public/LICENSE-three.txt';

const FILES = {
  '/': [indexHtml, 'text/html; charset=utf-8', 'no-cache'],
  '/index.html': [indexHtml, 'text/html; charset=utf-8', 'no-cache'],
  '/three.min.js': [threeJs, 'application/javascript; charset=utf-8', 'public, max-age=86400'],
  '/LICENSE-three.txt': [threeLicense, 'text/plain; charset=utf-8', 'public, max-age=86400']
};

export class GameServer extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.hub = null; this.timer = null; this.origin = ''; }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Cần kết nối WebSocket', { status: 426 });
    this.origin = new URL(req.url).origin;
    if (!this.hub) this.hub = createHub({ addrs: () => [this.origin] });
    const pair = new WebSocketPair(), client = pair[0], socket = pair[1];
    socket.accept();
    const c = this.hub.connect(s => { try { socket.send(s); } catch (e) {} }, () => { try { socket.close(1000, 'bye'); } catch (e) {} });
    if (!c) { socket.close(1013, 'Máy chủ đã đầy'); return new Response(null, { status: 101, webSocket: client }); }
    socket.addEventListener('message', ev => { if (typeof ev.data === 'string' && ev.data.length <= 4096) this.hub.message(c, ev.data); });
    const bye = () => this.hub.disconnect(c);
    socket.addEventListener('close', bye);
    socket.addEventListener('error', bye);
    if (!this.timer) this.timer = setInterval(() => { this.hub.sweep(); if (!this.hub.size()) { clearInterval(this.timer); this.timer = null; } }, 5000);
    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') return env.GAME.get(env.GAME.idFromName('san-chung')).fetch(req);
    const f = FILES[url.pathname];
    if (!f) return new Response('Không tìm thấy', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    return new Response(f[0], { headers: { 'Content-Type': f[1], 'Cache-Control': f[2], 'X-Content-Type-Options': 'nosniff' } });
  }
};
