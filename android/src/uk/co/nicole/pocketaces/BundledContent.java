package uk.co.nicole.pocketaces;

import java.net.URI;
import java.util.Set;

/** Exact-origin, allowlisted paths only. No filesystem paths or remote fallback. */
public final class BundledContent {
  public static final String ORIGIN="https://appassets.androidplatform.net";
  public static boolean isHome(String url){
    try{
      URI uri=new URI(url);
      return "https".equals(uri.getScheme())&&"appassets.androidplatform.net".equals(uri.getRawAuthority());
    }catch(Exception e){return false;}
  }
  public static String resolve(String url,Set<String> assets){
    if(!isHome(url))return null;
    try{
      String path=new URI(url).getRawPath();
      if(path==null||path.isEmpty()||path.equals("/"))path="/index.html";
      String file=path.substring(1);
      return assets.contains(file)?file:null;
    }catch(Exception e){return null;}
  }
}
