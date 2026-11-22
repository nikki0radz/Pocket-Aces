import http from 'node:http';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
const {default:worker}=await import('../dist/server/index.js');
const args=process.argv.slice(2);const portArg=args.indexOf('--port');
const port=Number(process.env.PORT||(portArg>=0?args[portArg+1]:3000));
http.createServer(async(req,res)=>{
  try{
    const chunks=[];for await(const c of req)chunks.push(c);
    const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-preview');
    const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const result=await worker.fetch(request,{});
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Preview error');}
}).listen(port,'0.0.0.0',()=>console.log('Pocket Aces listening on '+port));
