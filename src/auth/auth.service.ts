/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Automatically determine if the user is a professor
    const isProfesor = email.endsWith('@usm.ro');

    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, isProfesor },
    });

    return { message: 'User registered successfully!', user };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Automatically check if the email domain corresponds to a professor
    const isProfesor = email.endsWith('@usm.ro');

    const token = this.jwtService.sign({
      userId: user.id,
      isProfesor, // Include this in the token payload if necessary
    });

    return {
      message: 'Logged in successfully!',
      token,
      user: { email: user.email, isProfesor }, // Return this for client awareness
    };
  }
}
