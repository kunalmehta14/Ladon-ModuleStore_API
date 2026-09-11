import { Hono } from 'hono';
import sql from '../../db.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
const modulePackages = new Hono();


modulePackages.get('/list_packages', 
  zValidator('query', z.object({
      page: z.string().optional().default('1').transform(Number),
      limit: z.string().optional().default('7').transform(Number),
    })),  
  async (c) => {
  try {
    const { page, limit } = c.req.valid('query');
    const offset = (page - 1) * limit;
    const modules = await sql`SELECT lm.module_name,
                                lmd.module_size,
                                lm.version, 
                                lm.created_at
                                FROM lda_ms_modules as lm
                                INNER JOIN lda_ms_details as lmd 
                                ON lm.module_id = lmd.module_id
                              ORDER BY lm.created_at DESC 
                              LIMIT ${limit}`;
    return c.json(modules);
  } catch (error) {
    return c.json({ error: 'Fetch failed' }, 500);
  }
});

modulePackages.get('/list_packages/:module_name', 
  zValidator('query', z.object({
    ver: z.string().optional(),
    about: z.string().optional()
  })),
  async (c) => {
  const module_name = c.req.param('module_name');
  try {
    const {ver, about} = c.req.valid('query');
    let module;
    if (ver == undefined && 
      (about == undefined || !about)) {
      module = await sql`SELECT lm.module_name,
                                lmd.module_size,
                                lm.version as current_version, 
                                lm.created_at
                                FROM lda_ms_modules as lm
                                INNER JOIN lda_ms_details as lmd 
                                ON lm.module_id = lmd.module_id
                            WHERE lm.module_name = ${module_name}
                            ORDER BY lm.created_at DESC
                            LIMIT 1`;
    } else if (ver != undefined && 
      (about == undefined || !about)) { 
      module = await sql`SELECT lm.module_name,
                                lmd.module_size,
                                lm.version, 
                                lm.created_at
                                FROM lda_ms_modules as lm
                                INNER JOIN lda_ms_details as lmd 
                                ON lm.module_id = lmd.module_id
                            WHERE lm.module_name = ${module_name}
                            and lm.version = ${ver}`;
    } else if (ver != undefined && about) {
      const response = await fetch(`${process.env.FILE_SERVER_ACCESS}/${module_name}/module_card.json`);
      const about_result = await response.json();
      module = await sql`SELECT lm.module_name,
                                lmd.module_size,
                                lm.version, 
                                lm.created_at
                                FROM lda_ms_modules as lm
                                INNER JOIN lda_ms_details as lmd 
                                ON lm.module_id = lmd.module_id
                            WHERE lm.module_name = ${module_name}
                            and lm.version = ${ver}`;
      module[0]["about"] = about_result
    } else if (ver == undefined && about) {
      const response = await fetch(`${process.env.FILE_SERVER_ACCESS}/${module_name}/module_card.json`);
      const about = await response.json();
      module = await sql`SELECT lm.module_name,
                                lmd.module_size,
                                lm.version as current_version, 
                                lm.created_at
                                FROM lda_ms_modules as lm
                                INNER JOIN lda_ms_details as lmd 
                                ON lm.module_id = lmd.module_id
                            WHERE lm.module_name = ${module_name}
                            ORDER BY lm.created_at DESC
                            LIMIT 1`;
      module[0]["about"] = about 
    }
    if (!module) {
      return c.json({ error: 'module not found' }, 404)
    } else {
      return c.json(module)
    }
  } catch (error) {
    console.log(error)
    return c.json({ error: 'Fetch failed' }, 500);
  }
});
///////////////////////////////////////////
// Package download mechanisim endpoints //
//////////////////////////////////////////
modulePackages.get('/package_access/checksum/:module_name', async (c) => {
  const module_name = c.req.param('module_name');
  try {
    console.log(`${process.env.FILE_SERVER_ACCESS}/${module_name}/packages/checksum`)
    const response = await fetch(`${process.env.FILE_SERVER_ACCESS}/${module_name}/packages/checksum`);
    const result = await response.text();
    if (!result) return c.json({ error: 'module not found' }, 404);
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Fetch failed' }, 500);
  }
});

modulePackages.get('/package_access/:module_name', 
  zValidator('query', z.object({
    ver: z.string().optional()
  })),
  async (c) => {
  const module_name = c.req.param('module_name');
  try {
    const ver = c.req.valid('query');
    if (ver == undefined) {
      const [module] = await sql`SELECT module_path
                            FROM lda_ms_modules
                            WHERE module_name = ${module_name}`;
      if (!module) {
        return c.json({ error: 'module not found' }, 404)
      } else {
        return c.redirect(`${process.env.FILE_SERVER_ACCESS}${module['module_path']}/packages/${ver['ver']}/module.tar.gz`)
      }
    } else {
      const [module] = await sql`SELECT module_path, version
                            FROM lda_ms_modules
                            WHERE module_name = ${module_name}
                            ORDER BY version DESC
                            LIMIT 1`;
      if (!module) {
        return c.json({ error: 'module not found' }, 404)
      } else {
        return c.redirect(`${process.env.FILE_SERVER_ACCESS}${module['module_path']}/packages/${module['version']}/module.tar.gz`)
      }
    }
  } catch (error) {
    return c.json({ error: 'Fetch failed' }, 500);
  }
});

export default modulePackages;