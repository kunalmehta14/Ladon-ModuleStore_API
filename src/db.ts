import postgres from 'postgres';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl);

export default sql;
