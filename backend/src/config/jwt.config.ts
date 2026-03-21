import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret_dev',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_dev',
  refreshExpiresInDays: parseInt(
    process.env.JWT_REFRESH_EXPIRES_DAYS || '30',
    10,
  ),
}));
