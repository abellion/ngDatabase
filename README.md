# ngDatabase
ngDatabase is a light, very easy to use and powerful local __database__ solution for your __Ionic apps__.
You don't need to have a back-end or SQL background to understand this service.

With ngDatabase you can store any data you want (text, number, date, object, ...) thanks to human-friendly methods names.

__Note : this service will soon be available also for non Ionic project. Stay tuned !__

# Quick links

* [Get started] ()
* [Installation] (#installation)
* [Initialize] (#initialize-ngdatabase)
* [Create Repositories] (#create-repositories)
* [Get Repositories] (#get-repositories)
* [Add data] (#add-data)
* [Delete data] (#delete-data)
* [Get data] (#get-data)
* [Update data] (#update-data)
* [Set conditions] (#set-conditions)
* [Native SQLite syntax] (#native-sqlite-syntax)
* [Global exemple] (#global-example)

# Get started
Get started in 4 steps by following this guideline.

* The very first thing you have to do is install ngDatabase : [ngDatabase installation] (#installation)

* At this point you must launch ngDatabase inside your app and tell him what kind of 'repository' you will used. In ngDatabase a repository is a place where your data will be stored. For exemple if you have to store some user and customer data you will have two repositories severally called 'users' and 'customers'. Check how to initialize and create repositories : [Initialize] (#initialize-ngdatabase), [Create Repositories] (#create-repositories)

* Now you've got some repositories ready to work. Each time you make operations on your repositories you have to use the _getRepository()_ method to be able to do anything. -> [Get Repositories] (#get-repositories)

* The previous method give you an new instance of a working repository. Now you can make what you want thanks to the 4 following methods : [Add data] (#add-data), [Delete data] (#delete-data), [Get data] (#get-data), [Update data] (#update-data)

* As you can observe we can't do a lot only with these 4 methods. It's the combination between them and 3 others which make the magic. These 3 others are _setBy(), setOrder()_ and _setLimit()_ which define by what criterion the data will be get, add, delete, ... Check it : [Set conditions] (#set-conditions)

# Installation
### ngCordova and cordovaSQLite
First, install ndCordova to your project (http://ngcordova.com/docs/install/) :
```shell
bower install ngCordova
```
Don't forget to include the ng-cordova.js file and add ngCordova in your app dependencies :
```html
<script src="path/to/your/lib/ngCordova/dist/ng-cordova.js"></script>
```
```javascript
angular.module('myApp', ['ngCordova']);
```

Then, add the cordovaSQLite plugin :
```shell
cordova plugin add https://github.com/litehelpers/Cordova-sqlite-storage.git
```
### ngDatabase
```shell
bower install ng-database #bower
npm install ng-database #NPM
```

Include the ng-database js file in your project :
```html
<script src="path/to/your/lib/ng-database/src/ng-database.min.js"></script>
```
Then include ngDatabase dependency :
```javascript
angular.module('myApp', ['ngDatabase']);
```

# Usage

##### Important note : all of ngDatabase method must be used when the _deviceready_ event fired.

### Initialize ngDatabase
##### Prototype
```javascript
promise init (object NGDB_SCHEMA)
```
##### Description
ngDatabase _init()_ setup the local database configuration thanks to the NGDB_SCHEMA object (see [Create Repositories] (#create-repositories)).
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
You can create repositories when you init ngDatabase or with the createRepositories() method.
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

//Following both methods work
ngdb.init(NGDB_SCHEMA);
ngdb.createRepositories(NGDB_SCHEMA);
```
##### Typing
For each repository field you have to indicate the value type.

* __ID__        : special integer type which is incremented at each insertion 
* __STRING__    : can store string such as text
* __NUMBER__    : an integer or floating number
* __BOOLEAN__   : _true_ or _false_ values (same as 1 or 0)
* __OBJECT__    : a javascript object
* __ARRAY__     : a javascript array
* __DATE__      : a date

### Get repositories
##### Prototype
```javascript
ngdb getRepository(string repositoryName)
```
##### Description
This method allow you to make operations in the specified _repositoryName_.
##### Exemple
```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  //Make all your operations.

});
```

### Add data
##### Prototype
```javascript
promise add(object data)
```
##### Description
Add new datas in repository.

Note that you do not have to convert your data. Just let objects as objects, numbers as numbers, strings as strings, ...

__Return__ promise containing

* An object with the insertion informations (the ID particularly)

##### Exemple
```javascript
myApp.controller('myCtrl', function(ngdb) {

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

* An object with the informations about the deletion

##### Exemple
```javascript
myApp.controller('myCtrl', function(ngdb) {

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

* An object with the data

##### Exemple
```javascript
myApp.controller('myCtrl', function(ngdb) {

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

* An object with informations about the update

##### Exemple
```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository = ngdb.getRepository('users');
  var picturesRepository = ngdb.getRepository('pictures');
  
  var usersToUpdate = {
    pictures_id: 6,
    name: 'John',
    born: born: new Date().getTime()
  };
  var picturesToUpdate = {
    pictures: {}
  };
  
  //Update all users and pictures data
  var usersUpdated = usersRepository.update(usersToUpdate);
  var picturesUpdated = picturesRepository.update(picturesToUpdate);
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

They have an influence on the result you'll obtain. The arguments they take contain the informations that describe how the _get(), getOne(), add(), update()_ and _delete()_ methods will make operations.

* _setBy_ : take an object -> {fieldName: 'toBeEqual', ...}
* _setOrder_ : take an object -> {fieldName: 'ASC', fieldName: 'DESC'}
* _setLimit_ : take two integer which represent the interval

__Return__ a _ngdb_ instance.
##### Exemple
```javascript
myApp.controller('myCtrl', function(ngdb) {

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

### Native SQLite syntax
##### Prototypes
```javascript
promise query(string query, array bindings)
object fetchAll(object SQLiteResult)
object fetch(object SQLiteResult)
```
##### Description
NGDatabase also allow you to use SQLite as native syntax.
* query() : make an SQLite Query 
* fetchAll() : fetch all SQLite Query result 
* fetch() : fetch one SQLite Query result

##### Exemple

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var query = "SELECT * FROM users WEHRE name = ?";
  var bindings = ['John Doe'];
  var result = ngdb.query(query, bindings);
  
  result.then(function(result) {
    result = ngdb.fetchAll(result);
  });
});
```

# Global example
```javascript
myApp.controller('myCtrl', function($scope, ngdb){
  
  var usersRepository = ngdb.getRepository('users');
  
  //Add new user
  var userAdded = usersRepository.add({
    name: 'John Doe',
    born: new Date().getTime()
  });
  
  userAdded.then(function(result){
    var userId = result.insertId;
  });
  
  //Get a specific user data and send them into the view (assume that we have got the user id)
  var user = usersRepository.setBy({id: userId}).getOne();
  
  user.then(function(result){
    $scope.user = result;
  });
  
  //Update user (assume that the user has updated his data in the view)
  var update = usersRepository.setBy({id: userID}).update($scope.user);
  
  update.then(function(result) {
    //Do what you want
  });
  
  //Delete user
  var deleted = usersRepository.setBy({id: userID}).delete();
  
  update.then(function(result) {
    //Do what you want
  });
  
  //Get all users sorted by name in descendent order
  var users = usersRepository.setOrder({name: 'DESC'}).get();
  
  users.then(function(result){
    $scope.users = result;
  });
});
```
