import { spawnSync } from 'node:child_process';
import { psqlDatabaseUrl } from './db.mjs';

const result=spawnSync('psql',[psqlDatabaseUrl(),...process.argv.slice(2)],{stdio:'inherit'});
if(result.error)console.error(result.error.message);
process.exit(result.status??1);
