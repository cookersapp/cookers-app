# Cookers app

# TODO

- next release :
    - splash screen
    - problème scroll écran feedback (mail Julien Richarte)
    - espace blanc en bas de l'écran cuisine :(
    
    - proposer de poster la photo du plat cuisiné sur les réseaux sociaux
    - notifications pour ne pas oublier l'application !
    - créer un workflow de mail (côté serveur) et fonction des événements de tracking
    - sur la home et dans les recettes cuisiné, le display flex fait aller le texte à la ligne :(
    - accéder aux listes de courses archivées
    - tracking : http://www.google.com/analytics/, https://keen.io/, http://trak.io/

- téléphones posant problème :
    - GT-N7105 / galaxy note 2  / Adrien Henry
    - wiko ozzy (4.2.2)         / Marion Pierlas
    - galaxy scl                / Perrine Pierlas
    - GT-I9305 (4.1.2)          / Isabelle Souty
    - Galaxy s3                 / Julien Aubriet, Samir Bouaked, Isabelle Souty, Nicolas Nucci
    - galaxy tab 2 gt- p3113    / Benoit Reboul-salze
    - galaxy Ace                / Benoit Reboul-salze
    - LG-D802 (4.2.2)           / Alexis De Valence (problème affichage slides intro)

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
- `cordova plugin add org.apache.cordova.device org.apache.cordova.console https://github.com/driftyco/ionic-plugins-keyboard org.apache.cordova.geolocation https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git org.apache.cordova.inappbrowser https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git org.apache.cordova.media https://github.com/loicknuchel/cordova-device-accounts.git` add interesting plugins
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
- remove and add android platform : `cordova platform remove android` and `cordova platform add android` (to sync platform with config.xml)
- add icons to build : copy `app/res/android` in `platforms/android/res` and `platforms/android/res`
- `cordova plugin rm org.apache.cordova.console` remove useless plugins
- build app : `grunt build && cordova run android`
- Your app is ready here : `platforms/android/ant-build/Cookers-debug-unaligned.apk`
- Upload it to [bitbucket](https://bitbucket.org/retail-scan/ionicapp/downloads) and tag the commit with version number (git tag v0.3.1 && git push --tags)
- Then, rollback your changes ;) (sampe process)

Publishing to market : http://ionicframework.com/docs/guide/publishing.html
Run comands :

- `cordova build --release android` that will create the release app in `platforms/android/ant-build/Cookers-release-unsigned.apk`
- copy release apk in project folder (containing `cookers-assistant-android-key.keystore` file)
- `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cookers-assistant-android-key.keystore Cookers-release-unsigned.apk alias_name` (you will need keystore password...)
- `zipalign -v 4 Cookers-release-unsigned.apk Cookers.apk`
- Your apk is ready : `Cookers.apk` ! You can now delete `Cookers-release-unsigned.apk`

Or, run script `build-release.sh`...

## Installer l'application

Android :

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

Tailles d'écran :

- iPhone 5 : 320x568

## Tools 

- images : [croppola](http://www.croppola.com/) (corp), [fixpicture](http://www.fixpicture.org/) (resize) and [kraken](https://kraken.io/web-interface) (optimize)
- screenshots : https://developer.android.com/distribute/tools/promote/device-art.html
- Android remote debug : [chrome://inspect/#devices](chrome://inspect/#devices) (tuto: https://developer.chrome.com/devtools/docs/remote-debugging)
- Landing page : [strikingly](http://www.strikingly.com/) + [optimizely](https://www.optimizely.fr/)
- newsletter : [customer.io](http://customer.io/)
- cordova plugins : http://plugreg.com/plugins and http://plugins.cordova.io/

Tracking with segment.io :

- Advertising
    - http://www.alexa.com/ : Actionable Analytics for the Web
    - http://www.comscore.com/ : Analytics for a Digital World
    - https://www.google.com/tagmanager/ : Le marketing numérique devient (nettement) plus facile
    - https://www.quantcast.com/
    - http://spinnakr.com/ : Spinnakr is analytics that takes action for you.
    - https://www.hellobar.com/
- Analytics
    - https://keen.io/ : Custom analytics shouldn't be a pain in the backend.
    - https://mixpanel.com/ : Actions speak louder than page views.
    - http://trak.io/ : Increase Paid Conversions & Fight Churn, See Who Is Using Your Product And Send Automated Emails Based On Their Behaviour
    - http://usercycle.com/ : Growth Platform on Steroids for SaaS Products
    - http://www.google.com/analytics/ : Solution professionnelle d'analyse d'audience Internet
    - http://clicky.com/ : Real Time Web Analytics
    - https://count.ly/ : Meet the next generation mobile analytics platform
    - http://www.flurry.com/
    - http://get.gaug.es/ : Website Analytics you can Actually Understand
    - https://heapanalytics.com/ : Instant and retroactive analytics for web and iOS.
    - http://www.iron.io/
    - http://piwik.org/ : Liberating Web Analytics
    - https://metrika.yandex.com/
- Customer Relationships
    - http://trak.io/ : Increase Paid Conversions & Fight Churn, See Who Is Using Your Product And Send Automated Emails Based On Their Behaviour
    - http://luckyorange.com/ : See How your Visitors Actually Use your Website
- Ecommerce
    - http://www.mojn.com/
- Email Marketing
- Error Reporting
    - https://www.pingdom.com/ : Uptime and performance monitoring made easy
- User Testing

# Changelog

## v0.3.2

- prix pour la liste de courses
- optimisation de performance
- meilleur rendu sur les écrans étroits
- correction de quelques bug

## v0.3.0

- écran de cuisine
- recettes à cuisiner et recettes cuisinées
- améliorations design

## v0.2.0

- l'écran de s'éteint plus sur la ingrédients de la liste de course (quand on est au magasin) et sur le détail d'une recette (quand on cuisine)
