angular
	.module('ngDatabase')
	.factory('ngdbQuery', ngdbQuery);

ngdbQuery.$inject = ['$q', '$cordovaSQLite'];
function ngdbQuery($q, $cordovaSQLite) {
	var self 	= this;
	var _db 	= null;

	var _dbConnexion = function() {

		_db = (window.cordova) ?
			$cordovaSQLite.openDB('ngdb.db') :
			window.openDatabase('ngdb.db', '1', 'ngdb.db', -1);

		return (_db);
	};


	self.make = function(query, bindings) {
        var deferred 	= $q.defer();
        bindings	 	= (bindings !== undefined && bindings !== null) ? bindings : [];

		_db.transaction(function(transaction) {
            transaction.executeSql(query, bindings, function(transaction, result) {
                deferred.resolve(result);
            }, function(transaction, error) {
                deferred.reject(error);
            });
        });

        return (deferred.promise);
	};

    self.fetchAll = function(result) {
        var output 	= [];
        var rows 	= result.rows.length;

        for (var i = 0; i < rows; i++) {
            output.push(result.rows.item(i));
        }

        return (output);
    };

    self.fetch = function(result) {
        return ((result.rows.length > 0) ? result.rows.item(0) : null);
    };

    return (_dbConnexion(), self);
}