$env:JAVA_HOME = "C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\jdk17_extracted\jdk-17.0.11+9"
$env:PATH = "C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\jdk17_extracted\jdk-17.0.11+9\bin;C:\Users\Sharoz\.bubblewrap\android_sdk\cmdline-tools\latest\bin;" + $env:PATH
$env:ANDROID_HOME = "C:\Users\Sharoz\.bubblewrap\android_sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\Sharoz\.bubblewrap\android_sdk"

Write-Host "Installing all required Android SDK platforms and build tools..."
1..30 | ForEach-Object { "y" } | & "C:\Users\Sharoz\.bubblewrap\android_sdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="C:\Users\Sharoz\.bubblewrap\android_sdk" "platforms;android-34" "platforms;android-35" "platforms;android-36" "build-tools;34.0.0" "build-tools;35.0.0" "build-tools;36.0.0"
