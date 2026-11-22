#!/usr/bin/env python3
"""Build the Pocket Aces Android prototype with official Android SDK tools.

This is a test APK. Signing material stays outside source and must be retained
privately for updates. Set PA_SIGNING_DIR to the same directory on later builds.
"""
import os, json, secrets, shutil, subprocess, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SDK=Path(os.environ.get('ANDROID_HOME',str(ROOT.parent/'android-tools')))
JAR=Path(os.environ.get('ANDROID_JAR',str(SDK/'platform/android-35/android.jar')))
TOOLS=Path(os.environ.get('ANDROID_BUILD_TOOLS',str(SDK/'build-tools/android-15')))
if not JAR.exists() or not (TOOLS/'aapt2').exists():
    raise SystemExit('Set ANDROID_JAR and ANDROID_BUILD_TOOLS to Android SDK 35.')
BUILD=ROOT/'android/build'
if BUILD.exists():shutil.rmtree(BUILD)
for folder in ['assets','generated','classes','dex']:(BUILD/folder).mkdir(parents=True)
shutil.copy2(ROOT/'assets/pip-cat-expressions.png',BUILD/'assets/pip.png')
def run(*args):subprocess.run([str(a) for a in args],cwd=ROOT,check=True)
run(TOOLS/'aapt2','compile','--dir',ROOT/'android/res','-o',BUILD/'resources.zip')
run(TOOLS/'aapt2','link','-o',BUILD/'base.apk','-I',JAR,'--manifest',ROOT/'android/AndroidManifest.xml','-A',BUILD/'assets','--java',BUILD/'generated','--min-sdk-version','26','--target-sdk-version','35','--version-code','1','--version-name','0.3.0',BUILD/'resources.zip')
sources=sorted((ROOT/'android/src').rglob('*.java'))+sorted((BUILD/'generated').rglob('*.java'))
run('java','-m','jdk.compiler/com.sun.tools.javac.Main','-source','8','-target','8','-classpath',JAR,'-encoding','UTF-8','-d',BUILD/'classes',*sources)
run(TOOLS/'d8','--lib',JAR,'--min-api','26','--output',BUILD/'dex',*sorted((BUILD/'classes').rglob('*.class')))
with zipfile.ZipFile(BUILD/'base.apk','a',compression=zipfile.ZIP_DEFLATED) as archive:
    for dex in sorted((BUILD/'dex').glob('*.dex')):archive.write(dex,dex.name)
run(TOOLS/'zipalign','-p','-f','4',BUILD/'base.apk',BUILD/'aligned.apk')
SIGNING=Path(os.environ.get('PA_SIGNING_DIR',str(ROOT/'signing')));SIGNING.mkdir(mode=0o700,parents=True,exist_ok=True)
password=SIGNING/'password.txt';key=SIGNING/'pocket-aces.jks'
if not key.exists():
    password.write_text(secrets.token_urlsafe(32));password.chmod(0o600)
    run('keytool','-genkeypair','-keystore',key,'-storetype','PKCS12','-alias','pocket-aces','-storepass:file',password,'-keypass:file',password,'-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Pocket Aces, OU=Nicole, O=Personal App, C=GB')
    key.chmod(0o600)
if not password.exists():raise SystemExit('Restore the private signing password before building an update.')
downloads=ROOT/'downloads';downloads.mkdir(exist_ok=True);apk=downloads/'Pocket-Aces-0.3.0.apk'
run(TOOLS/'apksigner','sign','--ks',key,'--ks-key-alias','pocket-aces','--ks-pass','file:'+str(password),'--out',apk,BUILD/'aligned.apk')
run(TOOLS/'apksigner','verify','--verbose',apk)
print(json.dumps({'apk':str(apk),'bytes':apk.stat().st_size,'version':'0.3.0'}))
