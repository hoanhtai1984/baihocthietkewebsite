import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AppError } from '../utils/appError';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone: string | null;
}

export interface Session {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

// Hash giả để so sánh khi email không tồn tại - giữ thời gian phản hồi gần như
// nhau, không lộ email nào đã đăng ký.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);
const BCRYPT_ROUNDS = 10;

// Chỉ các field an toàn được gửi ra ngoài - KHÔNG bao giờ có password/refreshTokenHash.
export const USER_SELECT = { id: true, name: true, email: true, role: true, phone: true } as const;

function toPublicUser(user: PublicUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
}

// Tạo cặp token mới và lưu BĂM của refresh token vào DB (để thu hồi/xoay vòng).
async function issueSession(user: PublicUser): Promise<Session> {
  const payload = { id: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: hashToken(refreshToken) } });
  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function register(input: { name: string; email: string; password: string; phone?: string }): Promise<Session> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'Email đã được đăng ký');

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      phone: input.phone || null,
    },
    select: USER_SELECT,
  });
  logger.info({ userId: user.id }, 'User registered');
  return issueSession(user);
}

export async function login(input: { email: string; password: string }): Promise<Session> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const match = await bcrypt.compare(input.password, user?.password || DUMMY_HASH);
  if (!user || !match) throw new AppError(401, 'Email hoặc mật khẩu không đúng');
  logger.info({ userId: user.id }, 'User logged in');
  return issueSession(user);
}

// Xoay vòng refresh token: mỗi lần refresh cấp token MỚI và vô hiệu token cũ.
// updateMany có điều kiện (băm cũ còn khớp) để 2 request refresh đồng thời với
// cùng 1 token chỉ có 1 request thành công - request còn lại bị từ chối.
export async function refresh(refreshToken: string): Promise<Session> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'refreshToken không hợp lệ hoặc đã hết hạn');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  const oldHash = hashToken(refreshToken);
  if (!user || user.refreshTokenHash !== oldHash) {
    throw new AppError(401, 'Phiên đăng nhập không còn hiệu lực, vui lòng đăng nhập lại');
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const newRefreshToken = signRefreshToken({ id: user.id, role: user.role });
  const rotated = await prisma.user.updateMany({
    where: { id: user.id, refreshTokenHash: oldHash },
    data: { refreshTokenHash: hashToken(newRefreshToken) },
  });
  if (rotated.count === 0) {
    throw new AppError(401, 'Phiên đăng nhập không còn hiệu lực, vui lòng đăng nhập lại');
  }
  return { user: toPublicUser(user), accessToken, refreshToken: newRefreshToken };
}

// Đăng xuất = thu hồi refresh token trên server (không chỉ xoá localStorage).
export async function logout(userId: number): Promise<void> {
  await prisma.user.updateMany({ where: { id: userId }, data: { refreshTokenHash: null } });
  logger.info({ userId }, 'User logged out');
}

export async function getProfile(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw new AppError(401, 'Tài khoản không còn tồn tại');
  return user;
}

export async function updateProfile(userId: number, input: { name?: string; phone?: string }): Promise<PublicUser> {
  const data: { name?: string; phone?: string | null } = {};
  if (input.name !== undefined) data.name = input.name;
  // Chuỗi rỗng = xoá SĐT
  if (input.phone !== undefined) data.phone = input.phone || null;
  return prisma.user.update({ where: { id: userId }, data, select: USER_SELECT });
}

// Đổi mật khẩu xong thu hồi mọi phiên cũ và cấp phiên mới cho thiết bị đang dùng.
export async function changePassword(userId: number, input: { currentPassword: string; newPassword: string }): Promise<Session> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(input.currentPassword, user.password))) {
    throw new AppError(400, 'Mật khẩu hiện tại không đúng');
  }
  await prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) } });
  logger.info({ userId }, 'Password changed');
  return issueSession(user);
}
