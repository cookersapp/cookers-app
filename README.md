# Cookers app

# TODO

- next release :
    - afficher sur la fiche produit si le produit correspond à un bon promo
    - indiquer les informations complémentaires lorsqu'on affiche le produit à partir du panier
    - recommandation de recette (et améliorer le champ : recipe => recommandation, category...)
    - envoyer le panier sur le serveur lorsqu'il est archivé
    
    - ajouter suggestions en haut de la liste de courses
    
    - quand on archive un liste, proposer de reporter les élements non cochés sur la prochaine
    - widget uservoice sur la home
    - mettre en cache les données embeded dans les recipes (foods), les products (additives)

    - trier les ingrédients achetés par ordre dans lequel ils ont été achetés
    - espace blanc en bas de l'écran cuisine :(
    - status bar gradients (ex: https://github.com/AChep/HeadsUp/)
    
    - notifications pour ne pas oublier l'application !
    - proposer de poster la photo du plat cuisiné sur les réseaux sociaux
    - créer un workflow de mail (côté serveur) et fonction des événements de tracking
    - sur la home et dans les recettes cuisiné, le display flex fait aller le texte à la ligne :(
    - accéder aux listes de courses archivées

- téléphones posant problème :
    - GT-N7105 / galaxy note 2  / Adrien Henry
    - wiko ozzy (4.2.2)         / Marion Pierlas
    - galaxy scl                / Perrine Pierlas
    - GT-I9305 (4.1.2)          / Isabelle Souty
    - Galaxy s3                 / Julien Aubriet, Samir Bouaked, Isabelle Souty, Nicolas Nucci
    - galaxy tab 2 gt- p3113    / Benoit Reboul-salze
    - galaxy Ace                / Benoit Reboul-salze
    - LG-D802 (4.2.2)           / Alexis De Valence (problème affichage slides intro)
    - galaxy s2                 / Jean-Baptiste Gabellieri

- TODO
    - gestion des messages à afficher (et la persistence des messages à ne plus afficher : controllers.js:53)
    - see :
        - http://forum.ionicframework.com/t/using-imagecache-in-ionic/4646
        - http://forum.ionicframework.com/t/how-to-login-with-facebook-now/9305
    - cook :
        - mettre une barre de progression correspondante au timer global
        - mettre des tips (différents badges en fonction de la tip) cliquables qui s'ouvrent pour montrer l'astuce
        - slide sur une carte : le retourne et montre une photo du résultat attendu
    - pouvoir cuisiner plusieurs recettes en même temps (tablette)

- Tracking :
    - Liste des utilisateurs avec : email / created / last seen
    - utilisteurs uniques, par jour / semaine
    - popularité des recettes, pour une semaine
        - affichage des ingrédients
        - détails de la recettes
        - ajout de la recette
        - écran cuisine de la recette
        - recette cuisinée
    - ingrédients achetés

- Backend features :
    - redimentionner les images à la taille du téléphone
    - track api
    - user profiles

# Technical

## Getting started

- go to project root folder
- `npm install` to install all grunt dependencies
- `bower install` to install all bower dependencies
- `grunt serve` to test on your computer

Your app is now running to your computer. To run it to your android device :

- `mkdir platforms plugins www` create folders for cordova
- `cordova platform add android` add android platform to the project
- copy `app/res/android` in `platforms/android/res` ([explanation](http://intown.biz/2014/03/07/changing-the-cordova-app-icon/))
- `cordova plugin add org.apache.cordova.device org.apache.cordova.console org.apache.cordova.splashscreen https://github.com/driftyco/ionic-plugins-keyboard org.apache.cordova.geolocation https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git org.apache.cordova.inappbrowser https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git org.apache.cordova.media https://github.com/loicknuchel/cordova-device-accounts.git https://github.com/Dbuggerx/BarcodeScanner.git org.apache.cordova.dialogs org.apache.cordova.vibration` add interesting plugins
- `grunt build && cordova run android` to run app on your phone

## Grunt commands

- `grunt serve` use it to develop. It will open your project in browser with live realod.
- `grunt ripple` is an alternative to `grunt serve`. It will open your project in adobe ripple editor with live realod.
- `grunt build` builds your sources and put them in www/ folder to deploy on your device.

## Cordova plugin description

- org.apache.cordova.device (0.2.11) : allow to get phone data (uuid, phone model, android version...)
- org.apache.cordova.console (0.2.10) : not really sure of benefits but it's recommended (to have a better console.log)
- https://github.com/driftyco/ionic-plugins-keyboard (1.0.3) : allow to listen and interract with keyboard
- org.apache.cordova.geolocation (0.3.9) : allow to get precise user position (android.permission.ACCESS_COARSE_LOCATION et android.permission.ACCESS_FINE_LOCATION)
- https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git (2.0.1) : allow to show toast messages
- org.apache.cordova.inappbrowser (0.5.1) : allow to open some links outside the app ([explanation](http://intown.biz/2014/03/30/cordova-ionic-links-in-browser/))
- https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git (4.0.1) : prevent screen to sleep
- org.apache.cordova.media (0.2.12) : play sounds (for alarms in cook screen) (android.permission.WRITE_EXTERNAL_STORAGE, android.permission.RECORD_AUDIO, android.permission.MODIFY_AUDIO_SETTINGS, android.permission.READ_PHONE_STATE)
- org.apache.cordova.file (1.3.0) : required by media plugin
- https://github.com/loicknuchel/cordova-device-accounts.git (0.0.1) : to get user email (android.permission.GET_ACCOUNTS)

Interesting plugins :
- Access contacts : https://github.com/apache/cordova-plugin-contacts

## Release process

- change package & name in `config.xml` : `com.cookers.android.dev` => `com.cookers.android` and `dev-Cookers` => `Cookers`
- increment version number and check that `debug` option is false : `app/scripts/_config.js`
- run `./build-release.sh`
- Upload it to [bitbucket](https://bitbucket.org/retail-scan/ionicapp/downloads) and tag the commit with version number (ex: git tag v0.3.1 && git push --tags)
- Then, rollback your changes (change `config.xml` and `app/scripts/_config.js`, then use `./build-debug.sh`)

Publishing to market : http://ionicframework.com/docs/guide/publishing.html

## Useful plugins

- barcode scanner :
    - https://github.com/wildabeast/BarcodeScanner
    - https://github.com/Dbuggerx/BarcodeScanner (for portrait)
    - https://github.com/bitflower/Cordova-CanvasCamera (embed camera in img/canvas)
    - https://github.com/daraosn/Cordova-CanvasCamera (camera inside in img/canvas)
- android push notifications :
    - https://github.com/katzer/cordova-plugin-local-notifications
    - http://intown.biz/2014/04/11/android-notifications/
    - https://github.com/phonegap-build/PushPlugin
    - https://github.com/avivais/phonegap-parse-plugin
    - https://github.com/mgcrea/cordova-push-notification
- social share :
    - https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
    - https://github.com/leecrossley/cordova-plugin-social-message
- speech recognition :
    - https://github.com/jcsmesquita/cordova-speechrecognition
    - https://github.com/poiuytrez/SpeechRecognizer
    - https://github.com/manueldeveloper/cordova-plugin-speech-recognizer
    - https://github.com/macdonst/SpeechRecognitionPlugin
- ask to rate app :
    - https://github.com/Viras-/cordova-plugin-rateapp
- resize image :
    - https://github.com/raananw/PhoneGap-Image-Resizer
- app badge :
    - https://github.com/katzer/cordova-plugin-badge
- datepicker :
    - https://github.com/VitaliiBlagodir/cordova-plugin-datepicker
- webintent :
    - https://github.com/Initsogar/cordova-webintent
- network infos :
    - https://github.com/apache/cordova-plugin-network-information
- geofencing :
    - https://github.com/cowbell/cordova-plugin-geofence (sample app: https://github.com/cowbell/ionic-geofence)
- contact picker :
    - https://github.com/nishilshah17/CordovaContactPickerPlugin
- get native app version :
    - https://github.com/whiteoctober/cordova-plugin-app-version
- audio :
    - https://github.com/SidneyS/cordova-plugin-nativeaudio
    - https://github.com/apache/cordova-plugin-media

- Android undo bar (like gmail, firefox) :
    - https://github.com/JohnPersano/SuperToasts
    - https://github.com/soarcn/UndoBar
    - https://github.com/SimonVT/MessageBar

Ionic demo & composants :

- https://github.com/azizimusa/phonegap-demo
- https://github.com/saravmajestic/ionic
- https://github.com/alongubkin/ionic-multiple-views

## Design

Inspirationnal apps :

- [Airbnb](https://play.google.com/store/apps/details?id=com.airbnb.android)
- [Secret](https://play.google.com/store/apps/details?id=ly.secret.android)
- [Jelly](https://play.google.com/store/apps/details?id=com.jellyhq.starfish)

Screenshot gallery inspiration :

- [Hot or Not](https://play.google.com/store/apps/details?id=com.hotornot.app)
- [hello sms](https://play.google.com/store/apps/details?id=com.hellotext.hello)
- [TwoGrand](https://play.google.com/store/apps/details?id=com.twogrand.twogrand)
- [SnapDish Food Camera](https://play.google.com/store/apps/details?id=com.vuzz.snapdish)
- [Meal Planning and Grocery List](https://play.google.com/store/apps/details?id=com.foodonthetable.mobile)
- [Meal Planning and Grocery List](https://play.google.com/store/apps/details?id=com.emeals)
- [Uber](https://play.google.com/store/apps/details?id=com.ubercab)
- [Twitter](https://play.google.com/store/apps/details?id=com.twitter.android)
- [Photo Meal](https://play.google.com/store/apps/details?id=com.jp.mealphoto)
- [Contacts +](https://play.google.com/store/apps/details?id=com.contapps.android)
- [QuizUp](https://play.google.com/store/apps/details?id=com.quizup.core)
- [Tictoc](https://play.google.com/store/apps/details?id=kr.co.tictocplus)
- [Cymera-Appareil photo/éditeur](https://play.google.com/store/apps/details?id=com.cyworld.camera)

## Tools 

- images : [croppola](http://www.croppola.com/) (corp), [fixpicture](http://www.fixpicture.org/) (resize) and [kraken](https://kraken.io/web-interface) (optimize)
- screenshots : https://developer.android.com/distribute/tools/promote/device-art.html
- Android remote debug : [chrome://inspect/#devices](chrome://inspect/#devices) (tuto: https://developer.chrome.com/devtools/docs/remote-debugging)
- Landing page : [strikingly](http://www.strikingly.com/) + [optimizely](https://www.optimizely.fr/)
- newsletter : [customer.io](http://customer.io/)
- cordova plugins : http://plugreg.com/plugins and http://plugins.cordova.io/

## See

- http://modernweb.com/category/mobile/phonegap/
- https://github.com/jbeurel/angular-parse
- https://github.com/jbeurel/angular-parse-boilerplate
