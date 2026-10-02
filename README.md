# ĐiệnMáyMini — Đồ án cuối kỳ

Web bán đồ điện máy thu gọn, lấy cảm hứng giao diện từ dienmaynk.vn. Đồ án
cuối kỳ khoá "Lập trình Full-stack JavaScript".

## Chức năng

**Khách hàng**
- Xem sản phẩm theo danh mục; **lọc theo hãng, khoảng giá, sắp xếp** (giá/tên/mới nhất); tìm kiếm **không phân biệt dấu** (gõ "dieu hoa" ra "Điều Hòa"), gợi ý ngay trên thanh tìm kiếm
- Giỏ hàng lưu trong trình duyệt, **tự đối chiếu lại giá/tồn kho** với server mỗi lần mở giỏ; chặn số lượng vượt tồn kho
- Đặt hàng (COD) có **nhập người nhận + địa chỉ** - cả khách đã đăng nhập lẫn khách vãng lai; trang "Đặt hàng thành công" hiện mã đơn
- **Tra cứu đơn** bằng mã đơn + SĐT (cho khách vãng lai) tại `/tra-cuu-don-hang`
- Đăng ký / đăng nhập (JWT access + refresh), **trang tài khoản** (sửa tên/SĐT, đổi mật khẩu), **xem + tự huỷ đơn** đang "Chờ xác nhận"
- Ô **gợi ý sản phẩm** tại trang chủ: dùng Gemini nếu có `GEMINI_API_KEY`; chưa có key (hoặc Gemini lỗi) thì tự dùng gợi ý theo từ khoá + ngân sách ("tủ lạnh dưới 10 triệu...")

**Quản trị** (`/admin`, tài khoản ADMIN)
- **Tổng quan**: doanh thu, số đơn theo trạng thái, sản phẩm sắp hết hàng, đơn mới nhất
- Sản phẩm: thêm/sửa/ẩn/xoá, nhập thông số kỹ thuật, tìm kiếm + lọc; không xoá được sản phẩm đã nằm trong đơn (gợi ý "Ẩn")
- Danh mục: thêm/sửa/xoá (kèm số sản phẩm); không xoá được danh mục còn sản phẩm
- Đơn hàng: lọc theo trạng thái, xem người nhận/địa chỉ/sản phẩm, đổi trạng thái theo đúng luồng `Chờ xác nhận → Đã xác nhận → Đang giao → Hoàn thành` (huỷ được khi chưa giao đi; **huỷ đơn tự hoàn lại tồn kho**)

**An toàn dữ liệu**
- Trừ tồn kho bằng câu lệnh có điều kiện trong transaction - 2 khách mua món cuối cùng cùng lúc thì chỉ 1 người đặt được, tồn kho không bao giờ âm
- Giá luôn lấy từ server (không tin giá client gửi), kiểm tra dữ liệu đầu vào (SĐT, số lượng, giá...)
- Lỗi trả về tiếng Việt gọn gàng, không lộ chi tiết nội bộ (câu SQL/đường dẫn file)

## API chính

| Nhóm | Endpoint |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `/change-password`; `GET/PATCH /api/auth/me` |
| Sản phẩm | `GET /api/products?category=&search=&brand=&minPrice=&maxPrice=&sort=`, `GET /api/products/brands`, `GET /api/products/:slug` |
| Danh mục | `GET /api/categories` |
| Đơn hàng | `POST /api/orders`, `GET /api/orders/me`, `GET /api/orders/lookup?code=&phone=`, `PATCH /api/orders/:id/cancel` |
| AI | `POST /api/ai/suggest` |
| Admin | `/api/admin/stats`, `/api/admin/products`, `/api/admin/categories`, `/api/admin/orders` (+ `PATCH /:id/status`) |

## Công nghệ

- **Client**: Vite + React 19 + TypeScript + React Router (SPA) + Bootstrap 5
- **Server**: Node + Express 5 + TypeScript + Prisma ORM + PostgreSQL + JWT
- **AI**: Google Gemini (gợi ý sản phẩm theo câu hỏi tự nhiên)

## Cấu trúc

```
client/   - Frontend (Vite React SPA)
server/   - Backend (Express + Prisma)
```

## Chạy nhanh (đã setup sẵn DB Neon)

Máy này đã cài `npm install` + nối sẵn DB Neon + seed dữ liệu — chỉ cần
chạy 1 file để bật cả server lẫn client:

```bash
start-all.bat
```

(double-click file `start-all.bat` ở thư mục gốc dự án cũng được). File
này mở 2 cửa sổ terminal: server tại `http://localhost:4001`, client tại
`http://localhost:5174` — đợi vài giây rồi mở trình duyệt vào
`http://localhost:5174`.

Tài khoản mẫu: Admin `admin@example.com` / `admin123`, Khách
`customer@example.com` / `customer123`.

## Setup lần đầu (máy khác / cài lại từ đầu)

### 1. Database (PostgreSQL)

Tạo 1 database Postgres miễn phí (Neon/Render/Supabase), lấy connection
string dạng `postgresql://user:pass@host/db?sslmode=require`.

### 2. Server

```bash
cd server
cp .env.example .env   # điền DATABASE_URL, JWT secrets, GEMINI_API_KEY
npm install
npm run prisma:migrate # tạo bảng theo schema.prisma
npm run seed            # tạo 4 danh mục + 12 sản phẩm + 2 tài khoản mẫu
npm run dev              # chạy tại http://localhost:4000 (đổi PORT trong .env nếu cần)
```

Tài khoản mẫu sau khi seed:
- Admin: `admin@example.com` / `admin123`
- Khách: `customer@example.com` / `customer123`

### 3. Client

```bash
cd client
cp .env.example .env   # VITE_API_URL trỏ đúng URL server ở trên
npm install
npm run dev              # chạy tại http://localhost:5173
```

## Scripts hữu ích

| Lệnh | Vị trí | Mô tả |
|---|---|---|
| `npm run dev` | client, server | Chạy dev server |
| `npm run typecheck` | client, server | Kiểm tra kiểu TypeScript |
| `npm run build` | client, server | Build production |
| `npm run seed` | server | Tạo lại dữ liệu mẫu (XOÁ dữ liệu cũ) |

## Deploy

- **Client** → Vercel (build command `npm run build`, output `dist/`)
- **Server** → Render (build `npm run build`, start `npm run start`)
- **Database** → Render/Neon PostgreSQL

Nhớ đặt biến môi trường đúng ở mỗi nơi: server cần `DATABASE_URL`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY` (không bắt buộc),
`GEMINI_MODEL` (không bắt buộc, mặc định `gemini-2.0-flash`), `FE_URL` (URL
frontend thật để whitelist CORS; nhiều địa chỉ ngăn cách bằng dấu phẩy); client cần `VITE_API_URL` (URL
backend thật).
