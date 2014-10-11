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
    echo 'Build debug !'
    cordova platform remove android
    cordova platform add android
    cp -r app_icons/android/* platforms/android/res/
    grunt build
    echo ''
    echo 'Your debug app is ready : platforms/android/ant-build/devCookers-debug.apk'
    echo ''
else
    echo 'Abort build !'
fi
