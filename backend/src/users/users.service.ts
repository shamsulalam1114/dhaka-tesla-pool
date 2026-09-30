import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        walletPaisa: true,
        createdAt: true,
      },
    });
  }

  async getRideHistory(userId: string) {
    return this.prisma.ridePassenger.findMany({
      where: { userId },
      include: {
        ride: {
          include: { driver: { include: { user: true, vehicle: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }
}
