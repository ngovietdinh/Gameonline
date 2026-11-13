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

- **Đấu đội (mặc định):** hai phe **Công an** và **Tội phạm**. Vào phòng thì được xếp vào phe đang ít người hơn; ở phòng chờ bấm nút để đổi phe, lúc đang đấu thì tạm dừng rồi bấm **Đổi phe**.
- Hai phe không được chênh nhau quá 2 người: phe đang đông hơn 2 thì không vào thêm được. Lúc bắt đầu trận, nếu vẫn lệch quá 2 thì máy chủ tự chuyển người vào sau cùng của phe đông sang phe kia.
- Không bắn trúng đồng đội. Mỗi lần hạ một đối thủ, phe mình được 1 điểm; hết giờ phe nhiều điểm hơn thắng.
- Công an mặc đồng phục xanh đen, áo giáp có chữ, tên hiện màu xanh với đồng đội. Tội phạm mặc đồ tối màu, áo ngực nâu, mũ đỏ sẫm. Tên đối thủ hiện màu đỏ.
- **Tự do:** chọn lúc tạo phòng nếu muốn ai cũng là đối thủ của nhau.

- Mỗi phòng là một trận riêng, có đồng hồ đếm ngược. Hết giờ, ai hạ nhiều nhất thắng (bằng nhau thì ai chết ít hơn xếp trên), rồi cả phòng về phòng chờ để chủ phòng bắt đầu trận mới.
- Chủ phòng rời đi thì người vào sớm nhất còn lại lên làm chủ phòng. Phòng trống tự đóng.
- Người chơi khác hiện ra là lính: mũ sắt, kính, áo giáp, ba lô, quân phục rằn ri; chân tay cử động khi chạy, người ngả theo hướng ngắm, bị hạ thì ngã xuống. Mỗi người có một màu nhận diện trên vai, mũ và ba lô.
- Chết thì 3 giây sau hồi sinh ở điểm xa đối thủ nhất. Bắn trúng đầu gây sát thương gấp 1,6 lần. Không trúng đạn 5 giây thì máu tự hồi.
- Máy chủ chứa tối đa 20 phòng và 64 người cùng lúc.
- Vẫn có chế độ chơi đơn chống máy bay tuần tra.

## Bản đồ

Chọn bản đồ ở màn hình đầu (chơi đơn) hoặc lúc tạo phòng (đấu nhiều người).

| Bản đồ | Đặc điểm |
|---|---|
| Hẻm | Hẻm hẹp, sân trong và một con phố lớn ở cuối hẻm. Nhiều góc khuất, hợp đánh gần |
| Chợ đêm | Quảng trường rộng có đài phun nước, hai dãy sạp, sân khấu. Tầm nhìn xa, hợp súng tỉa |
| Công trường | Nhà hai tầng đang xây, giàn giáo, bãi ống cống, lán chỉ huy, cần trục. Nửa kín nửa trống |

## Vũ khí

| Phím | Súng | Băng đạn | Đặc điểm |
|---|---|---|---|
| 1 | Các-bin | 30 | Tự động, cân bằng ở mọi tầm |
| 2 | Tiểu liên | 32 | Bắn rất nhanh, mạnh ở tầm gần, yếu dần khi xa |
| 3 | Hoa cải | 6 | 9 viên chùm mỗi phát, rất mạnh ở sát bên |
| 4 | Súng tỉa | 5 | Một phát rất mạnh, giữ chuột phải để nhìn qua ống ngắm |
| 5 | Súng lục | 12 | Bắn từng phát, rút nhanh, nạp nhanh |
| 6 | Trung liên | 75 | Băng đạn lớn, bắn dài, nạp lâu |
| 7 | Tên lửa | 1 | Bay thẳng, nổ lan rộng 6,5 m, nạp lâu. Đứng gần chỗ nổ cũng mất máu |
| 8 | Phóng lựu | 6 | Lựu đạn bay cầu vồng, nổ khi chạm, nổ lan 4,8 m |

Đổi súng bằng phím 1 đến 8, lăn chuột, hoặc Q để về khẩu vừa dùng. Trên điện thoại bấm nút Đổi.

Đường đạn hiện thành vệt sáng bay từ nòng tới điểm chạm, kèm một vệt khói mờ. Đạn của mình màu vàng, đạn của người khác màu đỏ cam.

## Đối chiếu bảng yêu cầu đồ họa

Số đo lấy trên bản đồ Hẻm, mức đồ họa Vừa, bằng bộ đo trong game (bấm **F3** để hiện số lượt vẽ và số tam giác cạnh số khung hình).

