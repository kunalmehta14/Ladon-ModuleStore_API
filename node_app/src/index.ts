import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { cors } from 'hono/cors'
import postgres from 'postgres';
import sql from './db.js'
import moduleStoreApp from './routes/v1/modules.js'; 
import modulePackages_v1 from './routes/v1/packages.js';

const app = new Hono();
app.use('*', cors())
app.route('/v1/modules', moduleStoreApp);
app.route('/v1/packages', modulePackages_v1);
serve({ 
  fetch: app.fetch,
  port: 3500
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
