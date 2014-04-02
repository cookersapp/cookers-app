# Take some notes and reminders here

## Technicals

- add [barcode plugin](https://github.com/wildabeast/BarcodeScanner) : ```cordova plugin add https://github.com/wildabeast/BarcodeScanner.git``` ([explanation](http://stackoverflow.com/questions/20548106/how-to-install-barcodescanner-plugin-on-cordova-phonegap-eclipse-for-android-a))

## Folder structure :

/app  
    /bower_components  
    /config  
    /fonts  
    /images  
    /scripts  
        /common  
        /controllers  
        /directives  
        /filters  
        /services  
        app.js  
    /styles  
    /vendor  
        /scripts  
        /styles  
    /views  
    index.html  
/dist  
/node_modules  
/test  
bower.json  
Gruntfile.js  
package.json  

## AngularJS projects to look

form [Mathieu Robin talk](http://mathrobin.github.io/talks/JavaScript/30minutes30projets.html) :

- UI
    - [AngularUI](http://angular-ui.github.io/)
    - [UIBootstrap](http://angular-ui.github.io/bootstrap/)
    - [UICalendar](https://github.com/angular-ui/ui-calendar)
    - [AngularCharts](http://chinmaymk.github.io/angular-charts/)
    - [AngularTreeview](https://github.com/eu81273/angular.treeview)
    - [ngInfiniteScroll](http://binarymuse.github.io/ngInfiniteScroll/)
    - [AngularFileUpload](https://github.com/danialfarid/angular-file-upload)
    - [AngularTour](http://daftmonk.github.io/angular-tour/)
    - [AngularSnap](https://github.com/jtrussell/angular-snap.js)
- Utils
    - [UIRouter](https://github.com/angular-ui/ui-router)
    - [RestAngular](https://github.com/mgonto/restangular)
    - [AngularCache](https://github.com/jmdobry/angular-cache)
    - [localForage](https://github.com/ocombe/angular-localForage)
    - [ngSocketIO](https://github.com/mbenford/ngSocketIO)
    - [BindOnce](https://github.com/Pasvaz/bindonce)
    - [OcLazyLoad](https://github.com/ocombe/ocLazyLoad)
- Tools
    - [ngTailor](https://github.com/lauterry/ngTailor)
    - [ngModules](http://ngmodules.org/)

## Abréviations : 

- Application   : app, project

- Templates     : tpl, views,   tmpl, partials
- JavaScript    : src, scripts, js
- CSS           : css, styles
- Images        : img, images
- livrairies    : lib, vendor
- Polices       :      fonts
- Configuration : cfg, config, conf, settings
- Common        : common
- Test          :      tests
- Autres        :      assets, resources, plugins, components

- Controllers   : ctl, controllers, ctrl
- Services      : srv, services
- Directives    : dir, directives
- Filtres       :      filters
- Modèles       :      models

- Minified      : bin, dist, target, build

## Getting started with ionic framework (not finalized...)

- create a folder : ```mkdir myapp```
- go to this folder : ```cd myapp```
- create your phonegap app : ```phonegap create . "com.example.app" "MyApp"```
- create your angular app 
    - with [yeoman](http://yeoman.io/) : ```yo angular --minsafe```
    - with [ngTailor](https://github.com/lauterry/ngTailor) : ```grunt-init angular --force```
- change angular app dist folder to www : in Gruntfile change ```distDir: 'dist',``` by ```distDir: 'www',```
- move www/config.xml to app folder : ```mv www/config.xml app/```
- add app/config.xml to be copied in www folder in Gruntfile.js : ???
- remove folder www : ```rm -rf www```
- edit app/config.xml if needed
- create app/phonegap.js with :
```
(function(){})();
```
- add app/phonegap.js script to app/index.html
- add needed phonegap plugins : 

- add file .gitignore :
```
npm-debug.log
www
platforms
plugins
```
