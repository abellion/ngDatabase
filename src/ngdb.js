angular
	.module('ngDatabase', ['ngCordova'])
	.provider('ngdb', ngdbProvider);

function ngdbProvider() {
	var self = this;
	var _db = null;
	var _repositorySchema = {};
	var _repositoryFun = {};
	var _dataTypes = {
		ID: 		'integer primary key',
		STRING: 	'text',
		NUMBER: 	'integer',
		BOOLEAN: 	'boolean',
		OBJECT: 	'text',
		ARRAY: 		'text',
		DATE: 		'datetime'
	};

	self.setRepository = function(repositoryName, repositorySchema) {
		var isValid = true;

		ngdbUtils().browseObject(repositorySchema, function(type, name) {
			isValid = (_dataTypes[type]) ? isValid : false;
		});

		if (isValid) {
			_repositorySchema[repositoryName] = repositorySchema;
		}
		else {
			ngdbUtils().errorHandler("Unable to create '"+repositoryName+"' due to unknown datatype.");
		}

		return (self);
	};

	self.$get = ngdbFactory;
	self.$get.$inject = ['$q', '$cordovaSQLite'];
	function ngdbFactory($q, $cordovaSQLite) {
		var ngdb = {};

		/*
		** PRIVATE METHODS
		*/
		var _dbConnexion = function() {
			var db = null;

			db = (window.cordova) ?
				$cordovaSQLite.openDB('ngdb.db') :
				window.openDatabase('ngdb.db', '1', 'ngdb.db', -1);

	        return (db);
		};

		var _createTables = function() {
			var queries = [];

			ngdbUtils().browseObject(_repositorySchema, function(table, tableName) {
				var columns = [];

	            ngdbUtils().browseObject(table, function(columnType, columnName) {
	                columns.push(columnName + ' ' + _dataTypes[columnType]);
	            });
	            queries.push(ngdb.query('CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + columns.join(', ') + ')'));
			});

			return ($q.all(queries));
		};

		/*
		** PUBLIC METHODS
		*/
		ngdb.createRepositories = function() {
			_db = (!_db) ? _dbConnexion() : _db;

			return (_createTables());
		};

		ngdb.getRepository = function(repositoryName) {
			return (new ngdbRepository($q, ngdb, repositoryName, _repositorySchema[repositoryName]));
		};

		ngdb.query = function(query, bindings) {
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

	    ngdb.fetchAll = function(result) {
	        var output = [];
	        var rows = result.rows.length;

	        for (var i = 0; i < rows; i++) {
	            output.push(result.rows.item(i));
	        }

	        return (output);
	    };

	    ngdb.fetch = function(result) {
	        return ((result.rows.length > 0) ? result.rows.item(0) : null);
	    };

	    ngdb.setRepository = self.setRepository;

		return (ngdb.createRepositories(), ngdb);
	};

	return (self);
}

function ngdbRepository($q, ngdb, repositoryName, repositorySchema) {
	var self = this;

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
				fetched[index] = ngdbUtils().transformData(val, repositorySchema);
			});
			deferred.resolve(fetched);
		}, deferred.reject);

		return (this.resetBuilder(), deferred.promise);
	};

	self.getOne = function() {
		var deferred = $q.defer();
		var query = this.setLimit(0, 1).buildQuery('SELECT');
		var result = ngdb.query(query['query'], query['binds']);

		result.then(function(result) {
			var fetched = ngdbUtils().transformData(ngdb.fetch(result), repositorySchema);

			deferred.resolve((fetched) ? fetched : null);
		}, deferred.reject);

		return (this.resetBuilder(), deferred.promise);
	};

	self.add = function(data) {
		var query = this.buildQuery('INSERT', ngdbUtils().transformData(data, repositorySchema));
		var result = ngdb.query(query['query'], query['binds']);

		return (this.resetBuilder(), result);
	};

	self.update = function(data) {
		var query = this.buildQuery('UPDATE', ngdbUtils().transformData(data, repositorySchema));
		var result = ngdb.query(query['query'], query['binds']);

		return (this.resetBuilder(), result);
	};

	self.delete = function() {
		var query = this.buildQuery('DELETE');
		var result = ngdb.query(query['query'], query['binds']);

		return (this.resetBuilder(), result);
	};

	//angular.extend(self, repositoryFun);
	return (queryBuilder.call(self, repositoryName), self);
}

