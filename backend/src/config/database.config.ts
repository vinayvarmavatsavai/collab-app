import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.DATABASE || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  name: process.env.DATABASE_NAME || 'test_db',
}));
