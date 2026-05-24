import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const jwt = { sign: jest.fn().mockReturnValue('token-123') };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as never, jwt as never);
  });

  it('registers user and returns token', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
    });
    const result = await service.register({
      email: 'a@b.com',
      password: 'secret123',
    });
    expect(result.accessToken).toBe('token-123');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('throws on invalid login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs in with valid password', async () => {
    const hash = await bcrypt.hash('secret123', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: hash,
    });
    const result = await service.login({
      email: 'a@b.com',
      password: 'secret123',
    });
    expect(result.accessToken).toBe('token-123');
  });
});
