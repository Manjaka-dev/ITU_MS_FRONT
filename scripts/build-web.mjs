import {cp,mkdir,rm,readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const config=JSON.parse(await readFile(path.join(root,'vercel.json'),'utf8'));
if(process.env.VERCEL&&!config.rewrites.some(rule=>rule.source==='/api/:path*'&&rule.destination.startsWith('https://'))){
  throw new Error('Configurer l’URL Render avec ITUMS_API_ORIGIN et npm run configure:vercel avant le déploiement Vercel.');
}
await rm(path.join(root,'dist'),{recursive:true,force:true});
await mkdir(path.join(root,'dist'),{recursive:true});
await cp(path.join(root,'apps/web'),path.join(root,'dist'),{recursive:true});
const forbidden=['.env','ACCES-ADMIN.txt','secret.key','itums.sqlite3'];
async function inspect(directory){for(const item of await readdir(directory,{withFileTypes:true})){if(forbidden.includes(item.name))throw new Error('Un fichier privé est présent dans le build.');if(item.isDirectory())await inspect(path.join(directory,item.name));}}
await inspect(path.join(root,'dist'));
console.log('Front compilé dans dist/ ; aucun fichier privé inclus.');
