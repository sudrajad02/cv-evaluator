import dotenv from 'dotenv';

dotenv.config();

export function getDatabaseURL(): string {
  const {
    DATABASE_HOST,
    DATABASE_USER,
    DATABASE_PASS,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_DIALECT
  } = process.env;

  // Validasi required environment variables
  if (!DATABASE_HOST || !DATABASE_USER || !DATABASE_NAME) {
    throw new Error('Missing required database environment variables');
  }

  // Construct DATABASE_URL untuk Prisma
  const databaseURL = `${DATABASE_DIALECT || 'mysql'}://${DATABASE_USER}${DATABASE_PASS ? `:${DATABASE_PASS}` : ''}@${DATABASE_HOST}${DATABASE_PORT ? `:${DATABASE_PORT}` : ''}/${DATABASE_NAME}?connection_limit=5`;

  return databaseURL;
}