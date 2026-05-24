import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6, example: 'secret123' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Email or "admin" shortcut' })
  @IsString()
  @MinLength(1)
  email!: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  password!: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;
}
