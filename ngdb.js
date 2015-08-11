angular
	.module('ngDatabase', ['ngCordova'])
	.factory('ngdb', ngdb);

ngdb.$inject = ['$q', '$cordovaSQLite'];

function ngdb($q, $cordovaSQLite) {
	var self = this;
	var _db = null;
	var _dbSchema = null;
	var _currentTable = null;
	var _currentBy = null;
	var _currentOrder = null;

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

	var _followObject = function(obj, callback) {
		var keys = Object.keys(obj);

		keys.forEach(function(key) {
			var val = obj[key];

			if (val !== undefined && val !== null) {
				callback(val, key);
			}
		});
	};

	var _transformData = function(data) {
		var formated = {};
		var table = _dbSchema[_currentTable];

		_followObject(data, function(fieldValue, fieldName) {
			if (table[fieldName]) {
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

	var _makeQuery = function(query) {
		var deferred = $q.defer();

		self.query(query).then(function(result) {
			deferred.resolve(result);
		}, function(error) {
			deferred.reject(error);
		});

		return (deferred.promise);
	};

	var _resetParams = function() {
		_currentTable = null;
		_currentBy = null;
		_currentOrder = null;
	};

	var _constructSubParams = function(query) {
		var subParams = [
			{"condition": _currentBy, "value": " WHERE " + _currentBy},
			{"condition": _currentOrder, "value": " ORDER BY " + _currentOrder}
		];

		subParams.forEach(function(val) {
			query += (val["condition"]) ? val["value"] : "";
		});

		return (query);
	};

	var _errorHandler = function(message) {
		var test = new Error();

		throw(new Error("NGDB Error : " + message, "", ""));
	};

	var _dbConnexion = function() {
		var db = null;

		if (window.cordova) {
   			db = $cordovaSQLite.openDB('ngdb.db');
        }
        else {
			db = window.openDatabase('ngdb.db', '1', 'ngdb.db', 1024 * 1024 * 100);
        }

        return (db);
	};

	/*
	** USER SETTER METHODS
	*/
	self.setRepo = function(table) {
		_currentTable = table;

		return (self);
	};

	self.setBy = function(by) {
		var by_formated = [];

		_followObject(by, function(val, key) {
			by_formated.push(key + " = '" + val + "'");
		})
		_currentBy = by_formated.join(' and ');

		return (self);
	};

	self.setOrder = function(order) {
		var order_formated = [];

		_followObject(order, function(val, key) {
			order_formated.push(key + " " + val);
		});
		_currentOrder = order_formated.join(', ');

		return (self);
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
        _followObject(_dbSchema, function(table, tableName) {
            var columns = [];

            _followObject(table, function(columnType, columnName) {
            	if (!types[columnType]) {
            		_errorHandler("Unable to find '"+ columnType +"' datatype.");
            	}
                columns.push(columnName + ' ' + types[columnType]);
            });
            self.query('CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + columns.join(', ') + ')');
        });
    };

	/*
	** LOW LEVEL USER METHODS
	*/
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

	/*
	** HIGH LEVEL USER METHODS
	*/
	self.get = function() {
		var query = "SELECT * FROM " + _currentTable;
		query = _constructSubParams(query);

		return (
			_makeQuery(query)
			.then(function(result) {
				var fetched = self.fetchAll(result);

				fetched.forEach(function(val, index) {
					fetched[index] = _transformData(val);
				});

				return (_resetParams(), fetched);
			})
		);
	};

	self.add = function(data) {
		var fields = [];
		var values = [];
		data = _transformData(data);

		_followObject(data, function(val, key) {
			fields.push(key);
			values.push("'" + val + "'");
		});
		var query = "INSERT INTO " + _currentTable + "(" + fields.join(", ") + ") VALUES(" + values.join(", ") + ")";

		return (_resetParams(), _makeQuery(query));
	};

	self.update = function(data) {
		var data_formated = [];
		data = _transformData(data);

		_followObject(data, function(val, key) {
			data_formated.push(key + " = '" + val + "'");
		});
		var query = "UPDATE " + _currentTable + " SET " + data_formated.join(", ");
		query = _constructSubParams(query);

		return (_resetParams(), _makeQuery(query));
	};

	self.delete = function() {
		var query= "DELETE FROM " + _currentTable;
		query = _constructSubParams(query);

		return (_resetParams(), _makeQuery(query));
	};

	return (self);
}