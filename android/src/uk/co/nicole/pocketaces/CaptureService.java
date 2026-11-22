package uk.co.nicole.pocketaces;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.hardware.display.*;
import android.media.*;
import android.media.projection.*;
import android.os.*;
import android.speech.tts.TextToSpeech;
import android.util.*;
import android.view.*;
import android.widget.*;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.Locale;
import org.json.*;

public class CaptureService extends Service {
  static CaptureService running;
  MediaProjection projection;VirtualDisplay display;ImageReader reader;Handler handler=new Handler(Looper.getMainLooper());
  WindowManager wm;WindowManager.LayoutParams params;LinearLayout bubble;TextView explanation;Button pauseButton;
  String session="";boolean paused=false,closing=false;long lastFrame=0,lastAccepted=0;int[] previousSample;TextToSpeech tts;boolean ttsReady=false;
  @Override public IBinder onBind(Intent intent){return null;}
  int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
  @Override public int onStartCommand(Intent intent,int flags,int id){
    if(intent==null){stopSelf();return START_NOT_STICKY;}
    if("STOP".equals(intent.getAction())){stopSelf();return START_NOT_STICKY;}
    if(projection!=null){stopSelf();return START_NOT_STICKY;}
    session=intent.getStringExtra("session");running=this;
    NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
    nm.createNotificationChannel(new NotificationChannel("pip-watch","Pip screen sharing",NotificationManager.IMPORTANCE_LOW));
    PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    PendingIntent stop=PendingIntent.getService(this,1,new Intent(this,CaptureService.class).setAction("STOP"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification notification=new Notification.Builder(this,"pip-watch").setSmallIcon(uk.co.nicole.pocketaces.R.drawable.pip_icon).setContentTitle("Pip is watching your shared game").setContentText("Tap to return. Stop ends screen sharing.").setOngoing(true).setContentIntent(open).addAction(new Notification.Action.Builder(null,"Stop sharing",stop).build()).build();
    if(Build.VERSION.SDK_INT>=29)startForeground(7,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);else startForeground(7,notification);
    try{
      MediaProjectionManager manager=(MediaProjectionManager)getSystemService(MEDIA_PROJECTION_SERVICE);
      projection=manager.getMediaProjection(intent.getIntExtra("result",Activity.RESULT_OK),(Intent)intent.getParcelableExtra("data"));
      projection.registerCallback(new MediaProjection.Callback(){
        @Override public void onStop(){if(!closing)stopSelf();}
        @Override public void onCapturedContentResize(int w,int h){if(display!=null&&w>0&&h>0)resize(w,h);}
      },handler);
      wm=(WindowManager)getSystemService(WINDOW_SERVICE);DisplayMetrics metrics=new DisplayMetrics();wm.getDefaultDisplay().getRealMetrics(metrics);
      reader=makeReader(metrics.widthPixels,metrics.heightPixels);
      display=projection.createVirtualDisplay("Pip shared game",metrics.widthPixels,metrics.heightPixels,metrics.densityDpi,DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,reader.getSurface(),null,handler);
      createBubble();
      tts=new TextToSpeech(this,status->{ttsReady=status==TextToSpeech.SUCCESS;if(ttsReady){tts.setLanguage(Locale.UK);tts.setSpeechRate(.94f);}});
      send("started",null,null);handler.postDelayed(()->{send("error","message","Your 30-minute watch session has ended. Start another whenever you’re ready.");stopSelf();},30*60*1000);
    }catch(Exception e){send("error","message","Screen sharing could not start. Open Pocket Aces and try again.");stopSelf();}
    return START_NOT_STICKY;
  }
  ImageReader makeReader(int width,int height){
    ImageReader next=ImageReader.newInstance(width,height,PixelFormat.RGBA_8888,2);
    next.setOnImageAvailableListener(source->{
      Image image=null;Bitmap padded=null,crop=null,scaled=null;
      try{
        image=source.acquireLatestImage();if(image==null||paused||closing||System.currentTimeMillis()-lastFrame<1000)return;
        lastFrame=System.currentTimeMillis();Image.Plane plane=image.getPlanes()[0];ByteBuffer buffer=plane.getBuffer();int pixel=plane.getPixelStride(),row=plane.getRowStride(),padding=row-pixel*image.getWidth();
        padded=Bitmap.createBitmap(image.getWidth()+padding/pixel,image.getHeight(),Bitmap.Config.ARGB_8888);padded.copyPixelsFromBuffer(buffer);
        crop=Bitmap.createBitmap(padded,0,0,image.getWidth(),image.getHeight());
        int[] sample=new int[48*27];long brightness=0,delta=0;
        for(int y=0;y<27;y++)for(int x=0;x<48;x++){int i=y*48+x;int c=crop.getPixel(x*crop.getWidth()/48,y*crop.getHeight()/27);sample[i]=c;brightness+=Color.red(c)+Color.green(c)+Color.blue(c);if(previousSample!=null){int p=previousSample[i];delta+=Math.abs(Color.red(c)-Color.red(p))+Math.abs(Color.green(c)-Color.green(p))+Math.abs(Color.blue(c)-Color.blue(p));}}
        if(brightness/(48*27*3)<2){send("black",null,null);return;}
        boolean changed=previousSample==null||delta/(48.0*27*3)>1.1;previousSample=sample;
        if(!changed&&System.currentTimeMillis()-lastAccepted<10000)return;lastAccepted=System.currentTimeMillis();
        int target=Math.min(1440,crop.getWidth());scaled=Bitmap.createScaledBitmap(crop,target,Math.max(1,crop.getHeight()*target/crop.getWidth()),true);
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();scaled.compress(Bitmap.CompressFormat.JPEG,68,bytes);
        JSONObject event=new JSONObject();event.put("type","frame");event.put("session",session);event.put("at",System.currentTimeMillis());event.put("image","data:image/jpeg;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP));MainActivity.deliver(event);
      }catch(Exception e){send("error","message","Pip lost the shared picture. Open Pocket Aces and share again.");stopSelf();}
      finally{if(image!=null)image.close();if(scaled!=null&&scaled!=crop)scaled.recycle();if(crop!=null&&crop!=padded)crop.recycle();if(padded!=null)padded.recycle();}
    },handler);return next;
  }
  void resize(int width,int height){
    try{ImageReader old=reader;reader=makeReader(width,height);display.resize(width,height,getResources().getDisplayMetrics().densityDpi);display.setSurface(reader.getSurface());if(old!=null)old.close();}catch(Exception ignored){}
  }
  GradientDrawable background(int color){GradientDrawable bg=new GradientDrawable();bg.setColor(color);bg.setCornerRadius(dp(18));return bg;}
  void createBubble(){
    bubble=new LinearLayout(this);bubble.setOrientation(LinearLayout.VERTICAL);bubble.setPadding(dp(12),dp(10),dp(12),dp(10));bubble.setBackground(background(Color.rgb(40,75,66)));bubble.setElevation(dp(8));
    LinearLayout header=new LinearLayout(this);header.setGravity(Gravity.CENTER_VERTICAL);header.setPadding(0,0,0,dp(5));
    ImageView pip=new ImageView(this);
    try{Bitmap sheet=BitmapFactory.decodeStream(getAssets().open("pip.png"));pip.setImageBitmap(Bitmap.createBitmap(sheet,0,0,sheet.getWidth()/2,sheet.getHeight()/2));}catch(Exception ignored){}
    pip.setContentDescription("Pip");header.addView(pip,new LinearLayout.LayoutParams(dp(58),dp(58)));
    TextView title=new TextView(this);title.setText("Pip is watching\nDrag me out of the way");title.setTextColor(Color.rgb(247,229,184));title.setTextSize(14);header.addView(title,new LinearLayout.LayoutParams(0,-2,1));bubble.addView(header);
    explanation=new TextView(this);explanation.setText("Open your tournament in YouTube. I’ll explain what I can see.");explanation.setTextSize(16);explanation.setTextColor(Color.WHITE);explanation.setLineSpacing(dp(3),1);explanation.setMaxLines(12);bubble.addView(explanation);
    LinearLayout buttons=new LinearLayout(this);
    pauseButton=new Button(this);pauseButton.setText("Pause");pauseButton.setOnClickListener(v->{paused=!paused;pauseButton.setText(paused?"Resume":"Pause");if(tts!=null)tts.stop();send("pause",null,null);});buttons.addView(pauseButton,new LinearLayout.LayoutParams(0,dp(46),1));
    Button open=new Button(this);open.setText("Open");open.setOnClickListener(v->startActivity(new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)));buttons.addView(open,new LinearLayout.LayoutParams(0,dp(46),1));
    Button stop=new Button(this);stop.setText("Stop");stop.setOnClickListener(v->stopSelf());buttons.addView(stop,new LinearLayout.LayoutParams(0,dp(46),1));bubble.addView(buttons);
    params=new WindowManager.LayoutParams(dp(300),WindowManager.LayoutParams.WRAP_CONTENT,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT);params.gravity=Gravity.TOP|Gravity.START;params.x=dp(12);params.y=dp(80);
    header.setOnTouchListener(new View.OnTouchListener(){float x,y;int ox,oy;public boolean onTouch(View v,MotionEvent e){if(e.getAction()==MotionEvent.ACTION_DOWN){x=e.getRawX();y=e.getRawY();ox=params.x;oy=params.y;return true;}if(e.getAction()==MotionEvent.ACTION_MOVE){params.x=Math.max(0,ox+(int)(e.getRawX()-x));params.y=Math.max(0,oy+(int)(e.getRawY()-y));wm.updateViewLayout(bubble,params);return true;}return true;}});
    wm.addView(bubble,params);
  }
  void explain(String text,boolean voice){handler.post(()->{if(explanation!=null)explanation.setText(text.length()>1200?text.substring(0,1200):text);if(voice&&ttsReady)tts.speak(text,TextToSpeech.QUEUE_FLUSH,null,"pip");});}
  void pause(boolean value){paused=value;handler.post(()->{if(pauseButton!=null)pauseButton.setText(value?"Resume":"Pause");if(value&&tts!=null)tts.stop();});}
  void send(String type,String name,String value){try{JSONObject event=new JSONObject();event.put("type",type);event.put("session",session);if(name!=null)event.put(name,value);if(type.equals("started"))event.put("audio",false);MainActivity.deliver(event);}catch(Exception ignored){}}
  @Override public void onDestroy(){closing=true;handler.removeCallbacksAndMessages(null);if(display!=null)display.release();if(reader!=null)reader.close();if(projection!=null)projection.stop();if(bubble!=null)try{wm.removeView(bubble);}catch(Exception ignored){}if(tts!=null){tts.stop();tts.shutdown();}running=null;send("stopped",null,null);stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy();}
}
