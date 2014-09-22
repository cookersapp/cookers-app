cfgWidget=$(grep com.cookers config.xml)
name=$(grep Cookers config.xml)
version=$(grep appVersion app/scripts/_config.js)
debug=$(grep debug app/scripts/_config.js)
echo "Config  :    $cfgWidget"
echo "Name    :$name"
echo "Version :$version"
echo "Debug   :$debug"
echo

read -p "Continue ? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo 'Build release !'
    rm Cookers.apk
    cordova platform remove android
    cordova platform add android
    cp -r app/res/android/* platforms/android/res/
    cordova plugin rm org.apache.cordova.console
    cordova build --release android
    cp platforms/android/ant-build/Cookers-release-unsigned.apk .
    jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cookers-assistant-android-key.keystore Cookers-release-unsigned.apk alias_name
    zipalign -v 4 Cookers-release-unsigned.apk Cookers.apk
    rm Cookers-release-unsigned.apk
else
    echo 'Abort build !'
fi
