import { Controller, Get, Post, Param, Body, UseGuards, Request, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RidesService } from './rides.service';
import { RequestRideDto } from './rides.dto';

@ApiTags('rides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rides')
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Post('request')
  requestRide(@Request() req: any, @Body() dto: RequestRideDto) {
    return this.ridesService.requestRide(req.user.id, dto);
  }

  @Get('me/current')
  getMyCurrentRide(@Request() req: any) {
    return this.ridesService.getMyCurrentRide(req.user.id);
  }

  @Patch('passengers/:ridePassengerId/cancel')
  cancelRide(@Request() req: any, @Param('ridePassengerId') ridePassengerId: string) {
    return this.ridesService.cancelRide(req.user.id, ridePassengerId);
  }

  @Get('estimate')
  @ApiQuery({ name: 'pickupZone', required: true })
  @ApiQuery({ name: 'destinationZone', required: true })
  @ApiQuery({ name: 'seatsRequested', required: true, type: Number })
  estimateFare(
    @Query('pickupZone') pickupZone: string,
    @Query('destinationZone') destinationZone: string,
    @Query('seatsRequested') seatsRequested: string,
  ) {
    return this.ridesService.estimateFare(pickupZone, destinationZone, parseInt(seatsRequested, 10));
  }

  @Get('all')
  getAllRides() {
    return this.ridesService.getAllRides();
  }
}
