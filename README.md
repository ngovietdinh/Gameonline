# Hẻm Mưa

Game bắn súng 3D góc nhìn thứ nhất, đấu nhiều người theo phòng. Có hai cách chạy, dùng chung một bộ mã:

- **Trực tuyến trên Cloudflare**: mở https://hem-mua.gsnvbu.workers.dev ở bất cứ đâu có mạng.
- **Mạng LAN**: một máy làm máy chủ, các máy khác cùng Wi-Fi hoặc cùng mạng dây mở trình duyệt vào đấu.

## Chơi trực tuyến (Cloudflare)

Gửi địa chỉ https://hem-mua.gsnvbu.workers.dev cho mọi người. Ai cũng mở được, không cần cùng mạng, không cần đăng nhập. Bấm **Đấu trực tuyến**, rồi tạo phòng hoặc vào phòng có sẵn.

Triển khai lại sau khi sửa mã:

```
npm install
npx wrangler login
npm run deploy
```

Ghi chú:

- Worker (`src/worker.js`) phát trang game và chuyển `/ws` vào một Durable Object giữ kết nối, phòng đấu và đồng hồ trận.
- Trang game trong `public/` được nhúng thẳng vào Worker lúc triển khai, nên sửa `public/index.html` xong phải triển khai lại.
- Gói miễn phí của Cloudflare giới hạn số yêu cầu mỗi ngày, và mỗi người chơi gửi vị trí khoảng 12 lần mỗi giây. Chơi đông và lâu có thể chạm giới hạn trong ngày; xem mức dùng ở bảng điều khiển Cloudflare.
- Địa chỉ này công khai: ai có đường dẫn cũng vào được.

## Chơi mạng LAN

1. Cài [Node.js](https://nodejs.org) (bản 16 trở lên) trên máy làm máy chủ. Không cần cài thêm gói nào.
2. Mở cửa sổ dòng lệnh trong thư mục này rồi chạy:

   ```
   node server.js
   ```

   Trên Windows có thể bấm đúp `chay.bat`.
3. Máy chủ in ra hai loại địa chỉ:
   - `http://localhost:8080` — mở trên chính máy chủ.
   - `http://192.168.x.x:8080` — gửi cho các máy khác cùng mạng.
4. Mỗi người mở địa chỉ đó bằng Chrome, Edge, Firefox hoặc Safari, gõ tên, bấm **Đấu mạng LAN**.
5. Một người **tạo phòng** (đặt tên, chọn 3, 5 hoặc 10 phút, chọn tối đa 4, 8 hoặc 16 người). Những người khác thấy phòng trong danh sách và bấm **Vào**.
6. Chủ phòng bấm **Bắt đầu trận**. Ai vào sau khi trận đã chạy thì nhập cuộc luôn với thời gian còn lại.

Đổi cổng: `PORT=9000 node server.js` (Windows: `set PORT=9000` rồi `node server.js`).

## Nếu máy khác không vào được

- Kiểm tra các máy có cùng một mạng không (cùng Wi-Fi, không phải mạng khách bị cách ly).
- Windows hỏi quyền tường lửa cho Node.js lần đầu chạy: chọn cho phép mạng riêng.
- Mở thẳng file `public/index.html` thì chỉ chơi đơn được. Phải vào qua địa chỉ máy chủ in ra.

## Luật chơi

- Mỗi phòng là một trận riêng, có đồng hồ đếm ngược. Hết giờ, ai hạ nhiều nhất thắng (bằng nhau thì ai chết ít hơn xếp trên), rồi cả phòng về phòng chờ để chủ phòng bắt đầu trận mới.
- Chủ phòng rời đi thì người vào sớm nhất còn lại lên làm chủ phòng. Phòng trống tự đóng.
- Người chơi khác hiện ra là lính: mũ sắt, kính, áo giáp, ba lô, quân phục rằn ri; chân tay cử động khi chạy, người ngả theo hướng ngắm, bị hạ thì ngã xuống. Mỗi người có một màu nhận diện trên vai, mũ và ba lô.
- Chết thì 3 giây sau hồi sinh ở điểm xa đối thủ nhất. Bắn trúng đầu gây sát thương gấp 1,6 lần. Không trúng đạn 5 giây thì máu tự hồi.
- Máy chủ chứa tối đa 20 phòng và 64 người cùng lúc.
- Vẫn có chế độ chơi đơn chống máy bay tuần tra.

## Vũ khí

| Phím | Súng | Băng đạn | Đặc điểm |
|---|---|---|---|
| 1 | Các-bin | 30 | Tự động, cân bằng ở mọi tầm |
| 2 | Tiểu liên | 32 | Bắn rất nhanh, mạnh ở tầm gần, yếu dần khi xa |
| 3 | Hoa cải | 6 | 9 viên chùm mỗi phát, rất mạnh ở sát bên |
| 4 | Súng tỉa | 5 | Một phát rất mạnh, giữ chuột phải để nhìn qua ống ngắm |
| 5 | Súng lục | 12 | Bắn từng phát, rút nhanh, nạp nhanh |

Đổi súng bằng phím 1 đến 5, lăn chuột, hoặc Q để về khẩu vừa dùng. Trên điện thoại bấm nút Đổi.

## Điều khiển

- Máy tính: WASD chạy, chuột ngắm, chuột trái bắn, chuột phải ngắm kỹ, R nạp đạn, 1 đến 5 đổi súng, Shift chạy nhanh, Space nhảy, Esc tạm dừng.
- Điện thoại: kéo nửa trái để chạy, kéo nửa phải để ngắm, giữ nút Bắn; có nút Ngắm, Nạp, Đổi, Nhảy.

## Trong thư mục có gì

- `server.js` — máy chủ LAN (Node, không cần cài gói): phát trang web và mở cổng WebSocket.
- `src/hub.mjs` — logic phòng đấu và đồng hồ trận, dùng chung cho cả hai cách chạy.
- `src/worker.js`, `wrangler.toml` — bản Cloudflare Workers.
- `public/index.html` — toàn bộ game.
- `public/three.min.js` — thư viện three.js r128 (giấy phép MIT, xem `public/LICENSE-three.txt`).

Sát thương do máy người bắn tự tính nên không chống gian lận; dùng để chơi với người quen.
