$env:JAVA_HOME = "C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\jdk17_extracted\jdk-17.0.11+9"
$env:PATH = "C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\jdk17_extracted\jdk-17.0.11+9\bin;" + $env:PATH

Write-Host "Signing 100% Native Standalone APK package..."
cmd /c "C:\Users\Sharoz\.bubblewrap\android_sdk\build-tools\34.0.0\apksigner.bat sign --ks android.keystore --ks-pass pass:password123 --key-pass pass:password123 --ks-key-alias key0 --out idspulse-app.apk android/app/build/outputs/apk/release/app-release-unsigned.apk"

Write-Host "Verifying signed APK..."
cmd /c "C:\Users\Sharoz\.bubblewrap\android_sdk\build-tools\34.0.0\apksigner.bat verify idspulse-app.apk"

Write-Host "Copying signed APK to public/idspulse-app.apk..."
Copy-Item 'idspulse-app.apk' 'public/idspulse-app.apk' -Force
