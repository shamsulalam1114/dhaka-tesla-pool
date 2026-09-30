import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestRideDto } from './rides.dto';

const ZONE_DISTANCES: Record<string, number> = {
  Banani: 0,
  Mohakhali: 20,
  'Gulshan 1': 25,
  'Gulshan 2': 30,
  Dhanmondi: 45,
  Mirpur: 50,
  Uttara: 60,
  Farmgate: 35,
  Bashundhara: 55,
};

const BASE_FARE = 50;
const POOL_DISCOUNT = 10;

function calculateFare(destinationZone: string, isPooled: boolean): number {
  let distance = 30;
  if (ZONE_DISTANCES[destinationZone]) {
    distance = ZONE_DISTANCES[destinationZone];
  }
  
  let discount = 0;
  if (isPooled) {
    discount = POOL_DISCOUNT;
  }
  
  return BASE_FARE + distance - discount;
}

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  async requestRide(userId: string, dto: RequestRideDto) {
    const alreadyOnRide = await this.prisma.ridePassenger.findFirst({
      where: {
        userId: userId,
        isCancelled: false,
        ride: { status: { in: ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'] } },
      },
    });

    if (alreadyOnRide) {
      throw new BadRequestException('You already have an active ride');
    }

    const matchableRide = await this.prisma.ride.findFirst({
      where: {
        status: { in: ['REQUESTED', 'MATCHED'] },
        pickupZone: dto.pickupZone,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (matchableRide) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { driver: { id: matchableRide.driverId ?? undefined } },
      });
      const capacity = vehicle?.capacity ?? 3;
      const available = capacity - matchableRide.occupiedSeats;

      if (available >= dto.seatsRequested) {
        const totalFare = calculateFare(dto.destinationZone, true);

        return this.prisma.$transaction(async (tx) => {
          const fresh = await tx.ride.findUnique({ where: { id: matchableRide.id } });
          if (!fresh || capacity - fresh.occupiedSeats < dto.seatsRequested) {
            throw new BadRequestException('No seats available — try again');
          }

          await tx.ride.update({
            where: { id: matchableRide.id },
            data: { occupiedSeats: { increment: dto.seatsRequested } },
          });

          return tx.ridePassenger.create({
            data: {
              rideId: matchableRide.id,
              userId: userId,
              pickupZone: dto.pickupZone,
              destinationZone: dto.destinationZone,
              seatsRequested: dto.seatsRequested,
              baseFare: BASE_FARE,
              distanceFare: ZONE_DISTANCES[dto.destinationZone] || 30,
              poolDiscount: POOL_DISCOUNT,
              totalFare: totalFare,
            },
            include: { ride: true },
          });
        });
      }
    }

    const newRide = await this.prisma.ride.create({
      data: {
        pickupZone: dto.pickupZone,
        status: 'REQUESTED',
        totalSeats: 3,
        occupiedSeats: dto.seatsRequested,
      },
    });

    const totalFare = calculateFare(dto.destinationZone, false);

    return this.prisma.ridePassenger.create({
      data: {
        rideId: newRide.id,
        userId: userId,
        pickupZone: dto.pickupZone,
        destinationZone: dto.destinationZone,
        seatsRequested: dto.seatsRequested,
        baseFare: BASE_FARE,
        distanceFare: ZONE_DISTANCES[dto.destinationZone] || 30,
        poolDiscount: 0,
        totalFare: totalFare,
      },
      include: { ride: true },
    });
  }

  async getMyCurrentRide(userId: string) {
    return this.prisma.ridePassenger.findFirst({
      where: {
        userId: userId,
        isCancelled: false,
        ride: { status: { in: ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'] } },
      },
      include: {
        ride: {
          include: {
            driver: { include: { user: { select: { name: true, phone: true } }, vehicle: true } },
          },
        },
      },
    });
  }

  async cancelRide(userId: string, ridePassengerId: string) {
    const entry = await this.prisma.ridePassenger.findUnique({
      where: { id: ridePassengerId },
      include: { ride: true },
    });

    if (!entry) {
      throw new ForbiddenException('Not your booking');
    }
    
    if (entry.userId !== userId) {
      throw new ForbiddenException('Not your booking');
    }

    if (entry.ride.status === 'STARTED' || entry.ride.status === 'COMPLETED') {
      throw new ForbiddenException('Cannot cancel after ride has started');
    }

    await this.prisma.ridePassenger.update({
      where: { id: ridePassengerId },
      data: { isCancelled: true },
    });
    
    await this.prisma.ride.update({
      where: { id: entry.rideId },
      data: { occupiedSeats: { decrement: entry.seatsRequested } },
    });

    return { message: 'Ride cancelled successfully' };
  }

  async estimateFare(pickupZone: string, destinationZone: string, seatsRequested: number) {
    const soloFare = calculateFare(destinationZone, false);
    const pooledFare = calculateFare(destinationZone, true);
    
    return {
      pickupZone: pickupZone,
      destinationZone: destinationZone,
      seatsRequested: seatsRequested,
      soloFare: soloFare,
      pooledFare: pooledFare,
    };
  }

  async getAllRides() {
    return this.prisma.ride.findMany({
      include: {
        driver: { include: { user: true, vehicle: true } },
        passengers: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