| Hạng mục | Yêu cầu | Hiện trạng |
|---|---|---|
| 1. Phong cách | Low-poly hoặc stylized, hạn chế PBR nặng | Mức Thấp và Vừa (mặc định) dùng chất liệu nhẹ không PBR. PBR chỉ còn ở mức Cao cho máy mạnh |
| 2. Đa giác | Nhân vật 3.000–6.000, vũ khí 4.000–8.000, vật thể 100–1.500 | Lính 3.980 tam giác. Súng 444–1.344 (chưa tính tay), dưới mức trần. Máy bay 2.382. Cả cảnh khoảng 87.000 |
| 3. Texture | Atlas, tối đa 2048 và 1024, nén WebP hoặc KTX2 | Mọi texture sinh bằng mã lúc tải, cỡ 256–512, không tải file ảnh nào. Khối tĩnh gộp theo chất liệu thay cho atlas. Chưa đạt: còn khoảng 340 lượt vẽ, phần lớn do súng và dây điện chưa gộp |
| 4. Hiệu ứng hạt | Ít hạt, sprite 2D, có giới hạn | Tối đa 420 hạt và 46 sprite khói dùng lại. Mức Vừa giảm 25% số hạt, mức Thấp giảm 50% |
| 5. Ánh sáng | Lightmap nướng sẵn, bóng đơn giản | Mức Thấp và Vừa nướng ánh sáng vào màu đỉnh lúc dựng bản đồ (8–47 ms), có bóng khuất do nhà và vật cản. Nhân vật dùng bóng tròn dưới chân. Hạn chế: chớp lửa đầu nòng và vụ nổ không rọi sáng tường ở hai mức này |
| 6. Giao diện | Phẳng, tối giản, có tâm ngắm, máu, đạn, bản đồ nhỏ | Có đủ, kể cả bản đồ nhỏ: đồng đội luôn hiện, đối thủ chỉ hiện chốc lát sau khi nổ súng. Không dùng blur |
| 7. Hiệu năng | 60 khung hình/giây trên máy tầm trung, tải dưới 5–10 giây | Tải 2,2–2,6 giây khi chạy tại chỗ; gói tải về khoảng 215 KB đã nén. Tự giảm độ nét và mức đồ họa khi dưới 45 khung hình/giây. Chưa đo được số khung hình trên máy thật |

Ghi chú về quy trình: game không dùng file mô hình ngoài, mọi hình khối dựng bằng mã, nên chưa cần xuất `.glb` hay nén Draco. Nếu sau này thêm mô hình từ phần mềm 3D thì dùng `.glb` có nén Draco như bảng yêu cầu.

## Nếu bị giật

- Góc trên phải hiện số khung hình mỗi giây và mức đồ họa đang chạy.
- Game tự giảm độ nét rồi tự hạ mức đồ họa khi dưới 45 khung hình mỗi giây. Muốn chọn tay thì đổi **Đồ họa** ở màn hình đầu hoặc lúc tạm dừng: Thấp nhẹ nhất (ánh sáng nướng sẵn, không hậu kỳ), Vừa là mặc định (ánh sáng nướng sẵn, có quầng sáng), Cao đẹp nhất nhưng nặng (PBR, bóng đổ thật, phản chiếu mặt đường).
- Đóng bớt thẻ trình duyệt khác và bật tăng tốc phần cứng trong cài đặt trình duyệt.

## Điều khiển

- Máy tính: WASD chạy, chuột ngắm, chuột trái bắn, chuột phải ngắm kỹ, R nạp đạn, 1 đến 8 đổi súng, Space nhảy, Esc tạm dừng.
- **Shift** (giữ, khi đang tiến): chạy nhanh. **Ctrl** hoặc **C** (giữ): ngồi, đi chậm hơn, bắn chụm hơn, khó bị trúng hơn. **Tab** (giữ): bảng thành tích.
- Khi vào trận, game tự bật toàn màn hình. Trên Chrome và Edge việc này còn khóa phím, nhờ đó giữ Ctrl rồi bấm W không đóng thẻ trình duyệt. Trên Firefox và Safari, Ctrl+W vẫn là lệnh đóng thẻ (trình duyệt sẽ hỏi lại trước khi đóng), nên dùng phím C để ngồi.
- Điện thoại: kéo nửa trái để chạy, kéo nửa phải để ngắm, giữ nút Bắn; có nút Ngắm, Nạp, Đổi, Nhảy, Ngồi. Nút ≡ ở góc trên phải mở bảng thành tích.

## Trong thư mục có gì

- `server.js` — máy chủ LAN (Node, không cần cài gói): phát trang web và mở cổng WebSocket.
- `src/hub.mjs` — logic phòng đấu và đồng hồ trận, dùng chung cho cả hai cách chạy.
- `src/worker.js`, `wrangler.toml` — bản Cloudflare Workers.
- `public/index.html` — toàn bộ game.
- `public/three.min.js` — thư viện three.js r128 (giấy phép MIT, xem `public/LICENSE-three.txt`).

Sát thương do máy người bắn tự tính nên không chống gian lận; dùng để chơi với người quen.
