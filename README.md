# Cookers app

# TODO

- performance improvements :
    - revoir la gestion du local storage
    - attention à l'utilisation du localstorage :( (grosses serializations)
    - http://forum.ionicframework.com/t/angularjs-webinspector-extension-for-chrome-performance-debugging/6106
    - http://www.mikedellanoce.com/2012/09/10-tips-for-getting-that-native-ios.html
    - prefetching/caching templates
    - bind once
    - DOM caching (http://forum.ionicframework.com/t/lack-of-dom-caching-killing-performance-on-slower-devices/4572)
    - concathenate templates (http://forum.ionicframework.com/t/compressed-code-is-fast/2225)
    - optimize recipe images
    
- TODO
    - loading :
        - ajouter des loaders comme dans l'admin
    - tracking :
        - où est ce que les gens s'arrêtent dans les recettes de la semaine
    - cook :
        - mettre une barre de progression correspondante au timer global
        - mettre des tips (différents badges en fonction de la tip) cliquables qui s'ouvrent pour montrer l'astuce
        - slide sur une carte : le retourne et montre une photo du résultat attendu
    - cart ingredients :
        - pouvoir checker les custom items
    - mettre un plugin phonegap pour se connecter "nativement" à facebook, twitter, google
    - mettre en place segment.io
    - pouvoir cuisiner plusieurs recettes en même temps (tablette)
    - mail à :
        - ? connait des persionnes iPhone ?
            - mathieu segret
            - matthieu parisot
            - david wursteisen
            - etienne folio
            - yacine regzy
            - damien cavaillès
            - xavier carpentier
            - pierre chapuis
            - sylvain abélard
            - florent biville
            - quang hai
            - hugo cordier
            - fred cecilia
            - thierry lau
    
    => home page : track click on social links

# Technical

## Getting started

- go to project root folder
- `npm install` to install all grunt dependencies
- `bower install` to install all bower dependencies
- `grunt serve` to test on your computer

Your app is now running to your computer. To run it to your android device :

- `mkdir platforms plugins www` create folders for cordova
- `cordova platform add android` add android platform to the project
- copy `app/res/android` in `platforms/android/res` (and `platforms/android/ant-build/res` if needed) ([explanation](http://intown.biz/2014/03/07/changing-the-cordova-app-icon/))
- `cordova plugin add org.apache.cordova.device org.apache.cordova.console https://github.com/driftyco/ionic-plugins-keyboard org.apache.cordova.geolocation https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git org.apache.cordova.inappbrowser https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git org.apache.cordova.media` add interesting plugins
- `grunt build && cordova run android` to run app on your phone

## Grunt commands

- `grunt serve` use it to develop. It will open your project in browser with live realod.
- `grunt ripple` is an alternative to `grunt serve`. It will open your project in adobe ripple editor with live realod.
- `grunt build` builds your sources and put them in www/ folder to deploy on your device.

## Cordova plugin description

- org.apache.cordova.device : allow to get phone data (uuid, phone model, android version...)
- org.apache.cordova.console : not really sure of benefits but it's recommended (to have a better console.log)
- https://github.com/driftyco/ionic-plugins-keyboard : allow to listen and interract with keyboard
- org.apache.cordova.geolocation : allow to get precise user position (android.permission.ACCESS_COARSE_LOCATION et android.permission.ACCESS_FINE_LOCATION)
- https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git : allow to show toast messages
- org.apache.cordova.inappbrowser : allow to open some links outside the app ([explanation](http://intown.biz/2014/03/30/cordova-ionic-links-in-browser/))
- https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git : prevent screen to sleep
- org.apache.cordova.media : play sounds (for alarms in cook screen) (android.permission.WRITE_EXTERNAL_STORAGE, android.permission.RECORD_AUDIO, android.permission.MODIFY_AUDIO_SETTINGS, android.permission.READ_PHONE_STATE)

## Release process

- change package & name in `config.xml` : `com.cookers.android.dev` => `com.cookers.android` and `dev-Cookers` => `Cookers`
- remove and add android platform : `cordova platform remove android` and `cordova platform add android` (to sync platform with config.xml)
- add icons to build : copy `app/res/android` in `platforms/android/res` and `platforms/android/ant-build/res`
- increment version number and check that `debug` option is false : `app/scripts/_config.js`
- build app : `grunt build && cordova run android`
- Your app is ready here : `platforms/android/ant-build/Cookers-debug-unaligned.apk`
- Upload it to [bitbucket](https://bitbucket.org/retail-scan/ionicapp/downloads) and tag the commit with version number
- Then, rollback your changes ;) (sampe process)

## Installer l'application

- aller dans les Paramètres > Sécurité > Sources inconnues
- Télécharger l'application
- L'installer

## Useful infos

- android push notifications : http://intown.biz/2014/04/11/android-notifications/
- speech recognition : https://github.com/jcsmesquita/cordova-speechrecognition https://github.com/poiuytrez/SpeechRecognizer https://github.com/manueldeveloper/cordova-plugin-speech-recognizer https://github.com/macdonst/SpeechRecognitionPlugin

## Design

Inspirationnal apps :

- [Airbnb](https://play.google.com/store/apps/details?id=com.airbnb.android)
- [Secret](https://play.google.com/store/apps/details?id=ly.secret.android)
- [Jelly](https://play.google.com/store/apps/details?id=com.jellyhq.starfish)

## Tools 

- images : [croppola](http://www.croppola.com/) (corp), [fixpicture](http://www.fixpicture.org/) (resize) and [kraken](https://kraken.io/web-interface) (optimize)
- screenshots : https://developer.android.com/distribute/tools/promote/device-art.html
- Android remote debug : [chrome://inspect/#devices](chrome://inspect/#devices) (tuto: https://developer.chrome.com/devtools/docs/remote-debugging)
- Landing page : [strikingly](http://www.strikingly.com/) + [optimizely](https://www.optimizely.fr/)
- newsletter : [customer.io](http://customer.io/)
- cordova plugins : http://plugreg.com/plugins and http://plugins.cordova.io/

# Changelog

## v0.3.0

- écran de cuisine
- recettes à cuisiner et recettes cuisinées
- améliorations design

## v0.2.0

- l'écran de s'éteint plus sur la ingrédients de la liste de course (quand on est au magasin) et sur le détail d'une recette (quand on cuisine)
