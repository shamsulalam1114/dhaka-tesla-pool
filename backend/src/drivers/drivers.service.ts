import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    return this.prisma.driver.findUnique({
      where: { userId },
      include: { user: true, vehicle: true },
    });
  }

  async setOnlineStatus(userId: string, isOnline: boolean) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');

    return this.prisma.driver.update({
      where: { userId },
      data: { isOnline },
      include: { vehicle: true },
    });
  }

  async getPendingRides(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');

    return this.prisma.ride.findMany({
      where: { status: 'REQUESTED' },
      include: {
        passengers: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async acceptRide(userId: string, rideId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { vehicle: true },
    });
    if (!driver) throw new NotFoundException('Driver profile not found');
    if (!driver.isOnline) throw new ForbiddenException('Go online before accepting rides');

    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== 'REQUESTED' && ride.status !== 'MATCHED') {
      throw new ForbiddenException('This ride cannot be accepted anymore');
    }

    return this.prisma.ride.update({
      where: { id: rideId },
      data: { driverId: driver.id, status: 'MATCHED' },
      include: { passengers: { include: { user: true } } },
    });
  }

  async updateRideStatus(userId: string, rideId: string, status: 'DRIVER_ARRIVED' | 'STARTED' | 'COMPLETED') {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');

    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driver.id) {
      throw new ForbiddenException('Not your ride');
    }

    const validTransitions: Record<string, string> = {
      DRIVER_ARRIVED: 'MATCHED',
      STARTED: 'DRIVER_ARRIVED',
      COMPLETED: 'STARTED',
    };

    if (ride.status !== validTransitions[status]) {
      throw new ForbiddenException(`Cannot transition from ${ride.status} to ${status}`);
    }

    return this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status,
        ...(status === 'STARTED' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
      include: { passengers: { include: { user: true } } },
    });
  }

  async getMyRideHistory(userId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');

    return this.prisma.ride.findMany({
      where: { driverId: driver.id },
      include: {
        passengers: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
