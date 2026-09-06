import { Hono } from 'hono';
import sql from '../db.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
const moduleStoreApp = new Hono();

moduleStoreApp.get('/id-to-name/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const [module] = await sql`SELECT module_id, module_name
                               FROM lda_ms_modules
                               WHERE module_id = ${id}`;
    if (!module) return c.json({ error: 'module not found' }, 404);
    return c.json(module);
  } catch (error) {
    return c.json({ error: 'Fetch failed' }, 500);
  }
});

moduleStoreApp.get('/', 
  // Pagination configuration
  zValidator('query', z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('5').transform(Number),
  })),
  async (c) => {
    try {
      const queryTerm = c.req.query('q');
      if (!queryTerm) {      
        const { page, limit } = c.req.valid('query');
        const offset = (page - 1) * limit;
        const results = await sql`SELECT lm.module_id, lm.module_name, 
                                    lm.created_at, lmd.module_info,
                                    lmd.module_size
                                  FROM lda_ms_modules as lm
                                  INNER JOIN lda_ms_details as lmd 
                                  ON lm.module_id = lmd.module_id
                                  ORDER BY lm.module_id ASC LIMIT ${limit} OFFSET ${offset}`;
        const totalResults =  await sql`SELECT count(lm.module_id)
                                        FROM lda_ms_modules as lm
                                        INNER JOIN lda_ms_details as lmd 
                                        ON lm.module_id = lmd.module_id`
        const totalCount = parseInt(totalResults[0].count)      
        return c.json({data: results,
                      meta: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit)
                      }});
      } else {
        try {
          const { page, limit } = c.req.valid('query');
          const offset = (page - 1) * limit;
          const formattedSearch = `%${queryTerm}%`;
          // Query using ILIKE for case-insensitive search
          const results = await sql`SELECT lm.module_id, lm.module_name, 
                              lm.created_at, lmd.module_info,
                              lmd.module_size
                              FROM lda_ms_modules as lm
                              INNER JOIN lda_ms_details as lmd 
                              ON lm.module_id = lmd.module_id 
                              WHERE lm.module_name ILIKE ${formattedSearch} 
                                OR lmd.module_info::text ILIKE ${formattedSearch}
                              ORDER BY lm.module_id ASC LIMIT ${limit} OFFSET ${offset}`;
          const queryCount = `SELECT count(lm.module_id)
                                FROM lda_ms_modules as lm
                                INNER JOIN lda_ms_details as lmd 
                                ON lm.module_id = lmd.module_id 
                                WHERE lm.module_name ILIKE ${formattedSearch}`
          const totalResults =  await sql`SELECT count(lm.module_id)
                                FROM lda_ms_modules as lm
                                INNER JOIN lda_ms_details as lmd 
                                ON lm.module_id = lmd.module_id 
                                WHERE lm.module_name ILIKE ${formattedSearch}`
          const totalCount = parseInt(totalResults[0].count);
          return c.json({data: results,
                      meta: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit)
                      }});
        } catch (error) {
          return c.json({ error: 'Database search failed' }, 500);
        }
      }
    } catch (error) {
      return c.json({ 'error': `Coulnd not complete the request due to the following error: ${error}` }, 500);
    };
});

export default moduleStoreApp;