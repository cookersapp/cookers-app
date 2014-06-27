# Retail-scan app

# Technical

## Getting started

- `npm install` to install all grunt dependencies
- `bower install` to install all bower dependencies
- `grunt serve` to test on your computer

Your app is now running to your computer. To run it to your android device :

- `mkdir platforms plugins www` create folders for cordova
- `cordova platform add android` add android platform to the project
- `cordova plugin add org.apache.cordova.device org.apache.cordova.console https://github.com/driftyco/ionic-plugins-keyboard` add interesting plugins
- `grunt build && cordova run android` to run app on your phone

## Grunt commands

- `grunt serve` use it to develop. It will open your project in browser with live realod.
- `grunt ripple` is an alternative to `grunt serve`. It will open your project in adobe ripple editor with live realod.
- `grunt build` builds your sources and put them in www/ folder to deploy on your device.

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
