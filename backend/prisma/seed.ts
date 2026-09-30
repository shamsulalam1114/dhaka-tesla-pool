import { PrismaClient, Role, RideStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.ridePassenger.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  const jashimUser = await prisma.user.create({
    data: {
      name: 'Jashim Uddin',
      email: 'jashim@tesla.com',
      passwordHash: await bcrypt.hash('jashim123', 10),
      role: Role.DRIVER,
      phone: '01711000001',
      walletBalance: 0,
    },
  });

  const jashimDriver = await prisma.driver.create({
    data: {
      userId: jashimUser.id,
      isOnline: true,
    },
  });

  await prisma.vehicle.create({
    data: {
      driverId: jashimDriver.id,
      name: 'Bullet',
      licensePlate: 'DHAKA-TESLA-001',
      capacity: 3,
    },
  });

  const nusrat = await prisma.user.create({
    data: {
      name: 'Nusrat Jahan',
      email: 'nusrat@pool.com',
      passwordHash: await bcrypt.hash('nusrat123', 10),
      role: Role.PASSENGER,
      phone: '01711000002',
      walletBalance: 500,
    },
  });

  const rafiq = await prisma.user.create({
    data: {
      name: 'Rafiq Islam',
      email: 'rafiq@pool.com',
      passwordHash: await bcrypt.hash('rafiq123', 10),
      role: Role.PASSENGER,
      phone: '01711000003',
      walletBalance: 500,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Shirin Akter',
      email: 'shirin@pool.com',
      passwordHash: await bcrypt.hash('shirin123', 10),
      role: Role.PASSENGER,
      phone: '01711000004',
      walletBalance: 500,
    },
  });

  const pooledRide = await prisma.ride.create({
    data: {
      driverId: jashimDriver.id,
      pickupZone: 'Banani',
      status: RideStatus.COMPLETED,
      totalSeats: 3,
      occupiedSeats: 2,
    },
  });

  await prisma.ridePassenger.createMany({
    data: [
      {
        rideId: pooledRide.id,
        userId: nusrat.id,
        pickupZone: 'Banani',
        destinationZone: 'Mohakhali',
        seatsRequested: 1,
        baseFare: 50,
        distanceFare: 20,
        poolDiscount: 10,
        totalFare: 60,
      },
      {
        rideId: pooledRide.id,
        userId: rafiq.id,
        pickupZone: 'Banani',
        destinationZone: 'Gulshan 1',
        seatsRequested: 1,
        baseFare: 50,
        distanceFare: 25,
        poolDiscount: 10,
        totalFare: 65,
      },
    ],
  });

  console.log('Seed complete. Demo credentials:');
  console.log('Driver  - jashim@tesla.com  / jashim123');
  console.log('Nusrat  - nusrat@pool.com   / nusrat123');
  console.log('Rafiq   - rafiq@pool.com    / rafiq123');
  console.log('Shirin  - shirin@pool.com   / shirin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
