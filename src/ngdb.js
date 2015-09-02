angular
	.module('ngDatabase', ['ngCordova'])
	.constant('CONSTANTS', {
		'TYPES': {
			ID: 		'integer primary key',
			STRING: 	'text',
			NUMBER: 	'integer',
			BOOLEAN: 	'boolean',
			OBJECT: 	'text',
			ARRAY: 		'text',
			DATE: 		'datetime'
		}
	})
	.factory('ngdb', ngdb);

ngdb.$inject = ['$q', '$cordovaSQLite', 'CONSTANTS'];

function ngdb($q, $cordovaSQLite, CONSTANTS) {
	var self = this;
	/* PRIVATE VARS */
	var _db = null;
	var _dbSchema = {};
	var _ngdbUtils = new ngdbUtils();
	/* PUBLIC VARS */

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
    	_db = _dbConnexion();

        return (self.createRepositories(dbSchema));
    };

    self.createRepositories = function(dbSchema) {
    	var requests = [];

    	_ngdbUtils._followObject(dbSchema, function(table, tableName) {
            var columns = [];

            _ngdbUtils._followObject(table, function(columnType, columnName) {
            	if (!CONSTANTS.TYPES[columnType]) {
            		_errorHandler("Unable to find '"+ columnType +"' datatype.");
            	}
                columns.push(columnName + ' ' + CONSTANTS.TYPES[columnType]);
            });
            _dbSchema[tableName] = table;
            requests.push(self.query('CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + columns.join(', ') + ')'));
        });

    	return ($q.all(requests));
    };

	/*
	** USER GETTER METHODS
	*/
	self.getRepository = function(repositoryName) {
		var repository = new ngdbRepository(repositoryName, self, _ngdbUtils);

		return (repository);
	};

	/*
	** LOW LEVEL USER METHODS
	*/
	self.getDbSchema = function(repository) {
		return ((repository) ? _dbSchema[repository] : _dbSchema);
	};

	self.query = function(query, bindings) {
        var deferred = $q.defer();
        bindings = (bindings !== undefined && bindings !== null) ? bindings : [];

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
        return ((result.rows.length > 0) ? result.rows.item(0) : null);
    };

	return (self);
}

function ngdbRepository(repository, ngdb, ngdbUtils) {
	var self = this;
	/* VARIABLE ATTRIBUTS */
	var _currentOrder = null;
	var _currentBy = null;
	var _currentLimit = [];
	var _repository = repository;
	var _bindings = [];
	/* FUNCTION ATTRIBUTS */
	var _ngdb = ngdb;
	var _ngdbUtils = ngdbUtils;

	/*
	** PRIVATE METHODS
	*/
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

	var _makeQuery = function(query, bindings) {
		_currentBy = null;
		_currentOrder = null;
		_currentLimit = [];
		_bindings = [];

		return (_ngdb.query(query, bindings));
	};

	/*
	** SETTERS
	*/
	self.setBy = function(by) {
		var by_formated = [];

		_ngdbUtils._followObject(by, function(val, key) {
			by_formated.push(key + " = ?");
			_bindings.push(val);
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
		var query = "SELECT * FROM " + _repository;
		query = _constructSubParams(query);

		return (
			_makeQuery(query, _bindings)
			.then(function(result) {
				var fetched = _ngdb.fetchAll(result);

				fetched.forEach(function(val, index) {
					fetched[index] = _ngdbUtils._transformData(val, _ngdb.getDbSchema(_repository));
				});

				return (fetched);
			})
		);
	};

	self.getOne = function() {
		self.setLimit(0, 1);

		var query = "SELECT * FROM " + _repository;
		query = _constructSubParams(query);

		return (
			_makeQuery(query, _bindings)
			.then(function(result) {
				var fetched = _ngdb.fetch(result);
				fetched = _ngdbUtils._transformData(fetched, _ngdb.getDbSchema(_repository));

				return ((Object.keys(fetched).length) ? fetched : null);
			})
		);
	};

	self.add = function(data) {
		var fields = [];
		var matching = [];
		data = _ngdbUtils._transformData(data, _ngdb.getDbSchema(_repository));

		_ngdbUtils._followObject(data, function(val, key) {
			fields.push(key);
			matching.push("?");
		});
		var query = "INSERT INTO " + _repository + "(" + fields.join(", ") + ") VALUES(" + matching.join(", ") + ")";

		return (
			_makeQuery(query, fields.map(function(val) {
				return (data[val]);
			}))
		);
	};

	self.update = function(data) {
		var values = [];
		var bindings = [];
		data = _ngdbUtils._transformData(data, _ngdb.getDbSchema(_repository));

		_ngdbUtils._followObject(data, function(val, key) {
			values.push(val);
			bindings.push(key + " = ?");
		});
		var query = "UPDATE " + _repository + " SET " + bindings.join(", ");
		query = _constructSubParams(query);

		return (
			_makeQuery(query, values.concat(_bindings))
			.then(function(result) {
				return (result);
			})
		);
	};

	self.delete = function() {
		var query= "DELETE FROM " + _repository;
		query = _constructSubParams(query);

		return (
			_makeQuery(query, _bindings)
			.then(function(result){
				return (result);
			})
		);
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
		var keys = (obj === undefined || obj === null) ? [] : Object.keys(obj);

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