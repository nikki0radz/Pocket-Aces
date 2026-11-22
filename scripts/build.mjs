import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
const files=['index.html','app.js','styles.css','data.js','engine.js','collection.js','spectator.js','spectator.css','watch.js','watch.css','watch-core.js','sw.js','manifest.webmanifest','assets/icon.svg','assets/pip-cat-expressions.png'];
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png',apk:'application/vnd.android.package-archive'};
const assets={};
try {await readFile('downloads/Pocket-Aces-0.3.0.apk');files.push('downloads/Pocket-Aces-0.3.0.apk');}catch{}
for(const file of files){const data=await readFile(file);assets['/'+file]={data:data.toString('base64'),type:types[file.split('.').at(-1)]||'application/octet-stream'};}
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const core=(await readFile('watch-core.js','utf8')).replace(/^export /gm,'');
const server=(await readFile('worker/index.js','utf8')).replace(/^import .*?;\n/,'').replace('export async function api','async function api');
await writeFile('dist/server/index.js',core+'\n'+server+'\nconst ASSETS='+JSON.stringify(assets)+';\n');
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
console.log('Built Pocket Aces with '+files.length+' assets and private Pip API routes.');
