# ngDatabase
ngDatabase is a lite, very easy to use and powerful local storage solution for your Ionic apps.
You don't need to have a back-end or SQL background to understand this service.

With ngDatabase you can store any data as you want (text, number, date, object, ...) thanks to human-friendly methods names.
Work perfectly on desktop and mobile devices powered by Ionic Framwork (http://ionicframework.com/).

# Installation
### ngCordova and cordovaSQLite
First, install ndCordova to your project (http://ngcordova.com/docs/install/) :
```shell
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
```shell
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

# Usage

##### Important note : all of ngDatabase method must be used when the _deviceready_ event fired.

### Initialize ngDatabase
##### Prototype
```javascript
void init (object NGDB_SCHEMA)
```
##### Description
ngDatabase _init()_ setup the local database configuration thanks to the NGDB_SCHEMA object (see below).
##### Exemple
Don't forget to include _ngdb_ dependency in the angular _run()_ method (or where you want) :
```javascript
myApp.run(function($ionicPlatform, ngdb) {
  var NGDB_SCHEMA = {
    //...
  };

  $ionicPlatform.ready(function(){
    ngdb.init(NGDB_SCHEMA);
  });

});
```

### Create repositories
##### Prototype
```javascript
object NGDB_SCHEMA
```
##### Description
Repositories are the equivalent of tables in SQL. In other words, it's where and how your data are stored.
##### Exemple
For exemple, if you have an user management in your app, your repositories looks like that :
```javascript
var NGDB_SCHEMA = {
  users: {
    id:         'ID',
    pictures_id:'NUMBER'
    name:       'STRING',
    born:       'DATE'
  },
  pictures: {
    id:         'ID',
    pictures:   'OBJECT'
  }
};
```
##### Typing
ngDatabase has a human friendly typing syntax. ngDatabase just make a conversion in correct SQLite types.

__Note that these types are important for the internal working.__
* __ID__        : set an _integer primary key_
* __STRING__    : set a _text_
* __NUMBER__    : set an _integer_
* __BOOLEAN__   : set a _boolean_
* __OBJECT__    : set a _text_
* __ARRAY__     : set a _text_
* __DATE__      : set a _datetime_

### Get repositories
##### Prototype
```javascript
ngdb getRepository(string repositoryName)
```
##### Description
This method allow you to make operations in the specified _repositoryName_.
##### Exemple
```javascript
myApp.controller(function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  //Make all your operations.

});
```

### Add data
##### Prototype
```javascript
promise add (object data)
```
##### Description
Add new datas in repository.

Note that you do not have to convert your data. Just let objects as objects, numbers as numbers, strings as strings, ...

__Return__ promise containing

  -> an object with insertion informations (the ID particularly)
##### Exemple
```javascript
myApp.controller(function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  var userToAdd = {
    pictures_id: 5,
    name: 'Jack',
    born: new Date().getTime()
  };
  var pictureToAdd = {
    pictures: {}
  };
  
  usersRepository.add(userToAdd);
  picturesRepository.add(pictureToAdd);

});
```

### Delete Data
##### Prototype
```javascript
promise delete()
```
##### Description
Delete entries in the repository.

__Return__ promise containing

  -> an object with informations about the deletion
##### Exemple
```javascript
myApp.controller(function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  //Delete all users and pictures data
  var usersData = usersRepository.delete();
  var picturesData = picturesRepository.delete();
});
```

### Get data
##### Prototypes
```javascript
promise get()
promise getOne()
```
##### Description
Get data from repository.

All your data are gived back to the correct type (objects as objects, numbers as numbers, ...)

__Return__ promise containing

  -> an object with the data
##### Exemple
```javascript
myApp.controller(function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  //Get all users and pictures data
  var usersData = usersRepository.get();
  var picturesData = picturesRepository.get();

  //Get the first user and picture data
  var firstUserData = usersRepository.getOne();
  var firstPictureData = pictureRepository.getOne();
});
```

### Update data
##### Prototype
```javascript
promise update(object data)
```
##### Description
Update the specified _data_.

__Return__ promise containing

  -> an object with informations about the update
##### Exemple
```javascript
myApp.controller(function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  var userToUpdate = {
    pictures_id: 6,
    name: 'John',
    born: born: new Date().getTime()
  };
  var pictureToUpdate = {
    pictures: {}
  };
  
  //Get all users and pictures data
  var usersData = usersRepository.get();
  var picturesData = picturesRepository.get();
});
```

### Set conditions
##### Prototypes
```javascript
ngdb setBy(object conditions)
ngdb setOrder(object conditions)
ngdb setLimit(int from, int to)
```
##### Description
These methods must be used before call the _get(), getOne(), add(), update()_ and _delete()_ methods.

They have an influence on the result you'll obtain. They take in argument an object containing the informations that describe how the _get(), getOne(), add(), update()_ and _delete()_ methods will make operations.

* _setBy_ : take an object of conditions -> {fieldName: 'toBeEqual', ...}
* _setOrder_ : take an object of conditions -> {fieldName: 'ASC', fieldName: 'DESC'}
* _setLimit_ : take two integer witch correspond to the interval

__Return__ an _ngdb_ instance.
##### Exemple
```javascript
myApp.controller(function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  //Get an user by his ID
  var user = usersRepository
  .setBy({id: 5})
  .getOne();
  
  //Get all users who are called 'John' and born on the specified date
  var users = usersRepository
  .setBy({name: 'John', born: new Date().GetTime()})
  .get();
  
  //Same as before except that the results are sorted in descendent order by name
  var users = usersRepository
  .setBy({name: 'John', born: new Date().GetTime()})
  .setOrder({name: 'DESC'})
  .get();
  
  //Same as before except that we get only the 10 first results
  var users = usersRepository
  .setBy({name: 'John', born: new Date().GetTime()})
  .setOrder({name: 'DESC'})
  .setLimit(0, 10)
  .get();
  
  /*
  ** Obviously work with get(), getOne(), update(), ...
  */
});
```
