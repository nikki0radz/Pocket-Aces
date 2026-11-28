import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('the offline bundle includes all local imports, styles and teaching images',async()=>{
  const files=JSON.parse(await readFile(new URL('../scripts/app-assets.json',import.meta.url),'utf8'));
  const bundled=new Set(files);
  for(const name of files){
    const contents=await readFile(new URL('../'+name,import.meta.url));
    assert.ok(contents.length,name+' is empty');
    if(!/\.(?:js|css|html)$/.test(name))continue;
    const text=contents.toString();
    const links=[...text.matchAll(/(?:from\s*['"]|(?:src|href)=['"]|url\(['"]?)([^'"\s)]+)/g)];
    for(const [,link] of links){
      if(/^(?:https?:|data:|#)/.test(link)||!link.match(/\.(?:js|css|svg|png|jpg)(?:$|[?#])/))continue;
      const relative=new URL(link,new URL('https://appassets.androidplatform.net/'+name)).pathname.slice(1);
      assert.ok(bundled.has(relative),name+' needs missing '+relative);
    }
  }
});

test('native page resolution blocks foreign origins, encoded paths and unbundled files',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'pocket-native-'));
  try{
    const harness=join(dir,'BundleCheck.java');
    await writeFile(harness,`import uk.co.nicole.pocketaces.BundledContent;
import java.util.*;
public class BundleCheck {
  public static void main(String[] args) {
    Set<String> assets=new HashSet<>(Arrays.asList("index.html","app.js","assets/icon.svg"));
    String home=BundledContent.ORIGIN;
    if(!"index.html".equals(BundledContent.resolve(home+"/#watch",assets)))throw new AssertionError("start page");
    if(!"assets/icon.svg".equals(BundledContent.resolve(home+"/assets/icon.svg",assets)))throw new AssertionError("image");
    String[] denied={"https://example.com/app.js","http://appassets.androidplatform.net/app.js",home+":443/app.js",home+".evil.test/app.js","https://evil@appassets.androidplatform.net/app.js",home+"/../app.js",home+"/%61pp.js",home+"/assets/%2e%2e/app.js",home+"/missing.js",home+"/api/pip/session",home+"//app.js","file:///app.js"};
    for(String url:denied)if(BundledContent.resolve(url,assets)!=null)throw new AssertionError(url);
    if(BundledContent.isHome(null))throw new AssertionError("null");
  }
}`);
    const source=new URL('../android/src/uk/co/nicole/pocketaces/BundledContent.java',import.meta.url).pathname;
    const compile=spawnSync('java',['-m','jdk.compiler/com.sun.tools.javac.Main','-d',dir,source,harness],{encoding:'utf8'});
    assert.equal(compile.status,0,compile.stderr);
    const run=spawnSync('java',['-cp',dir,'BundleCheck'],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
  }finally{await rm(dir,{recursive:true,force:true});}
});
