import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export async function register(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Object.assign(new Error('이미 가입된 이메일입니다.'), { status: 409 });
  }

  const hashedPassword = await hashPassword(data.password);

  await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
    },
  });

  return { message: '회원가입이 완료되었습니다.' };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { status: 401 });
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { status: 401 });
  }

  const tokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function refresh(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
    return { accessToken };
  } catch {
    throw Object.assign(new Error('유효하지 않은 리프레시 토큰입니다.'), { status: 401 });
  }
}
