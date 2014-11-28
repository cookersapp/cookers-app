#!/bin/bash

configApk='config.xml'
configApp='app/scripts/_config.js'
currentVersion=$(grep version=\" $configApk | sed -e 's/.*version="\([^"]*\)".*/\1/g')

echo ''
echo 'Hello '$USER'.'
echo 'You will generate apk with this script.'
echo 'Choose target app version (current: '$currentVersion') :'
read version
prodFile='Cookers-v'$version'.apk'
debugFile='devCookers-v'$version'.apk'
echo ''
echo 'Enter passphrase to sign prod apk (cookers-assistant-android-key.keystore) :'
read -s password
echo ''
echo 'Will generate app with version <'$version'> ('$prodFile' and '$debugFile')'
echo ''


# change version in config.xml and _config.js
sed -i 's/\(version="\)[^"]*\("\)/\1'$version'\2/' $configApk
sed -i "s/\(appVersion: '\)[^']*\('\)/\1"$version"\2/" $configApp


# build production apk
sed -i 's/\(id="com.cookers.assistant.android\).dev\("\)/\1\2/' $configApk
sed -i 's/\(<name>\)dev-\(Cookers<\/name>\)/\1\2/' $configApk
sed -i 's/\(verbose: \)[^,]*\(,\)/\1false\2/' $configApp
sed -i 's/\(debug: \)[^,]*\(,\)/\1false\2/' $configApp
cordova platform remove android
cordova platform add android
cp -r app_icons/android/* platforms/android/res/
grunt build
cordova build --release android
#cp platforms/android/ant-build/Cookers-release-unsigned.apk .
#jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cookers-assistant-android-key.keystore -storepass $password Cookers-release-unsigned.apk alias_name
#zipalign -v 4 Cookers-release-unsigned.apk $prodFile
#rm Cookers-release-unsigned.apk
cp platforms/android/ant-build/CordovaApp-release-unsigned.apk .
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cookers-assistant-android-key.keystore -storepass $password CordovaApp-release-unsigned.apk alias_name
zipalign -v 4 CordovaApp-release-unsigned.apk $prodFile
rm CordovaApp-release-unsigned.apk


# build debug apk
sed -i 's/\(id="com.cookers.assistant.android\)\("\)/\1.dev\2/' $configApk
sed -i 's/\(<name>\)\(Cookers<\/name>\)/\1dev-\2/' $configApk
sed -i 's/\(verbose: \)[^,]*\(,\)/\1true\2/' $configApp
sed -i 's/\(debug: \)[^,]*\(,\)/\1true\2/' $configApp
cordova platform remove android
cordova platform add android
cp -r app_icons/android/* platforms/android/res/
grunt build
#cp platforms/android/ant-build/devCookers-debug.apk .
#mv devCookers-debug.apk $debugFile
cp platforms/android/ant-build/CordovaApp-debug.apk .
mv CordovaApp-debug.apk $debugFile


# Finish...
sed -i "s/\(appVersion: '\)[^']*\('\)/\1~\2/" $configApp
echo ''
echo 'Your apps are ready in project root folder : '$prodFile' and '$debugFile
echo ''
