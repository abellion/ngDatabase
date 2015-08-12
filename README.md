# ngDatabase
A very simple and powerful local storage solution for your Ionic apps.

## Installation
### Requirements
* AngularJS
* Ionic
* cordovaSQLite

### Dependencies (ngCordova and cordovaSQLite)
First, install ndCordova to your project (http://ngcordova.com/docs/install/) :
```
bower install ngCordova
```
Don't forget to include the ng-cordova.js file and add ngCordova in your app dependencies :
```
<script src="lib/ngCordova/dist/ng-cordova.js"></script>
```
```
angular.module('myApp', ['ngCordova'])
```

Then, add the cordovaSQLite plugin :
```
cordova plugin add https://github.com/litehelpers/Cordova-sqlite-storage.git
```
### ngDatabase
