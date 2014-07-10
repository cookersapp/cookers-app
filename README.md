# Cookers app

# Technical

## Getting started

- go to project root folder
- `npm install` to install all grunt dependencies
- `bower install` to install all bower dependencies
- `grunt serve` to test on your computer

Your app is now running to your computer. To run it to your android device :

- `mkdir platforms plugins www` create folders for cordova
- `cordova platform add android` add android platform to the project
- put app icons in `platforms/android/res` (and `platforms/android/ant-build/res` if needed) ([explanation](http://intown.biz/2014/03/07/changing-the-cordova-app-icon/))
- `cordova plugin add org.apache.cordova.device org.apache.cordova.console https://github.com/driftyco/ionic-plugins-keyboard org.apache.cordova.geolocation https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git` add interesting plugins
- `grunt build && cordova run android` to run app on your phone

## Grunt commands

- `grunt serve` use it to develop. It will open your project in browser with live realod.
- `grunt ripple` is an alternative to `grunt serve`. It will open your project in adobe ripple editor with live realod.
- `grunt build` builds your sources and put them in www/ folder to deploy on your device.

## Cordova plugin description

- org.apache.cordova.device : allow to get phone data (uuid, phone model, android version...)
- org.apache.cordova.console : not really sure of benefits but it's recommended (to have a better console.log)
- https://github.com/driftyco/ionic-plugins-keyboard : allow to listen and interract with keyboard
- org.apache.cordova.geolocation : allow to get precise user position
- https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git : allow to show toast messages


## Release process

- change package in `config.xml` : `com.cookers.android.dev` => `com.cookers.android`
- increment version number and check that `debug` option is false : `app/scripts/app.js`
- build app : `grunt build`
- Your app is ready here : `platforms/android/ant-build/Cookers-debug-unaligned.apk`

## Useful infos

- open external links : http://intown.biz/2014/03/30/cordova-ionic-links-in-browser/
- android push notifications : http://intown.biz/2014/04/11/android-notifications/

## Design

Inspirationnal apps :

- [Airbnb](https://play.google.com/store/apps/details?id=com.airbnb.android)
- [Secret](https://play.google.com/store/apps/details?id=ly.secret.android)
- [Jelly](https://play.google.com/store/apps/details?id=com.jellyhq.starfish)

## Tools 

- Crop images : [croppola](http://www.croppola.com/) ([fixpicture](http://www.fixpicture.org/) to resize)
- Android remote debug : [chrome://inspect/#devices](chrome://inspect/#devices) (tuto: https://developer.chrome.com/devtools/docs/remote-debugging)
- Landing page : [strikingly](http://www.strikingly.com/) + [optimizely](https://www.optimizely.fr/)
- newsletter : [customer.io](http://customer.io/)
- cordova plugins : http://plugreg.com/plugins

# Business

## Data

- __weekrecipe__ (recettes de la semaine) : suggested recipes for the week
    - __recipe__ (recette) : recette
        - __ingredient__ (ingrédient) : food with quantity in a recipe
            - __food__ (aliment) : basic food element
- __cart__ (liste de courses) : list of recipes to buy
    - recipeItem (recette) : recipe added to cart with wanted quantity

- Taille écran nexus 4 : 384x568px
- Taille header : 44px

