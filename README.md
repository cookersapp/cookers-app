# Retail-scan app

This is a [ionic](http://ionicframework.com/) project for the retail-scan mobile application.  
It allows users to scan food products in stores and get meaningful and personalized recipes. Ingredients can be saved in a grocery list for a convenient shopping.

## Setup

This project require several tools, if they are not installed, please do.

- [nodejs](http://nodejs.org/) and npm
- [bower](http://bower.io/) : ```npm install -g bower``` (probably with sudo)
- [grunt](http://gruntjs.com/getting-started) : ```npm install -g grunt-cli``` (probably with sudo)
- [cordova](https://cordova.apache.org/) : ```npm install -g cordova``` (probably with sudo)
- [ionic](http://ionicframework.com/) : ```npm install -g ionic``` (probably with sudo)
- targeted mobile development environment : [XCode](https://developer.apple.com/xcode/), [Android SDK](http://developer.android.com/sdk/index.html) or [Windows Phone SDK](http://developer.windowsphone.com/en-us)

## Getting started

Here are the few steps to get things working :

- Get the code : ```git clone git@bitbucket.org:loicknuchel/retail-scan-app-ionic.git```
- Go to created folder : ```cd retail-scan-app-ionic```
- Install grunt dependencies : ```npm install```
- Install bower dependencies : ```bower install```
- You are ready !!!! \o/

To run the app, you have many ways :

- In desktop browser :
    - move the project under a webserver and open ```www/index.html```
    - use grunt : run ```grunt serve``` from root folder
    - use [Bracket](http://brackets.io/) editor : activate live preview feature on ```www/index.html```
- In android emulator : ```ionic emulate android``` (your android environment and emulator must have been setted)
- In your android device : ```ionic run android``` (your android environment must have been setted and your phone connected)

## Todo

See [trello board](https://trello.com/b/fdodl9nl/retail-scan)

## Incoming features

- get geoloc on scans
- most common ingredients in ingredient grid
- breadcumbs on ingredient grid
- details on products (with notes and nutrtion)
- add multi cart (change and create carts)

## Infos

- Installed platforms :
    - android (```ionic platform add android```)
- Installed plugins :
    - device (```cordova plugin add org.apache.cordova.device```)
    - console (```cordova plugin add org.apache.cordova.console```)
    - statusbar (```cordova plugin add org.apache.cordova.statusbar```)
    - barcodescanner (```cordova plugin add https://github.com/wildabeast/BarcodeScanner.git```)
