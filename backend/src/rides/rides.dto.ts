import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestRideDto {
  @ApiProperty({ example: 'Banani' })
  @IsString()
  pickupZone: string;

  @ApiProperty({ example: 'Mohakhali' })
  @IsString()
  destinationZone: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  seatsRequested: number;
}
