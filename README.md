# ngDatabase
ngDatabase is a very easy to use and powerful local storage solution for your Ionic apps.
You don't need to have a back-end or SQL background to understand this service.

With ngDatabase you can store any data as you want (text, number, date, object, ...) thanks to human-friendly methods names.
Work perfectly on desktop and mobile devices powered by Ionic Framwork (http://ionicframework.com/).

## Installation
### ngCordova and cordovaSQLite
First, install ndCordova to your project (http://ngcordova.com/docs/install/) :
```
bower install ngCordova
```
Don't forget to include the ng-cordova.js file and add ngCordova in your app dependencies :
```html
<script src="lib/ngCordova/dist/ng-cordova.js"></script>
```
```javascript
angular.module('myApp', ['ngCordova'])
```

Then, add the cordovaSQLite plugin :
```
cordova plugin add https://github.com/litehelpers/Cordova-sqlite-storage.git
```
### ngDatabase
* __Bower__ : bower install ng-database
* __NPM__ : npm install ng-database

Include the ng-database js file in your ptoject :
```html
<script src="path/to/your/lib/ng-database/src/ng-database.min.js"></script>
```
Then include ngDatabase dependency :
```javascript
angular.module('myApp', ['ngDatabase'])
```
