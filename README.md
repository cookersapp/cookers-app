# Retail-scan app

This is a [ionic](http://ionicframework.com/) project for the retail-scan application.  
It allow users to scan food products in stores and get meaningful and personalized recipes. Ingredients can be saved in a shopping list.

## Setup

This project require several tools, if they are not installed, please do.

- [nodejs](http://nodejs.org/) and npm
- [bower](http://bower.io/) : npm install -g bower (probably with sudo)
- [grunt](http://gruntjs.com/getting-started) : npm install -g grunt-cli (probably with sudo)
- [gulp](http://gulpjs.com/) : npm install -g gulp (probably with sudo)
- [phonegap](http://phonegap.com/) : npm install -g phonegap (probably with sudo)
- [ionic](http://ionicframework.com/) : npm install -g ionic (probably with sudo)
- targeted mobile development environment : [XCode](https://developer.apple.com/xcode/), [Android SDK](http://developer.android.com/sdk/index.html) or [Windows Phone SDK](http://developer.windowsphone.com/en-us)


## Getting started

- Get the code : ```git clone git@bitbucket.org:loicknuchel/retail-scan-app-ionic.git```
- Go to created folder : ```cd retail-scan-app-ionic```
- Install bower dependencies : ```bower install```
- Launch app : ```ionic run android```

... not working now... :(


## Infos

- Installed platforms :
    - android : ```ionic platform add android```
- Installed plugins :
    - ```cordova plugin add org.apache.cordova.device```
    - ```cordova plugin add org.apache.cordova.console```
    - ```cordova plugin add org.apache.cordova.statusbar```
    - ```cordova plugin add https://github.com/wildabeast/BarcodeScanner.git```

## Todo

### features

- get geoloc on scans
- suggested recipes on shoppinglist
- products and recipes history
- most common ingredients in ingredient grid
- breadcumbs on ingredient grid
- details on products (with notes and nutrtion)
- add multi cart (change and create carts)
- on recipes choose cart to add ingredients

### data

- ratings on products (from noteo)
- create all recipe ingredients

### done

- details on cart items
- add recipe ingredient to current cart

## Technicals

- add [barcode plugin](https://github.com/wildabeast/BarcodeScanner) : ```cordova plugin add https://github.com/wildabeast/BarcodeScanner.git``` ([explanation](http://stackoverflow.com/questions/20548106/how-to-install-barcodescanner-plugin-on-cordova-phonegap-eclipse-for-android-a))
- folder structure : http://stackoverflow.com/questions/18542353/angularjs-folder-structure
