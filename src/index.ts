import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { cors } from 'hono/cors'
import postgres from 'postgres';
import sql from './db.js'
import moduleStoreApp from './routes/modules.js'; 
import modulePackages from './routes/packages.js';

const app = new Hono();
app.use('*', cors())
app.route('/modules', moduleStoreApp);
app.route('/packages', modulePackages);
serve({
  fetch: app.fetch,
  port: 3500
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
