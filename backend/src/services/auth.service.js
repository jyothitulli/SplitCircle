import bcrypt from 'bcrypt';

import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/jwt.js';
import { userPublicSelect } from '../utils/userSelect.js';

const BCRYPT_ROUNDS = 12;

function buildAuthResponse(user) {
  const token = signToken({ userId: user.id });
  return { user, token };
}

export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: userPublicSelect,
    });

    return buildAuthResponse(user);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('Email already in use', 409);
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...userPublicSelect, passwordHash: true },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const publicUser = { ...user };
  delete publicUser.passwordHash;
  return buildAuthResponse(publicUser);
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userPublicSelect,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}
