# Cookers app

# TODO

- Petits problèmes à régler :
    - 1ère ouverture : on voit la transition
    - champ mail dans l'intro
    - "loading..."
- Remplacer added par created (ionic & firebase)
- Télécharger en local les scripts UserVoice et Mixpanel (et initialiser mixpanel dans la fonction run)
- Demander une autorisation android pour récupérer le mail de l'utilisateur
- Ajouter dans les options un choix d'écran de lancement (home, recipes or cart)
- redesigner les checkbox de la liste de course : agrandir la surface cliquable, mettre en foncé la checkbox des éléments achetés
- espacer un peu les recettes dans les recettes de la semaine (cards ?)
- sur la home, le titre "liste de course" donne envie de cliquer dessus (on a l'impression que c'est un bouton)
- redesign la l'écran recettes : 
    - l'image de la recette reste fixe
    - quand on arrive aux étapes, l'image change pour afficher l'image de l'étape

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
- `cordova plugin add org.apache.cordova.device org.apache.cordova.console https://github.com/driftyco/ionic-plugins-keyboard org.apache.cordova.geolocation https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git org.apache.cordova.inappbrowser` add interesting plugins
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
- org.apache.cordova.inappbrowser : allow to open some links outside the app ([explanation](http://intown.biz/2014/03/30/cordova-ionic-links-in-browser/))

## Release process

- change package & name in `config.xml` : `com.cookers.android.dev` => `com.cookers.android` and `dev-Cookers` => `Cookers`
- remove and add android platform : `cordova platform remove android` and `cordova platform add android` (to sync platform with config.xml)
- add icons to build : copy `app/res/android` in `platforms/android/res` and `platforms/android/ant-build/res`
- increment version number and check that `debug` option is false : `app/scripts/app.js`
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

