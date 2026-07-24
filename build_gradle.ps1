$env:JAVA_HOME = "C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\jdk17_extracted\jdk-17.0.11+9"
$env:ANDROID_HOME = "C:\Users\Sharoz\.bubblewrap\android_sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\Sharoz\.bubblewrap\android_sdk"
$env:PATH = "C:\Users\Sharoz\Documents\antigravity\proud-lavoisier\jdk17_extracted\jdk-17.0.11+9\bin;C:\Users\Sharoz\.bubblewrap\android_sdk\cmdline-tools\latest\bin;" + $env:PATH

Write-Host "Running gradlew assembleRelease..."
.\gradlew.bat assembleRelease
