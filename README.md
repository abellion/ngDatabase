# ngDatabase
ngDatabase is a light, very easy to use and powerful __storage__ solution for your __[Ionic](http://ionicframework.com/)__ apps. Take advantage of unlimited storage size, data binding, very flexible data management and more.  

# Quick links

* __Get started__
  * [Quick guide] (#quick-guide)
  * [Installation] (#installation)
* __Repositories__
  * [Create Repositories] (#create)
  * [Get Repositories] (#get)
* __Data operation__
  * [Add data] (#add)
  * [Get data] (#get)
  * [Update data] (#update)
  * [Delete data] (#delete)
* __Data selection__
  * [Set order](#order)
  * [Set standards](#standards)
  * [Set limit](#limit)
* __Data binding__
  * [How it works]()
  * [Watch updates]()
* __Low level usage__
  * [Native SQLite syntax] (#native-sqlite-syntax)

### Get started 
#### Quick guide
Get started in 4 steps by following this guideline.

* The very first thing you have to do is install ngDatabase : [ngDatabase installation] (#installation)

* At this point you must launch ngDatabase inside your app and tell him what kind of 'repository' you will used. In ngDatabase a repository is a place where your data will be stored. For exemple if you have to store some user and customer data you will have two repositories severally called 'users' and 'customers'. Check how to create repositories : [Create Repositories] (#create)

* Now you've got some repositories ready to work. Each time you make operations on your repositories you have to use the _getRepository()_ method to be able to do anything. -> [Get Repositories] (#get)

* The previous method give you an new instance of a working repository. Now you can make what you want thanks to the 4 following methods : [Add data] (#add), [Get data] (#get), [Update data] (#update), [Delete data] (#delete)

* As you can observe we can't do a lot only with these 4 methods. It's the combination between them and 3 others which make the magic. These 3 others are _setBy(), setOrder()_ and _setLimit()_ which define by what criterion the data will be get, add, delete, ... Check it : [Data selection] (#data-selection)

### Installation
#### ngCordova and cordovaSQLite
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
#### ngDatabase
```shell
bower install ng-database #bower
npm install ng-database #NPM
```

Include the ng-database js file in your project :
```html
<script src="path/to/your/lib/ng-database/dist/ngdb.min.js"></script>
```
Then include ngDatabase dependency :
```javascript
angular.module('myApp', ['ngCordova', 'ngDatabase']);
```

# API

##### Important note : all of ngDatabase method must be used when the _deviceready_ event fired.

### Repositories
#### Create
##### Prototype
```javascript
ngdbProvider setRepository(string repositoryName, object repositorySchema)
```
##### Description
A repository is a kind of bag which define your data schema. It's typically an object where each key-value pair correspond 	respectively to the name of your data and his type (see bellow). This operation is done in the config step of your app.
For exemple, if you have to manage users and pictures in your app your repositories could look like that :
```javascript
app.config(function(ngdbProvider) {
  var usersRepository = {
    id:         'ID',
    pictures_id:'NUMBER'
    name:       'STRING',
    born:       'DATE'
  };
  
  var pictures = {
    id:         'ID',
    pictures:   'OBJECT'
  };
  
  ngdbProvider
    .setRepository('users', usersRepository)
    .setRepository('pictures', picturesRepository);
});
```

* __ID__        : special integer type which is incremented at each insertion 
* __STRING__    : can store string such as text
* __NUMBER__    : an integer or floating number
* __BOOLEAN__   : _true_ or _false_ values
* __OBJECT__    : a javascript object
* __ARRAY__     : a javascript array
* __DATE__      : a date (must be an instance of Date())

#### Get
##### Prototype
```javascript
ngdb getRepository(string repositoryName)
```
##### Description
This method allow you to make operations in the specified _repositoryName_.
Use it to add, delete, update...
```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository     = ngdb.getRepository('users');
  var picturesRepository  = ngdb.getRepository('pictures');
  
  //Make all your operations.

});
```

### Data operation
#### Add
##### Prototype
```javascript
promise add(object data)
```
##### Description
This method add some data in a repository. Only the keys that correspond to the mapping defined in the config step will be added. Note that you do not have to convert your data. Just let objects as objects, numbers as numbers, strings as strings, ...

__Return__ a promise containing an object with the insertion informations (the ID particularly).

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository     = ngdb.getRepository('users');
  var picturesRepository  = ngdb.getRepository('pictures');
  
  var userToAdd = {
    pictures_id:  5,
    name:         'Jack',
    born:         new Date().getTime()
  };
  var pictureToAdd = {
    pictures:     {'path1', 'path2'}
  };
  
  var user    = usersRepository.add(userToAdd);
  var picture = picturesRepository.add(pictureToAdd);

  user.then(function(result) {
    //The insered id
    console.log(result.insertId);
  });

});
```
### Get
##### Prototypes
```javascript
promise get()
promise getOne()
```
##### Description
Get data from repository.
All your data are gived back to the correct type (objects as objects, numbers as numbers, ...)

__Return__ promise containing an object with the requested data.

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository     = ngdb.getRepository('users');
  var picturesRepository  = ngdb.getRepository('pictures');
  
  //Get all users and pictures data
  var usersData     = usersRepository.get();
  var picturesData  = picturesRepository.get();

  //Get the first user and picture data
  var firstUserData     = usersRepository.getOne();
  var firstPictureData  = pictureRepository.getOne();
  
  usersData.then(function(result) {
    //Your data is here !
    console.log(result);
  });
  
});
```

#### Update
##### Prototype
```javascript
promise update(object data)
```
##### Description
Update the specified _data_.

__Return__ promise containing an object with informations about the update.

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository     = ngdb.getRepository('users');
  var picturesRepository  = ngdb.getRepository('pictures');
  
  var usersToUpdate = {
    name: 'John Doe',
  };
  var picturesToUpdate = {
    pictures: {'newPath'}
  };
  
  //Update all users and pictures data
  usersRepository.update(usersToUpdate);
  picturesRepository.update(picturesToUpdate);
  
});
```

#### Delete
##### Prototype
```javascript
promise delete()
```
##### Description
Delete entries in the repository.

__Return__ promise containing an object with the informations about the deletion.

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository     = ngdb.getRepository('users');
  var picturesRepository  = ngdb.getRepository('pictures');
  
  //Delete all users and pictures data
  usersRepository.delete();
  picturesRepository.delete();
  
});
```

### Data selection
These methods can be chained and must be called before the data operation methods (get, update, ...).
These methods have an influence on the way the data are going to be treated. All of them take an object where the key correspond to the data name previously defined (in the app config step).

#### Order
##### Prototype
```javascript
ngdb setOrder(object order)
```

##### Description
Order your data by something in ascendent ('ASC' keyword) or descendent ('DESC' keyword) order.

__Return__ promise containing an object with the requested data.

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository = ngdb.getRepository('users');

  //Get all users sorted by name in ascendent order
  usersRepository.setOrder({'name': 'ASC'}).get();
  //Get all users sorted by id in descendent order
  usersRepository.setOrder({'id': 'DESC'}).get();
  
});
```

#### Standards
##### Prototype
```javascript
ngdb setBy(object conditions)
```

##### Description
Get, update or delete data according to the equality of the key-value object.

__Return__ promise containing an object with the requested data.

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository = ngdb.getRepository('users');

  //Get all users named 'John'
  usersRepository.setBy({'name': 'John'}).get();
  //Get the user with id equal to 1
  usersRepository.setOrder({'id': 1}).getOne();
  //Get the user named John with id equal to 1
  usersRepository.setBy({'id': 1, 'name': 'John'}).getOne();
  
});
```

#### Limit
##### Prototype
```javascript
ngdb setLimit(int from, int to)
```
Take two integer which represent the interval.

__Return__ promise containing an object with the requested data.

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var usersRepository = ngdb.getRepository('users');

  //Get 0 to 10 first results
  usersRepository.setLimit(0, 10).get();
  //Get 10 to 20 first results
  usersRepository.setLimit(10, 20).get();
  
});
```

### Data binding

_CURRENT WRITING, VERY SOON AVAILABLE_

### Low level usage
#### Native SQLite syntax
##### Prototypes
```javascript
promise query(string query, array bindings)
object fetchAll(object SQLiteResult)
object fetch(object SQLiteResult)
```
##### Description
NGDatabase also allow you to use SQLite as native syntax.
* make() : make an SQL Query 
* fetchAll() : fetch all SQLite Query result 
* fetch() : fetch one SQLite Query result

##### Exemple

```javascript
myApp.controller('myCtrl', function(ngdb) {

  var qm      = ngdb.getQueryMaker();
  var result  = qm.make("SELECT * FROM users WEHRE name = ?", ['John Doe']);
  
  result.then(function(result) {
    result = ngdb.fetchAll(result);
  });
});
```
