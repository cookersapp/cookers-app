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

- Airbnb : https://play.google.com/store/apps/details?id=com.airbnb.android
- Secret : https://play.google.com/store/apps/details?id=ly.secret.android
- Jelly : https://play.google.com/store/apps/details?id=com.jellyhq.starfish

## Tools 

Crop images : http://www.croppola.com/
Android remote debug : chrome://inspect/#devices (tuto: https://developer.chrome.com/devtools/docs/remote-debugging)

# Business

## Data

- __planning__ (planning) : list of menus (for a week for example)
    - __meal__ (repas) : a complete and ordered list of course for the meal
        - __course__ (plat) : a single course
            - __recipe__ (recette) : how to cook the course
            - __ingredient__ (ingrédient) : food with quantity in a course
                - __food__ (aliment) : basic food element
- __shoppinglist__ (liste de courses) : list of elements to buy
    - __item__ (article) : food with quantity in a shoppinglist
        - __food__ (aliment) : basic food element
        - __product__ (produit) : specific product to buy (identified with barcode)
            - __barcode__ (code barre)

