import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  throw new Error(
    'PostgreSQL connection string is not set in environment variables',
  );
}

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
// Get user by ID
export const getUserById = async (userId: string) => {
  const res = await query('SELECT * FROM users WHERE id = $1', [userId]);
  return res.rows[0];
};
