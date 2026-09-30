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
    it('should correctly calculate solo vs pooled fares in paisa', async () => {
      const nusratEstimate = await service.estimateFare('Banani', 'Mohakhali', 1);
      const rafiqEstimate = await service.estimateFare('Banani', 'Gulshan 1', 1);

      // Base: 5000, Mohakhali: 2000, Pool Discount: 1000
      expect(nusratEstimate.soloFarePaisa).toBe(7000);
      expect(nusratEstimate.pooledFarePaisa).toBe(6000);

      // Base: 5000, Gulshan 1: 2500, Pool Discount: 1000
      expect(rafiqEstimate.soloFarePaisa).toBe(7500);
      expect(rafiqEstimate.pooledFarePaisa).toBe(6500);
    });
  });

  describe('Capacity Constraints (The Shirin Problem)', () => {
    it('should reject a ride request if Bullet capacity is exceeded', async () => {
      mockPrisma.ridePassenger.findFirst.mockResolvedValue(null);
      mockPrisma.ride.findFirst.mockResolvedValue({ id: 'ride1', driverId: 'jashim1', occupiedSeats: 2 });
      mockPrisma.vehicle.findFirst.mockResolvedValue({ capacity: 3 });
      
      // Attempting to book 2 seats when only 1 is available
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
