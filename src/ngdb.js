angular
	.module('ngDatabase', ['ngCordova'])
	.factory('ngdb', ngdb)
	.factory('ngdbRepository', ngdbRepository);

ngdb.$inject = ['$q', '$cordovaSQLite', 'ngdbRepository'];
ngdbRepository.$inject = ['$q'];

function ngdb($q, $cordovaSQLite, ngdbRepository) {
	var self = this;
	/* PRIVATE VARS */
	var _db = null;
	var _dbSchema = {};
	var _dataTypes = {
		ID: 		'integer primary key',
		STRING: 	'text',
		NUMBER: 	'integer',
		BOOLEAN: 	'boolean',
		OBJECT: 	'text',
		ARRAY: 		'text',
		DATE: 		'datetime'
	};

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

    	ngdbUtils().browseObject(dbSchema, function(table, tableName) {
            var columns = [];

            ngdbUtils().browseObject(table, function(columnType, columnName) {
            	if (!_dataTypes[columnType]) {
            		_errorHandler("Unable to find '"+ columnType +"' datatype.");
            	}
                columns.push(columnName + ' ' + _dataTypes[columnType]);
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
		return (ngdbRepository.getRepository(self, repositoryName));
	};

	/*
	** LOW LEVEL USER METHODS
	*/
	self.getDbSchema = function(repositoryName) {
		return ((repositoryName && _dbSchema[repositoryName]) ? _dbSchema[repositoryName] : _dbSchema);
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

function ngdbRepository($q, ngdb, repositoryName) {
	var self = this;
	var dbSchema = ngdb && ngdb.getDbSchema();

	/*
	** PROTECTED METHODS
	*/
	self.getRepository = function(ngdb, repositoryName) {
		return (new ngdbRepository($q, ngdb, repositoryName));
	};

	/*
	** USER METHODS
	*/
	self.get = function() {
		var deferred = $q.defer();
		var query = this.buildQuery('SELECT');
		var result = ngdb.query(query['query'], query['binds']);

		result
		.then(function(result) {
			var fetched = ngdb.fetchAll(result);

			fetched.forEach(function(val, index) {
				fetched[index] = ngdbUtils().transformData(val, dbSchema[repositoryName]);
			});
			deferred.resolve(fetched);
		}, deferred.reject);

		return (deferred.promise);
	};

	self.getOne = function() {
		var deferred = $q.defer();
		var query = this.setLimit(0, 1).buildQuery('SELECT');
		var result = ngdb.query(query['query'], query['binds']);

		result.then(function(result) {
			var fetched = ngdbUtils().transformData(ngdb.fetch(result), dbSchema[repositoryName]);

			deferred.resolve((fetched) ? fetched : null);
		}, deferred.reject);

		return (deferred.promise);
	};

	self.add = function(data) {
		var query = this.buildQuery('INSERT', ngdbUtils().transformData(data, dbSchema[repositoryName]));
		var result = ngdb.query(query['query'], query['binds']);

		return (result);
	};

	self.update = function(data) {
		var query = this.buildQuery('UPDATE', ngdbUtils().transformData(data, dbSchema[repositoryName]));
		var result = ngdb.query(query['query'], query['binds']);

		return (result);
	};

	self.delete = function() {
		var query = this.buildQuery('DELETE');
		var result = ngdb.query(query['query'], query['binds']);

		return (result);
	};

	return (queryBuilder.call(self, true, repositoryName), self);
}

function queryBuilder(isNewBuilder, repositoryName) {
	var self = this;
	/* PRIVATE ATTRIBUTS */
	var _queryConditions = {
		'where': {'matching': [], 'binds': []},
		'order': {'matching': [], 'binds': []},
		'limit': {'matching': [], 'binds': []}
	};
	var _querySpec = {
		'data': {'matching': [], 'binds': []},
		'table': repositoryName
	};

	/*
	** PRIVATE METHODS
	*/
	var _getNewInstance = function() {
		var instance = new queryBuilder(false, repositoryName);
		instance.__proto__ = self;

		return (instance);
	};

	var _buildSelectQuery = function() {
		return ("SELECT * FROM " + _querySpec['table']);
	};

	var _buildUpdateQuery = function() {
		var matching = _querySpec['data']['matching'].map(function(val) {
			return (val + " = ?");
		});

		return ("UPDATE " + _querySpec['table'] + " SET " + matching.join(","));
	};

	var _buildInsertQuery = function() {
		var matching = _querySpec['data']['matching'].map(function(val) {
			return ("?");
		});

		return ("INSERT INTO " + _querySpec['table'] + " (" + _querySpec['data']['matching'].join(",") + ") VALUES (" + matching.join(",") + ")");
	};

	var _buildDeleteQuery = function() {
		return ("DELETE FROM " + _querySpec['table']);
	};

	var _buildWhereCondition = function() {
		var matching = _queryConditions['where']['matching'].map(function(val) {
			return (val + " = ?");
		});

		return ("WHERE " + matching.join(" and "));
	};

	var _buildOrderCondition = function() {
		return ("ORDER BY " + _queryConditions['order']['matching'].join(","));
	};

	var _buildLimitCondition = function() {
		return ("LIMIT " + _queryConditions['limit']['matching'][0] + "," + _queryConditions['limit']['matching'][1]);
	};

	var _buildSubParam = function() {
		var paramsTemplate = {
			"where": _buildWhereCondition,
			"order": _buildOrderCondition,
			"limit": _buildLimitCondition
		};
		var subParams = [];

		ngdbUtils().browseObject(_queryConditions, function(val, key) {
			if (val['matching'].length) {
				subParams.push(paramsTemplate[key].call());
			}
		});

		return (subParams.join(" "));
	};

	/*
	** PROTECTED METHODS
	*/
	self.setData = function(data) {
		if (isNewBuilder) {
			return (_getNewInstance().setData(data));
		}
		ngdbUtils().browseObject(data, function(val, key) {
			_querySpec['data']['matching'].push(key);
			_querySpec['data']['binds'].push(val);
		});
	};

	self.buildQuery = function(queryType, data) {
		if (isNewBuilder) {
			return (_getNewInstance().buildQuery(queryType, data));
		}
		var queryTemplate = {
			'SELECT': _buildSelectQuery,
			'UPDATE': _buildUpdateQuery,
			'INSERT': _buildInsertQuery,
			'DELETE': _buildDeleteQuery
		};

		self.setData(data);
		var query = queryTemplate[queryType].call() + " " + _buildSubParam();
		var queryConditionsBinds = [];
		var querySpecBinds = _querySpec['data']['binds'];

		ngdbUtils().browseObject(_queryConditions, function(val) {
			queryConditionsBinds = queryConditionsBinds.concat(val['binds']);
		});

		return ({'query': query, 'binds': querySpecBinds.concat(queryConditionsBinds)});
	};

	/*
	** SETTERS
	*/
	self.setBy = function(where) {
		if (isNewBuilder) {
			return (_getNewInstance().setBy(where));
		}
		ngdbUtils().browseObject(where, function(val, key) {
			_queryConditions['where']['matching'].push(key);
			_queryConditions['where']['binds'].push(val);
		});

		return (self);
	};

	self.setOrder = function(order) {
		if (isNewBuilder) {
			return (_getNewInstance().setOrder(order));
		}
		ngdbUtils().browseObject(order, function(val, key) {
			_queryConditions['order']['matching'].push(key + " " + val);
		});

		return (self);
	};

	self.setLimit = function(from, to) {
		if (isNewBuilder) {
			return (_getNewInstance().setLimit(from, to));
		}
		_queryConditions['limit']['matching'][0] = parseInt(from, 10);
		_queryConditions['limit']['matching'][1] = parseInt(to, 10);

		return (self);
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
	self.browseObject = function(obj, callback) {
		var keys = (obj === undefined || obj === null) ? [] : Object.keys(obj);

		keys.forEach(function(key) {
			var val = obj[key];

			if (val !== undefined && val !== null) {
				callback(val, key);
			}
		});
	};

	self.transformData = function(data, repoSchema) {
		var formated = (data) ? {} : null;

		self.browseObject(data, function(fieldValue, fieldName) {
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

	self.errorHandler = function(message) {
		throw(new Error("NGDB Error : " + message, "", ""));
	};

	return (self);
}