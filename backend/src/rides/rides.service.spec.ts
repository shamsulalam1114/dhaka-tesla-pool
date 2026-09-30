import { Test, TestingModule } from '@nestjs/testing';
import { RidesService } from './rides.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('RidesService & Pooling Logic', () => {
  let service: RidesService;

  const mockPrisma = {
    ridePassenger: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ride: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vehicle: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
    jest.clearAllMocks();
  });

  describe('Fare Calculation (Nusrat & Rafiq)', () => {
    it('should correctly calculate solo vs pooled fares', async () => {
      const nusratEstimate = await service.estimateFare('Banani', 'Mohakhali', 1);
      const rafiqEstimate = await service.estimateFare('Banani', 'Gulshan 1', 1);

      // Base: 50, Mohakhali: 20, Pool Discount: 10
      expect(nusratEstimate.soloFare).toBe(70);
      expect(nusratEstimate.pooledFare).toBe(60);

      // Base: 50, Gulshan 1: 25, Pool Discount: 10
      expect(rafiqEstimate.soloFare).toBe(75);
      expect(rafiqEstimate.pooledFare).toBe(65);
    });
  });

  describe('Capacity Constraints (The Shirin Problem)', () => {
    it('should reject a ride request if capacity changes during transaction (concurrency)', async () => {
      mockPrisma.ridePassenger.findFirst.mockResolvedValue(null);
      // initially sees 2 seats available
      mockPrisma.ride.findFirst.mockResolvedValue({ id: 'ride1', driverId: 'jashim1', occupiedSeats: 1 });
      mockPrisma.vehicle.findFirst.mockResolvedValue({ capacity: 3 });
      
      // inside transaction, someone else took the seat, so only 1 seat available now
      mockPrisma.ride.findUnique.mockResolvedValue({ id: 'ride1', occupiedSeats: 2 });

      await expect(
        service.requestRide('shirin1', { pickupZone: 'Banani', destinationZone: 'Mirpur', seatsRequested: 2 })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('State Transitions & Cancellations', () => {
    it('should not allow cancellation if ride is STARTED', async () => {
      mockPrisma.ridePassenger.findUnique.mockResolvedValue({
        id: 'rp1',
        userId: 'nusrat1',
        rideId: 'ride1',
        ride: { status: 'STARTED' }
      });

      await expect(
        service.cancelRide('nusrat1', 'rp1')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
