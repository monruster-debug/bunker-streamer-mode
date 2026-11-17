import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['extension/studio.js'],bundle:true,format:'esm',outfile:'dist/studio.js'});
for(const f of ['manifest.json','background.js','content.js','studio.html','studio.css']) await copyFile(`extension/${f}`,`dist/${f}`);