function queryBuilder(tableName) {
	var self = this;
	/* PRIVATE ATTRIBUTS */
	var _queryParams = {
		'data': {'matching': [], 'binds': []},
		'where': {'matching': [], 'binds': []},
		'order': {'matching': [], 'binds': []},
		'limit': {'matching': []}
	};

	/*
	** BUILD QUERY METHODS
	*/
	var _buildSelectQuery = function() {
		return ("SELECT * FROM " + tableName);
	};

	var _buildUpdateQuery = function() {
		var matching = _queryParams['data']['matching'].map(function(val) {
			return (val + " = ?");
		});

		return ("UPDATE " + tableName + " SET " + matching.join(","));
	};

	var _buildInsertQuery = function() {
		var matching = _queryParams['data']['matching'].map(function(val) {
			return ("?");
		});

		return ("INSERT INTO " + tableName + " (" + _queryParams['data']['matching'].join(",") + ") VALUES (" + matching.join(",") + ")");
	};

	var _buildDeleteQuery = function() {
		return ("DELETE FROM " + tableName);
	};

	/*
	** BUILD PARAMS METHODS
	*/
	var _buildWhereParam = function() {
		var matching = _queryParams['where']['matching'].map(function(val) {
			return (val + " = ?");
		});

		return ("WHERE " + matching.join(" and "));
	};

	var _buildOrderParam = function() {
		return ("ORDER BY " + _queryParams['order']['matching'].join(","));
	};

	var _buildLimitParam = function() {
		return ("LIMIT " + _queryParams['limit']['matching'][0] + "," + _queryParams['limit']['matching'][1]);
	};

	var _buildQueryParams = function() {
		var subParams = [];
		var paramsTemplate = {
			"where": _buildWhereParam,
			"order": _buildOrderParam,
			"limit": _buildLimitParam
		};

		ngdbUtils().browseObject(_queryParams, function(val, key) {
			if (val['matching'].length && key !== "data") {
				subParams.push(paramsTemplate[key].call());
			}
		});

		return (subParams.join(" "));
	};

	/*
	** PROTECTED METHODS
	*/
	self.setData = function(data) {
		ngdbUtils().browseObject(data, function(val, key) {
			_queryParams['data']['matching'].push(key);
			_queryParams['data']['binds'].push(val);
		});
	};

	self.buildQuery = function(queryType, data) {
		var queryTemplate = {
			'SELECT': _buildSelectQuery,
			'UPDATE': _buildUpdateQuery,
			'INSERT': _buildInsertQuery,
			'DELETE': _buildDeleteQuery
		};

		self.setData(data);
		var query = queryTemplate[queryType].call() + " " + _buildQueryParams();
		var queryBinds = [];

		ngdbUtils().browseObject(_queryParams, function(val) {
			if (val['binds'] && val['binds'].length) {
				queryBinds = queryBinds.concat(val['binds']);
			}
		});

		return ({'query': query, 'binds': queryBinds});
	};

	self.resetBuilder = function() {
		_queryParams = {
			'data': {'matching': [], 'binds': []},
			'where': {'matching': [], 'binds': []},
			'order': {'matching': [], 'binds': []},
			'limit': {'matching': []}
		};
	};

	/*
	** SETTERS
	*/
	self.setBy = function(where) {
		ngdbUtils().browseObject(where, function(val, key) {
			_queryParams['where']['matching'].push(key);
			_queryParams['where']['binds'].push(val);
		});

		return (self);
	};

	self.setOrder = function(order) {
		ngdbUtils().browseObject(order, function(val, key) {
			_queryParams['order']['matching'].push(key + " " + val);
		});

		return (self);
	};

	self.setLimit = function(from, to) {
		_queryParams['limit']['matching'][0] = parseInt(from, 10);
		_queryParams['limit']['matching'][1] = parseInt(to, 10);

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
		for (var key in obj) {
			var val = obj[key];

			if (val !== undefined && val !== null) {
				callback(val, key);
			}
		}
	};

	self.transformData = function(data, repositorySchema) {
		var formated = (data) ? {} : null;

		self.browseObject(data, function(fieldValue, fieldName) {
			if (repositorySchema[fieldName]) {
				if (_isObject(fieldValue)) {
					fieldValue = angular.toJson(fieldValue);
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
		throw(new Error("NGDB : " + message, "", ""));
	};

	return (self);
}