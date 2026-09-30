import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Nusrat Jahan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'nusrat@pool.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'nusrat123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.PASSENGER })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: '01711000002', required: false })
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'nusrat@pool.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'nusrat123' })
  @IsString()
  password: string;
}
