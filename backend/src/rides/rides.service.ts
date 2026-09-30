import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestRideDto } from './rides.dto';

const ZONE_DISTANCE_PAISA: Record<string, number> = {
  Banani: 0,
  Mohakhali: 2000,
  'Gulshan 1': 2500,
  'Gulshan 2': 3000,
  Dhanmondi: 4500,
  Mirpur: 5000,
  Uttara: 6000,
  Farmgate: 3500,
  Bashundhara: 5500,
};

const BASE_FARE_PAISA = 5000;
const POOL_DISCOUNT_PAISA = 1000;

function calculateFare(destinationZone: string, isPooled: boolean): number {
  const distance = ZONE_DISTANCE_PAISA[destinationZone] ?? 3000;
  const discount = isPooled ? POOL_DISCOUNT_PAISA : 0;
  return BASE_FARE_PAISA + distance - discount;
}

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) {}

  async requestRide(userId: string, dto: RequestRideDto) {
    const alreadyOnRide = await this.prisma.ridePassenger.findFirst({
      where: {
        userId,
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
        const fareTotalPaisa = calculateFare(dto.destinationZone, true);

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
              userId,
              pickupZone: dto.pickupZone,
              destinationZone: dto.destinationZone,
              seatsRequested: dto.seatsRequested,
              fareBasePaisa: BASE_FARE_PAISA,
              fareDistancePaisa: ZONE_DISTANCE_PAISA[dto.destinationZone] ?? 3000,
              fareDiscountPaisa: POOL_DISCOUNT_PAISA,
              fareTotalPaisa,
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

    const fareTotalPaisa = calculateFare(dto.destinationZone, false);

    return this.prisma.ridePassenger.create({
      data: {
        rideId: newRide.id,
        userId,
        pickupZone: dto.pickupZone,
        destinationZone: dto.destinationZone,
        seatsRequested: dto.seatsRequested,
        fareBasePaisa: BASE_FARE_PAISA,
        fareDistancePaisa: ZONE_DISTANCE_PAISA[dto.destinationZone] ?? 3000,
        fareDiscountPaisa: 0,
        fareTotalPaisa,
      },
      include: { ride: true },
    });
  }

  async getMyCurrentRide(userId: string) {
    return this.prisma.ridePassenger.findFirst({
      where: {
        userId,
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

    if (!entry || entry.userId !== userId) {
      throw new ForbiddenException('Not your booking');
    }

    if (['STARTED', 'COMPLETED'].includes(entry.ride.status)) {
      throw new ForbiddenException('Cannot cancel after ride has started');
    }

    await this.prisma.$transaction([
      this.prisma.ridePassenger.update({
        where: { id: ridePassengerId },
        data: { isCancelled: true },
      }),
      this.prisma.ride.update({
        where: { id: entry.rideId },
        data: { occupiedSeats: { decrement: entry.seatsRequested } },
      }),
    ]);

    return { message: 'Ride cancelled successfully' };
  }

  async estimateFare(pickupZone: string, destinationZone: string, seatsRequested: number) {
    const soloFare = calculateFare(destinationZone, false);
    const pooledFare = calculateFare(destinationZone, true);
    return {
      pickupZone,
      destinationZone,
      seatsRequested,
      soloFarePaisa: soloFare,
      pooledFarePaisa: pooledFare,
      soloFareTaka: (soloFare / 100).toFixed(2),
      pooledFareTaka: (pooledFare / 100).toFixed(2),
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
