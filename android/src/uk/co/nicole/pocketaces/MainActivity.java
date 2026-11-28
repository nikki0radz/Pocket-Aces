package uk.co.nicole.pocketaces;

import android.app.*;
import android.content.*;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.webkit.*;
import android.widget.*;
import android.view.*;
import android.graphics.Color;
import java.lang.ref.WeakReference;
import java.util.UUID;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Collections;
import java.util.Set;
import org.json.*;

public class MainActivity extends Activity {
  static final String HOME=BundledContent.ORIGIN;
  final Set<String> bundledAssets=new HashSet<>();
  static WeakReference<MainActivity> current=new WeakReference<>(null);
  WebView web; WebMessagePort port; String pendingSession=""; boolean trusted=false;
  ValueCallback<Uri[]> fileChooser; String pendingDesignJson=null;
  @Override public void onCreate(Bundle state){
    super.onCreate(state);current=new WeakReference<>(this);
    try(InputStream input=getAssets().open("web-files.json")){
      java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();byte[] buffer=new byte[4096];int size;
      while((size=input.read(buffer))!=-1)bytes.write(buffer,0,size);
      JSONArray files=new JSONArray(new String(bytes.toByteArray(),StandardCharsets.UTF_8));
      for(int i=0;i<files.length();i++)bundledAssets.add(files.getString(i));
    }catch(Exception e){new AlertDialog.Builder(this).setTitle("Pocket Aces needs reinstalling").setMessage("The app's learning pages are missing. Please install the latest APK.").setPositiveButton("Close",(d,w)->finish()).show();return;}
    // Own the system-bar area so Android 15 cannot place page controls under it.
    final int paper=Color.rgb(251,247,239);
    getWindow().setStatusBarColor(paper);getWindow().setNavigationBarColor(paper);
    if(Build.VERSION.SDK_INT>=29)getWindow().setNavigationBarContrastEnforced(false);
    if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
    else getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
    FrameLayout root=new FrameLayout(this);root.setBackgroundColor(paper);
    root.setOnApplyWindowInsetsListener((view,insets)->{
      if(Build.VERSION.SDK_INT>=30){
        android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
        int keyboard=insets.getInsets(WindowInsets.Type.ime()).bottom;
        view.setPadding(bars.left,bars.top,bars.right,Math.max(bars.bottom,keyboard));
        return WindowInsets.CONSUMED;
      }
      view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
      return insets.consumeSystemWindowInsets();
    });
    web=new WebView(this);web.setBackgroundColor(paper);root.addView(web,new FrameLayout.LayoutParams(-1,-1));setContentView(root);root.requestApplyInsets();
    if(Build.VERSION.SDK_INT>=30){
      WindowInsetsController bars=getWindow().getInsetsController();
      if(bars!=null)bars.setSystemBarsAppearance(WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
    }
    WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
    settings.setMediaPlaybackRequiresUserGesture(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);
    CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,true);
    web.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams options){
        if(!trusted||!isHome(view.getUrl()))return false;
        if(fileChooser!=null)fileChooser.onReceiveValue(null);fileChooser=callback;
        try{startActivityForResult(options.createIntent(),43);}catch(Exception e){fileChooser.onReceiveValue(null);fileChooser=null;}
        return true;
      }
    });
    web.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest req){
        if(!"appassets.androidplatform.net".equals(req.getUrl().getHost()))return null;
        return bundledResponse(req.getUrl().toString(),req.getMethod());
      }
      @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){
        trusted=isHome(url);if(port!=null){port.close();port=null;}
        if(!trusted&&CaptureService.running!=null)stopService(new Intent(MainActivity.this,CaptureService.class));
      }
      @Override public void onPageFinished(WebView view,String url){if(isHome(url))connectBridge();}
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){
        if(!req.isForMainFrame())return false;
        Uri uri=req.getUrl();
        if(isHome(uri.toString()))return false;
        // Account sign-in and external sites belong in the user's normal browser.
        if("https".equals(uri.getScheme())||"http".equals(uri.getScheme()))
          try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
        return true;
      }
      @Override public void onReceivedSslError(WebView view,android.webkit.SslErrorHandler handler,android.net.http.SslError error){handler.cancel();Toast.makeText(MainActivity.this,"The secure connection failed. Please try again later.",Toast.LENGTH_LONG).show();}
    });
    web.setDownloadListener((url,ua,disposition,mime,length)->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception ignored){}});
    web.loadUrl(HOME+"/#home");
  }
  boolean isHome(String url){return BundledContent.isHome(url);}
  WebResourceResponse bundledResponse(String url,String method){
    if(!isHome(url))return localResponse("text/plain",403,"Forbidden","This address is unavailable.");
    if(!"GET".equals(method))return localResponse("application/json",503,"Unavailable","{\"error\":\"Live Pip is not connected in the offline app yet.\"}");
    if("/api/pip/status".equals(Uri.parse(url).getPath()))
      return localResponse("application/json",200,"OK","{\"connected\":false,\"offlineApp\":true}");
    String file=BundledContent.resolve(url,bundledAssets);
    if(file==null)return localResponse("text/plain",404,"Not Found","This page isn't included in Pocket Aces.");
    String mime=file.endsWith(".html")?"text/html":file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".json")||file.endsWith(".webmanifest")?"application/json":file.endsWith(".svg")?"image/svg+xml":file.endsWith(".png")?"image/png":file.endsWith(".jpg")?"image/jpeg":"application/octet-stream";
    try{return new WebResourceResponse(mime,"UTF-8",200,"OK",Collections.singletonMap("X-Content-Type-Options","nosniff"),getAssets().open("web/"+file));}
    catch(Exception e){return localResponse("text/plain",404,"Not Found","This page is missing. Please update Pocket Aces.");}
  }
  WebResourceResponse localResponse(String mime,int status,String reason,String body){
    return new WebResourceResponse(mime,"UTF-8",status,reason,Collections.singletonMap("Cache-Control","no-store"),new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
  }
  void connectBridge(){
    if(!trusted||!isHome(web.getUrl()))return;
    WebMessagePort[] ports=web.createWebMessageChannel();port=ports[0];
    port.setWebMessageCallback(new WebMessagePort.WebMessageCallback(){@Override public void onMessage(WebMessagePort from,WebMessage message){
      if(!trusted||!isHome(web.getUrl()))return;
      try{
        JSONObject data=new JSONObject(message.getData());String action=data.optString("action");
        if(action.equals("start")){pendingSession=data.optString("session");if(!pendingSession.matches("[0-9]{1,12}"))return;beginCapture();}
        if(action.equals("stop"))stopService(new Intent(MainActivity.this,CaptureService.class));
        if(action.equals("explain")&&CaptureService.running!=null)CaptureService.running.explain(data.optString("text"),data.optBoolean("voice"));
        if(action.equals("pause")&&CaptureService.running!=null)CaptureService.running.pause(data.optBoolean("paused"));
        if(action.equals("exportDesignNotes"))saveDesignNotes(data.optString("json"),data.optString("filename"));
      }catch(Exception ignored){}
    }});
    String channel="pocket-pip-"+UUID.randomUUID();
    String js="(function(){function receive(e){if(e.data!=="+JSONObject.quote(channel)+"||!e.ports.length)return;window.removeEventListener('message',receive);var p=e.ports[0];p.onmessage=function(m){try{var d=JSON.parse(m.data);if(window.pipNativeEvent)window.pipNativeEvent(d);window.dispatchEvent(new CustomEvent('pocket-aces-native',{detail:d}));}catch(e){}};function send(a){p.postMessage(JSON.stringify(a));}window.PocketAcesAndroid={startCapture:function(s){send({action:'start',session:s});},stopCapture:function(){send({action:'stop'});},showExplanation:function(t,v){send({action:'explain',text:t,voice:v});},setPaused:function(v){send({action:'pause',paused:v});},exportDesignNotes:function(j,f){send({action:'exportDesignNotes',json:j,filename:f});}};window.dispatchEvent(new Event('pip-native-ready'));}window.addEventListener('message',receive);})();";
    web.evaluateJavascript(js,unused->web.postWebMessage(new WebMessage(channel,new WebMessagePort[]{ports[1]}),Uri.parse(HOME)));
  }
  void saveDesignNotes(String json,String filename){
    if(pendingDesignJson!=null){designExportResult(false,false);return;}
    try{
      if(json.length()>1500000)throw new Exception();
      JSONObject parsed=new JSONObject(json);
      if(!"Pocket Aces".equals(parsed.optString("app"))||parsed.optJSONArray("notes")==null)throw new Exception();
      if(!filename.matches("pocket-aces-design-notes-[A-Za-z0-9_-]+\\.json"))throw new Exception();
      pendingDesignJson=json;
      Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE,filename);
      startActivityForResult(save,44);
    }catch(Exception e){pendingDesignJson=null;designExportResult(false,false);}
  }
  void designExportResult(boolean saved,boolean cancelled){
    try{JSONObject message=new JSONObject();message.put("type","design-export");message.put("saved",saved);message.put("cancelled",cancelled);send(message);}catch(Exception ignored){}
  }
  void beginCapture(){
    if(!Settings.canDrawOverlays(this)){
      new AlertDialog.Builder(this).setTitle("Let Pip sit beside your game?").setMessage("Allow Pocket Aces to appear over other apps so Pip can show explanations while you watch YouTube. You can drag him out of the way, pause him, or stop sharing at any time.")
      .setPositiveButton("Open settings",(d,w)->startActivityForResult(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,Uri.parse("package:"+getPackageName())),41))
      .setNegativeButton("Cancel",(d,w)->sendError("Pip needs permission to appear beside YouTube. Nothing is being shared.")).show();return;
    }
    MediaProjectionManager manager=(MediaProjectionManager)getSystemService(MEDIA_PROJECTION_SERVICE);
    startActivityForResult(manager.createScreenCaptureIntent(),42);
  }
  @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);
    if(request==43){if(fileChooser!=null){fileChooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileChooser=null;}return;}
    if(request==44){
      String json=pendingDesignJson;pendingDesignJson=null;
      if(result!=RESULT_OK||data==null||data.getData()==null){designExportResult(false,true);return;}
      try(OutputStream output=getContentResolver().openOutputStream(data.getData(),"wt")){
        if(json==null||output==null)throw new Exception();output.write(json.getBytes(StandardCharsets.UTF_8));designExportResult(true,false);
      }catch(Exception e){designExportResult(false,false);}return;
    }
    if(request==41){if(Settings.canDrawOverlays(this))beginCapture();else sendError("Permission to show Pip wasn’t allowed. Nothing is being shared.");}
    if(request==42){if(result!=RESULT_OK||data==null){sendError("Screen sharing wasn’t allowed. Nothing is being shared.");return;}
      Intent service=new Intent(this,CaptureService.class).putExtra("result",result).putExtra("data",data).putExtra("session",pendingSession);startForegroundService(service);
    }
  }
  void sendError(String text){try{JSONObject o=new JSONObject();o.put("type","error");o.put("message",text);o.put("session",pendingSession);send(o);}catch(Exception ignored){}}
  void send(JSONObject data){runOnUiThread(()->{if(port!=null&&trusted&&isHome(web.getUrl()))try{port.postMessage(new WebMessage(data.toString()));}catch(Exception ignored){}});}
  static void deliver(JSONObject data){MainActivity activity=current.get();if(activity!=null)activity.send(data);}
  @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
  @Override protected void onDestroy(){stopService(new Intent(this,CaptureService.class));if(fileChooser!=null)fileChooser.onReceiveValue(null);pendingDesignJson=null;if(port!=null)port.close();if(web!=null)web.destroy();if(current.get()==this)current.clear();super.onDestroy();}
}
