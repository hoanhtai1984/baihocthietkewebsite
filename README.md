# ĐiệnMáyMini — Đồ án cuối kỳ

Web bán đồ điện máy thu gọn, lấy cảm hứng giao diện từ dienmaynk.vn. Đồ án
cuối kỳ khoá "Lập trình Full-stack JavaScript".

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
npm run dev              # chạy tại http://localhost:4000
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
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GEMINI_API_KEY`, `FE_URL`
(URL frontend thật để whitelist CORS); client cần `VITE_API_URL` (URL
backend thật).
