// Logic phòng đấu dùng chung cho máy chủ LAN (server.js) và Cloudflare (src/worker.js).
// Không phụ thuộc cách truyền tin: nơi gọi đưa vào hàm gửi chuỗi và hàm đóng kết nối.
const MAX_CLIENTS = 64, MAX_ROOMS = 20, MAX_ROOM_PLAYERS = 16, STALE_MS = 20000;
const CODE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const num = v => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n);
const clampNum = (v, a, b, def) => { v = +v; return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : def; };

export function createHub({ addrs = () => [], log = () => {} } = {}) {
  const clients = new Map(), rooms = new Map();
  let nextId = 1;
  const send = (c, obj) => c.out(JSON.stringify(obj));
  const toRoom = (r, from, obj) => { const s = JSON.stringify(obj); for (const c of r.members) if (c !== from) c.out(s); };
  function newCode() { let c; do { c = ''; for (let i = 0; i < 4; i++) c += CODE[Math.random() * CODE.length | 0]; } while (rooms.has(c)); return c; }
  const roomInfo = r => ({ code: r.code, name: r.name, n: r.members.size, max: r.max, dur: r.dur, state: r.state, left: r.state === 'play' ? Math.max(0, r.endAt - Date.now()) : 0 });
  const roomFull = r => Object.assign(roomInfo(r), { host: r.host, players: [...r.members].map(c => ({ id: c.id, n: c.name })) });
  function pushRooms(to) {
    const msg = { t: 'rooms', list: [...rooms.values()].map(roomInfo) };
    if (to) send(to, msg); else { const s = JSON.stringify(msg); for (const c of clients.values()) if (!c.room) c.out(s); }
  }
  const pushRoom = r => toRoom(r, null, { t: 'room', room: roomFull(r) });
  function leave(c) {
    const r = c.room; if (!r) return;
    r.members.delete(c); c.room = null; c.state = null; toRoom(r, null, { t: 'bye', id: c.id });
    if (!r.members.size) { clearTimeout(r.timer); rooms.delete(r.code); log('  phòng ' + r.code + ' đóng'); }
    else { if (r.host === c.id) r.host = [...r.members][0].id; pushRoom(r); }
    pushRooms();
  }
  function join(c, r) {
    if (c.room === r) return;
    if (r.members.size >= r.max) { send(c, { t: 'err', msg: 'Phòng đã đủ người.' }); return; }
    if (c.room) leave(c);
    r.members.add(c); c.room = r; c.state = null; pushRoom(r);
    if (r.state === 'play') for (const o of r.members) if (o !== c && o.state) send(c, { t: 's', id: o.id, s: o.state });
    pushRooms();
  }
  function startMatch(r) {
    r.state = 'play'; r.endAt = Date.now() + r.dur * 60000; for (const c of r.members) c.state = null;
    clearTimeout(r.timer); r.timer = setTimeout(() => endMatch(r), r.dur * 60000);
    log('  phòng ' + r.code + ' bắt đầu trận ' + r.dur + ' phút, ' + r.members.size + ' người');
    pushRoom(r); pushRooms();
  }
  function endMatch(r) {
    if (rooms.get(r.code) !== r || r.state !== 'play') return;
    r.state = 'wait';
    const board = [...r.members].map(c => ({ id: c.id, n: c.name, k: c.state ? c.state.k : 0, d: c.state ? c.state.d : 0 })).sort((a, b) => b.k - a.k || a.d - b.d);
    for (const c of r.members) { send(c, { t: 'end', board }); c.state = null; }
    log('  phòng ' + r.code + ' hết giờ' + (board[0] ? ', dẫn đầu: ' + board[0].n + ' (' + board[0].k + ' hạ)' : ''));
    pushRoom(r); pushRooms();
  }
  function handle(c, m) {
    if (!m || typeof m !== 'object') return;
    c.seen = Date.now();
    const r = c.room;
    switch (m.t) {
      case 'hello': c.name = clean(m.n, 12) || c.name; break;
      case 'rooms': pushRooms(c); break;
      case 'create': {
        if (rooms.size >= MAX_ROOMS) { send(c, { t: 'err', msg: 'Máy chủ đã đủ số phòng.' }); break; }
        c.name = clean(m.n, 12) || c.name;
        const room = { code: newCode(), name: clean(m.name, 20) || 'Phòng của ' + c.name, host: c.id, dur: clampNum(m.dur, .1, 30, 5), max: Math.round(clampNum(m.max, 2, MAX_ROOM_PLAYERS, 8)), state: 'wait', endAt: 0, members: new Set(), timer: null };
        rooms.set(room.code, room); log('  phòng ' + room.code + ' "' + room.name + '" do ' + c.name + ' tạo');
        join(c, room); break;
      }
      case 'join': {
        c.name = clean(m.n, 12) || c.name;
        const room = rooms.get(clean(m.code, 4).toUpperCase());
        if (!room) { send(c, { t: 'err', msg: 'Không tìm thấy phòng.' }); pushRooms(c); } else join(c, room);
        break;
      }
      case 'leave': leave(c); break;
      case 'start': if (r && r.host === c.id && r.state === 'wait') startMatch(r); break;
      case 's':
        if (!r || r.state !== 'play') break;
        c.state = { m: 'pvp', n: c.name, x: num(m.x), y: num(m.y), z: num(m.z), yw: num(m.yw), a: m.a ? 1 : 0, k: Math.max(0, m.k | 0), d: Math.max(0, m.d | 0) };
        toRoom(r, c, { t: 's', id: c.id, s: c.state }); break;
      case 'hit': {
        if (!r || r.state !== 'play') break;
        const to = clients.get(String(m.to)), d = +m.d;
        if (to && to !== c && to.room === r && d > 0 && d <= 200) send(to, { t: 'hit', from: c.id, d: Math.round(d) });
        break;
      }
      case 'shot':
        if (r && r.state === 'play' && Array.isArray(m.e) && m.e.length === 3 && m.e.every(Number.isFinite)) toRoom(r, c, { t: 'shot', from: c.id, w: Math.min(9, Math.max(0, m.w | 0)), e: m.e.map(num) });
        break;
      case 'kill': if (r && r.state === 'play') toRoom(r, c, { t: 'kill', from: c.id, by: typeof m.by === 'string' ? m.by.slice(0, 12) : null }); break;
    }
  }
  return {
    // out(chuỗi): gửi cho người chơi; close(): đóng kết nối. Trả về null nếu máy chủ đã đầy.
    connect(out, close) {
      if (clients.size >= MAX_CLIENTS) return null;
      const c = { id: 'p' + (nextId++), out, close, state: null, room: null, name: 'Khách', seen: Date.now() };
      clients.set(c.id, c);
      send(c, { t: 'hi', id: c.id, addrs: addrs(), rooms: [...rooms.values()].map(roomInfo) });
      log('+ ' + c.id + ' vào (' + clients.size + ' người)');
      return c;
    },
    message(c, text) { if (!clients.has(c.id)) return; let m; try { m = JSON.parse(text); } catch (e) { return; } handle(c, m); },
    disconnect(c) { if (!clients.has(c.id)) return; leave(c); clients.delete(c.id); log('- ' + c.id + ' rời đi (' + clients.size + ' người)'); },
    sweep() { const now = Date.now(); for (const c of [...clients.values()]) if (now - c.seen > STALE_MS) { this.disconnect(c); c.close(); } },
    size: () => clients.size
  };
}
