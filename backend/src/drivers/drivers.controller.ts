import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DriversService } from './drivers.service';
import { IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SetOnlineDto {
  @ApiProperty() @IsBoolean() isOnline: boolean;
}
class UpdateRideStatusDto {
  @ApiProperty({ enum: ['DRIVER_ARRIVED', 'STARTED', 'COMPLETED'] })
  @IsIn(['DRIVER_ARRIVED', 'STARTED', 'COMPLETED'])
  status: 'DRIVER_ARRIVED' | 'STARTED' | 'COMPLETED';
}

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get('me')
  getProfile(@Request() req: any) {
    return this.driversService.getMyProfile(req.user.id);
  }

  @Patch('me/status')
  setOnline(@Request() req: any, @Body() dto: SetOnlineDto) {
    return this.driversService.setOnlineStatus(req.user.id, dto.isOnline);
  }

  @Get('rides/pending')
  getPendingRides(@Request() req: any) {
    return this.driversService.getPendingRides(req.user.id);
  }

  @Patch('rides/:rideId/accept')
  acceptRide(@Request() req: any, @Param('rideId') rideId: string) {
    return this.driversService.acceptRide(req.user.id, rideId);
  }

  @Patch('rides/:rideId/status')
  updateStatus(@Request() req: any, @Param('rideId') rideId: string, @Body() dto: UpdateRideStatusDto) {
    return this.driversService.updateRideStatus(req.user.id, rideId, dto.status);
  }

  @Get('rides/history')
  getRideHistory(@Request() req: any) {
    return this.driversService.getMyRideHistory(req.user.id);
  }
}
