// Safe Prisma select — never includes passwordHash in API responses.
export const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};
