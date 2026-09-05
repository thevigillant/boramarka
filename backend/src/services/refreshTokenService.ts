import crypto from 'crypto';
import { prisma } from '../db';

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

export async function createRefreshToken(adminId: number): Promise<string> {
  const token = generateRefreshTokenString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  await prisma.refreshToken.create({
    data: {
      token,
      adminId,
      expiresAt,
    },
  });

  return token;
}

export async function verifyAndRotateRefreshToken(rawToken: string): Promise<{ adminId: number; newToken: string } | null> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: rawToken },
  });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return null;
  }

  // Revoga o token atual (token rotation por segurança)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });

  // Emite novo refresh token
  const newToken = await createRefreshToken(stored.adminId);

  return { adminId: stored.adminId, newToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: rawToken },
    data: { revoked: true },
  });
}

/**
 * Limpa todos os refresh tokens que expiraram ou foram revogados.
 * Evita crescimento indefinido da tabela refresh_tokens.
 */
export async function cleanupExpiredRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revoked: true },
      ],
    },
  });
  return result.count;
}

