import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Ip,
  Headers,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { RefreshAuthGuard } from '../guards/refresh-auth.guard';
import express from 'express';
import { IsString } from 'class-validator';
import { SignupUserDto } from './dto/signup-user.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

export class LogoutDto {
  @IsString()
  sessionId: string;
}

interface RefreshTokenRequest extends Request {
  user: {
    sub: string;
    sessionId: string;
    refreshToken: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup/user')
  async signupUser(@Body() dto: SignupUserDto) {
    return this.authService.signupUser(dto);
  }


  @Post('signin')
  async signin(
    @Body() signinDto: SigninDto,
    @Res({ passthrough: true }) res: express.Response,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const {
      accessToken,
      refreshToken,
      identity,
      sessionId,
    } = await this.authService.signin(
      signinDto.email,
      signinDto.password,
      ip,
      userAgent,
    );

    res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

    return {
      accessToken,
      identity,
      sessionId,
    };
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refresh(
    @Req() req: RefreshTokenRequest,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.refresh(req.user.refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      identity: result.identity,
      sessionId: result.sessionId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Req() req: any) {
    return this.authService.getUserSessions(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  async revokeSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    await this.authService.revokeSession(sessionId, req.user.sub);
    return { message: 'Session revoked successfully' };
  }

  @Post('logout')
  async logout(
    @Body() logoutDto: LogoutDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.logout(logoutDto.sessionId);

    res.clearCookie('refreshToken', {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
});

    return { message: 'Logged out successfully' };
  }
}
