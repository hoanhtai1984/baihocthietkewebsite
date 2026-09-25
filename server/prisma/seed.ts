import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { slugify } from '../src/utils/slugify';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Tủ Lạnh', icon: 'bi-thermometer-snow', position: 0 },
  { name: 'Máy Giặt', icon: 'bi-droplet-half', position: 1 },
  { name: 'Tivi', icon: 'bi-tv', position: 2 },
  { name: 'Điều Hòa', icon: 'bi-wind', position: 3 },
];

const PRODUCTS = [
  {
    category: 'Tủ Lạnh',
    name: 'Tủ lạnh Samsung Inverter 380L',
    brand: 'Samsung',
    price: 9990000,
    oldPrice: 11490000,
    specs: { 'Dung tích': '380L', 'Công nghệ': 'Inverter', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Tủ Lạnh',
    name: 'Tủ lạnh LG Inverter 315L',
    brand: 'LG',
    price: 8490000,
    oldPrice: 9790000,
    specs: { 'Dung tích': '315L', 'Công nghệ': 'Inverter Linear', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Tủ Lạnh',
    name: 'Tủ lạnh Panasonic 255L',
    brand: 'Panasonic',
    price: 6990000,
    oldPrice: null,
    specs: { 'Dung tích': '255L', 'Công nghệ': 'ECONAVI', 'Bảo hành': '12 tháng' },
  },
  {
    category: 'Máy Giặt',
    name: 'Máy giặt Electrolux 9kg',
    brand: 'Electrolux',
    price: 7290000,
    oldPrice: 8190000,
    specs: { 'Khối lượng giặt': '9kg', 'Loại': 'Cửa trước', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Máy Giặt',
    name: 'Máy giặt Toshiba 8.5kg',
    brand: 'Toshiba',
    price: 5990000,
    oldPrice: null,
    specs: { 'Khối lượng giặt': '8.5kg', 'Loại': 'Cửa trên', 'Bảo hành': '12 tháng' },
  },
  {
    category: 'Máy Giặt',
    name: 'Máy giặt LG Inverter 9kg',
    brand: 'LG',
    price: 6490000,
    oldPrice: 7290000,
    specs: { 'Khối lượng giặt': '9kg', 'Công nghệ': 'Inverter Direct Drive', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Tivi',
    name: 'Tivi Samsung 55 inch 4K',
    brand: 'Samsung',
    price: 10990000,
    oldPrice: 12990000,
    specs: { 'Kích thước': '55 inch', 'Độ phân giải': '4K UHD', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Tivi',
    name: 'Tivi LG OLED 55 inch',
    brand: 'LG',
    price: 18990000,
    oldPrice: 21990000,
    specs: { 'Kích thước': '55 inch', 'Tấm nền': 'OLED', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Tivi',
    name: 'Tivi TCL 43 inch Smart',
    brand: 'TCL',
    price: 5490000,
    oldPrice: null,
    specs: { 'Kích thước': '43 inch', 'Hệ điều hành': 'Google TV', 'Bảo hành': '12 tháng' },
  },
  {
    category: 'Điều Hòa',
    name: 'Điều hòa Daikin 1 chiều 9000BTU',
    brand: 'Daikin',
    price: 8990000,
    oldPrice: 9990000,
    specs: { 'Công suất': '9000 BTU', 'Loại': '1 chiều', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Điều Hòa',
    name: 'Điều hòa Panasonic Inverter 12000BTU',
    brand: 'Panasonic',
    price: 11490000,
    oldPrice: null,
    specs: { 'Công suất': '12000 BTU', 'Công nghệ': 'Inverter', 'Bảo hành': '24 tháng' },
  },
  {
    category: 'Điều Hòa',
    name: 'Điều hòa LG Inverter 9000BTU',
    brand: 'LG',
    price: 7990000,
    oldPrice: 8790000,
    specs: { 'Công suất': '9000 BTU', 'Công nghệ': 'Dual Inverter', 'Bảo hành': '24 tháng' },
  },
];

async function main() {
  console.log('Đang xoá dữ liệu cũ...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Đang tạo danh mục...');
  const categoryMap = new Map<string, number>();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: { name: cat.name, slug: slugify(cat.name), icon: cat.icon, position: cat.position },
    });
    categoryMap.set(cat.name, created.id);
  }

  console.log('Đang tạo sản phẩm...');
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        brand: p.brand,
        price: p.price,
        oldPrice: p.oldPrice,
        image: `https://placehold.co/400x400?text=${encodeURIComponent(p.brand)}`,
        description: `${p.name} chính hãng ${p.brand}, bảo hành theo tiêu chuẩn hãng, giao hàng toàn quốc.`,
        specs: p.specs,
        stock: 10,
        categoryId: categoryMap.get(p.category)!,
      },
    });
  }

  console.log('Đang tạo tài khoản mẫu...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@example.com', password: adminPassword, role: 'ADMIN' },
  });
  const customerPassword = await bcrypt.hash('customer123', 10);
  await prisma.user.create({
    data: { name: 'Khách Test', email: 'customer@example.com', password: customerPassword, role: 'CUSTOMER' },
  });

  console.log('Seed xong: 4 danh mục, 12 sản phẩm, 2 tài khoản (admin@example.com / customer@example.com).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
