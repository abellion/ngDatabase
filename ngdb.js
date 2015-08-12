angular
	.module('ngDatabase', ['ngCordova'])
	.factory('ngdb', ngdb);

ngdb.$inject = ['$q', '$cordovaSQLite'];

function ngdb($q, $cordovaSQLite) {
	var self = this;
	var _db = null;
	var _dbSchema = null;
	var _ngdbUtils = new ngdbUtils();

	/*
	** PRIVATE METHODS
	*/
	var _dbConnexion = function() {
		var db = null;

		if (window.cordova) {
   			db = $cordovaSQLite.openDB('ngdb.db');
        }
        else {
			db = window.openDatabase('ngdb.db', '1', 'ngdb.db', -1);
        }

        return (db);
	};

	/*
	** INIT USER METHOD
	*/
    self.init = function(dbSchema) {
    	var types = {
    		ID: 		'integer primary key',
    		STRING: 	'text',
    		NUMBER: 	'integer',
    		BOOLEAN: 	'boolean',
    		OBJECT: 	'text',
    		ARRAY: 		'text',
    		DATE: 		'datetime'
    	};

    	_dbSchema = dbSchema;
    	_db = _dbConnexion();
        _ngdbUtils._followObject(_dbSchema, function(table, tableName) {
            var columns = [];

            _ngdbUtils._followObject(table, function(columnType, columnName) {
            	if (!types[columnType]) {
            		_errorHandler("Unable to find '"+ columnType +"' datatype.");
            	}
                columns.push(columnName + ' ' + types[columnType]);
            });
            self.query('CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + columns.join(', ') + ')');
        });
    };

	/*
	** USER GETTER METHODS
	*/
	self.getRepository = function(repositoryName) {
		var repository = new ngdbRepository(repositoryName, self);

		return (repository);
	};

	/*
	** LOW LEVEL USER METHODS
	*/
	self.getDbSchema = function() {
		return (_dbSchema);
	};

	self.query = function(query, bindings) {
        var deferred = $q.defer();
        bindings = (typeof bindings !== 'undefined') ? bindings : [];

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
        var output = [];
        var rows = result.rows.length;

        for (var i = 0; i < rows; i++) {
            output.push(result.rows.item(i));
        }
        return (output);
    };

    self.fetch = function(result) {
        return (result.rows.item(0));
    };

	return (self);
}

function ngdbRepository(repository, ngdb) {
	var self = this;
	/* VARIABLE ATTRIBUTS */
	var _currentRepo = repository;
	var _currentOrder = null;
	var _currentBy = null;
	var _currentLimit = [];
	/* FUNCTION ATTRIBUTS */
	var _ngdb = ngdb;
	var _ngdbUtils = new ngdbUtils();

	/*
	** PRIVATE METHODS
	*/
	var _resetParams = function() {
		_currentBy = null;
		_currentOrder = null;
		_currentLimit = [];
	};

	var _constructSubParams = function(query) {
		var subParams = [
			{"condition": _currentBy, "value": " WHERE " + _currentBy},
			{"condition": _currentOrder, "value": " ORDER BY " + _currentOrder},
			{"condition": _currentLimit.length, "value": " LIMIT " + _currentLimit[0] + ", " + _currentLimit[1]}
		];

		subParams.forEach(function(val) {
			query += (val["condition"]) ? val["value"] : "";
		});

		return (query);
	};

	/*
	** SETTERS
	*/
	self.setBy = function(by) {
		var by_formated = [];

		_ngdbUtils._followObject(by, function(val, key) {
			by_formated.push(key + " = '" + val + "'");
		})
		_currentBy = by_formated.join(' and ');

		return (self);
	};

	self.setOrder = function(order) {
		var order_formated = [];

		_ngdbUtils._followObject(order, function(val, key) {
			order_formated.push(key + " " + val);
		});
		_currentOrder = order_formated.join(', ');

		return (self);
	};

	self.setLimit = function(from, to) {
		_currentLimit[0] = parseInt(from, 10);
		_currentLimit[1] = parseInt(to, 10);

		return (self);
	};

	/*
	** DB TRANSACTIONS
	*/
	self.get = function() {
		var query = "SELECT * FROM " + _currentRepo;
		query = _constructSubParams(query);

		return (
			_ngdb.query(query)
			.then(function(result) {
				var fetched = _ngdb.fetchAll(result);

				fetched.forEach(function(val, index) {
					fetched[index] = _ngdbUtils._transformData(val, _ngdb.getDbSchema()[_currentRepo]);
				});

				return (_resetParams(), fetched);
			})
		);
	};

	self.getOne = function() {
		var query = "SELECT * FROM " + _currentRepo;
		query = _constructSubParams(query);

		return (
			_ngdb.query(query)
			.then(function(result) {
				var fetched = _ngdb.fetch(result);
				fetched = _ngdbUtils._transformData(fetched, _ngdb.getDbSchema()[_currentRepo]);

				return (_resetParams(), fetched);
			})
		);
	};

	self.add = function(data) {
		var fields = [];
		var values = [];
		data = _ngdbUtils._transformData(data, _ngdb.getDbSchema()[_currentRepo]);

		_ngdbUtils._followObject(data, function(val, key) {
			fields.push(key);
			values.push("'" + val + "'");
		});
		var query = "INSERT INTO " + _currentRepo + "(" + fields.join(", ") + ") VALUES(" + values.join(", ") + ")";

		return (_resetParams(), _ngdb.query(query));
	};

	self.update = function(data) {
		var data_formated = [];
		data = _ngdbUtils._transformData(data, _ngdb.getDbSchema()[_currentRepo]);

		_ngdbUtils._followObject(data, function(val, key) {
			data_formated.push(key + " = '" + val + "'");
		});
		var query = "UPDATE " + _currentRepo + " SET " + data_formated.join(", ");
		query = _constructSubParams(query);

		return (_resetParams(), _ngdb.query(query));
	};

	self.delete = function() {
		var query= "DELETE FROM " + _currentRepo;
		query = _constructSubParams(query);

		return (_resetParams(), _ngdb.query(query));
	};
}

function ngdbUtils() {
	var self = this;

	/*
	** PRIVATE METHODS
	*/
	var _isObject = function(obj) {
		return (typeof obj === "object")
	};

	var _isJson = function(json) {
		try {
			JSON.parse(json);
		} catch(e) {
			return (false);
		}

		return (true);
	};

	/*
	** PROTECTED METHODS
	*/
	self._followObject = function(obj, callback) {
		var keys = Object.keys(obj);

		keys.forEach(function(key) {
			var val = obj[key];

			if (val !== undefined && val !== null) {
				callback(val, key);
			}
		});
	};

	self._transformData = function(data, repoSchema) {
		var formated = {};

		self._followObject(data, function(fieldValue, fieldName) {
			if (repoSchema[fieldName]) {
				if (_isObject(fieldValue)) {
					fieldValue = JSON.stringify(fieldValue);
				}
				else if (_isJson(fieldValue)) {
					fieldValue = JSON.parse(fieldValue);
				}
				formated[fieldName] = fieldValue;
			}
		});

		return (formated);
	};

	self._errorHandler = function(message) {
		throw(new Error("NGDB Error : " + message, "", ""));
	};
}