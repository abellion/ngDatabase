angular
	.module('ngDatabase', ['ngCordova'])
	.constant('NGDB_TYPES', {
		ID: 		'integer primary key',
		STRING: 	'text',
		NUMBER: 	'integer',
		BOOLEAN: 	'boolean',
		OBJECT: 	'text',
		ARRAY: 		'text',
		DATE: 		'datetime'
	});

angular
	.module('ngDatabase')
	.provider('ngdb', ngdbProvider);

ngdbProvider.$inject = ['NGDB_TYPES'];
function ngdbProvider(NGDB_TYPES) {
	var self 				= this;
	self.repositorySchema 	= {};

	self.setRepository = function(repositoryName, repositorySchema) {
		var isValid = true;

		ngdbUtils().browseObject(repositorySchema, function(type, name) {
			isValid = (NGDB_TYPES[type]) ? isValid : false;
		});

		if (isValid) {
			self.repositorySchema[repositoryName] = repositorySchema;
		}
		else {
			ngdbUtils().errorHandler("Unable to create '"+repositoryName+"' due to unknown datatype.");
		}

		return (self);
	};

	self.$get = ngdbFactory;

	return (self);
}

ngdbFactory.$inject = ['$q', 'ngdbUtils', 'ngdbQuery', 'ngdbRepository', 'NGDB_TYPES'];
function ngdbFactory($q, ngdbUtils, ngdbQuery, ngdbRepository, NGDB_TYPES) {
	var self 		= this;
	var ngdb 		= {};

	ngdb.createRepositories = function() {
		var queries = [];
		var schema 	= self.repositorySchema;

		ngdbUtils.browseObject(schema, function(table, tableName) {
			var columns = [];

            ngdbUtils.browseObject(table, function(columnType, columnName) {
                columns.push(columnName + ' ' + NGDB_TYPES[columnType]);
            });
            queries.push(ngdbQuery.make('CREATE TABLE IF NOT EXISTS ' + tableName + ' (' + columns.join(', ') + ')'));
		});

		return ($q.all(queries));
	};

	ngdb.getRepository = function(repositoryName) {
		var repository 			= ngdbRepository.ngdbRepositoryGetNew();
		var repositorySchema 	= self.repositorySchema[repositoryName];

		repository.ngdbRepositorySetRepository(repositoryName, repositorySchema);

		return (repository);
	};

	return (ngdb.createRepositories(), ngdb);
};
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
angular
	.module('ngDatabase')
	.service('ngdbRepository', ngdbRepository);

ngdbRepository.$inject = ['$q', 'ngdbUtils', 'ngdbQuery', 'ngdbBuilder', 'ngdbDataBinding'];
function ngdbRepository($q, ngdbUtils, ngdbQuery, ngdbBuilder, ngdbDataBinding) {
	var self 				= this;
	var _dataBinding 		= false;
	var _repositoryName 	= null;
	var _repositorySchema 	= null;

	/*
	** UTILS METHODS
	*/
	self.ngdbRepositoryGetNew = function() {
		return (new ngdbRepository($q, ngdbUtils, ngdbQuery, ngdbBuilder.ngdbBuilderGetNew(), ngdbDataBinding));
	};

	self.ngdbRepositorySetRepository = function(repositoryName, repositorySchema) {
		_repositoryName 	= repositoryName;
		_repositorySchema 	= repositorySchema;

		ngdbBuilder.ngdbBuilderSetRepository(repositoryName);

		return (self);
	};

	self.setDataBinding = function(val) {
		_dataBinding = (val === true);

		return(self);
	};

	var _formatGet = function(result) {
		var fetched = ngdbQuery.fetchAll(result);

		fetched && fetched.forEach(function(val, index) {
			fetched[index] = ngdbUtils.transformData(val, _repositorySchema);
		});

		return (fetched);
	};

	var _formatGetOne = function(result) {
		var fetched = ngdbUtils.transformData(ngdbQuery.fetch(result), _repositorySchema);

		return ((fetched) ? fetched : null);
	};

	var _dataBindingBind = function(query, dataFormater, watcher) {
		if (_dataBinding) {
			ngdbDataBinding.bind(_repositoryName, query, dataFormater, watcher);
		}
	};

	var _dataBindingUpdate = function(promise) {
		promise.then(function() {
			ngdbDataBinding.update(_repositoryName);
		});
	};

	/*
	** USER METHODS
	*/
	self.get = function() {
		var deferred 	= $q.defer();
		var query 		= this.buildQuery('SELECT');
		var result 		= ngdbQuery.make(query['query'], query['binds']);

		result.then(function(result) {
			var ret = _formatGet(result);

			deferred.resolve(ret);
			_dataBindingBind(query, _formatGet, ret);
		}, deferred.reject);

		return (this.resetBuilder(), deferred.promise);
	};

	self.getOne = function() {
		var deferred 	= $q.defer();
		var query 		= this.setLimit(0, 1).buildQuery('SELECT');
		var result 		= ngdbQuery.make(query['query'], query['binds']);

		result.then(function(result) {
			var ret = _formatGetOne(result);

			deferred.resolve(ret);
			_dataBindingBind(query, _formatGetOne, ret);
		}, deferred.reject);

		return (this.resetBuilder(), deferred.promise);
	};

	self.add = function(data) {
		var query 	= this.buildQuery('INSERT', ngdbUtils.transformData(data, _repositorySchema));
		var result 	= ngdbQuery.make(query['query'], query['binds']);

		_dataBindingUpdate(result);
		return (this.resetBuilder(), result);
	};

	self.update = function(data) {
		var query 	= this.buildQuery('UPDATE', ngdbUtils.transformData(data, _repositorySchema));
		var result 	= ngdbQuery.make(query['query'], query['binds']);

		_dataBindingUpdate(result);
		return (this.resetBuilder(), result);
	};

	self.delete = function() {
		var query 	= this.buildQuery('DELETE');
		var result 	= ngdbQuery.make(query['query'], query['binds']);

		_dataBindingUpdate(result);
		return (this.resetBuilder(), result);
	};

	angular.extend(self, ngdbBuilder);

	return (self);
}
angular
	.module('ngDatabase')
	.factory('ngdbDataBinding', ngdbDataBinding);

ngdbDataBinding.$inject = ['ngdbQuery', 'ngdbUtils'];
function ngdbDataBinding(ngdbQuery, ngdbUtils) {
	var self 		= this;
	var _watchers 	= {};

	/*
	** UTILS METHODS
	*/
	var _mergeArray = function(dst, src) {
		src && src.forEach(function(val, key) {
			dst[key] = src[key];
		});
		dst && dst.forEach(function(val, key) {
			if (!src[key]) {
				dst.pop();
			}
		});

		return (dst);
	};

	var _mergeObject = function(dst, src) {
		src && ngdbUtils.browseObject(src, function(val, key) {
			dst[key] = val;
		});
		dst && ngdbUtils.browseObject(dst, function(val, key) {
			if (!src || !src[key]) {
				delete dst[key];
			}
		});

		return (dst);
	};

	var _mergeData = function(dst, src) {
		if (src instanceof Array) {
			return (_mergeArray(dst, src));
		}
		else if (src instanceof Object) {
			return (_mergeObject(dst, src));
		}

		return (_mergeObject(dst, src));
	};

	/*
	** USER METHODS
	*/
	self.bind = function(repositoryName, query, dataFormater, watcher) {
		if (!repositoryName || !query || !dataFormater || !watcher) {
			return (0);
		}
		_watchers[repositoryName] = (_watchers[repositoryName]) ? _watchers[repositoryName] : [];

		_watchers[repositoryName].push({
			'query': 		query,
			'dataFormater': dataFormater,
			'watcher': 		watcher
		});
	};

	self.update = function(repositoryName) {
		var watchers = _watchers[repositoryName];

		watchers && watchers.forEach(function(watcher) {
			var query = ngdbQuery.make(watcher['query']['query'], watcher['query']['binds']);

			query.then(function(result) {
				var ret = watcher['dataFormater'].call(null, result);

				_mergeData(watcher['watcher'], ret);
			});
		});
	};

	return (self);
}
angular
	.module('ngDatabase')
	.service('ngdbBuilder', ngdbBuilder);

ngdbBuilder.$inject = ['ngdbUtils'];
function ngdbBuilder(ngdbUtils) {
	var self = this;
	/* PRIVATE ATTRIBUTS */
	var _queryParams = {
		'data': {'matching': [], 'binds': []},
		'where': {'matching': [], 'binds': []},
		'order': {'matching': [], 'binds': []},
		'limit': {'matching': []},
		'table': null
	};

	/*
	** BUILD QUERY METHODS
	*/
	var _buildSelectQuery = function() {
		return ("SELECT * FROM " + _queryParams['table']);
	};

	var _buildUpdateQuery = function() {
		var matching = _queryParams['data']['matching'].map(function(val) {
			return (val + " = ?");
		});

		return ("UPDATE " + _queryParams['table'] + " SET " + matching.join(","));
	};

	var _buildInsertQuery = function() {
		var matching = _queryParams['data']['matching'].map(function(val) {
			return ("?");
		});

		return ("INSERT INTO " + _queryParams['table'] + " (" + _queryParams['data']['matching'].join(",") + ") VALUES (" + matching.join(",") + ")");
	};

	var _buildDeleteQuery = function() {
		return ("DELETE FROM " + _queryParams['table']);
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

		ngdbUtils.browseObject(_queryParams, function(val, key) {
			if (val['matching'] && val['matching'].length && key !== "data") {
				subParams.push(paramsTemplate[key].call());
			}
		});

		return (subParams.join(" "));
	};

	/*
	** PROTECTED METHODS
	*/
	self.ngdbBuilderSetRepository = function(repositoryName) {
		_queryParams['table'] = repositoryName;

		return (this);
	};

	self.ngdbBuilderGetNew = function() {
		return (new ngdbBuilder(ngdbUtils));
	};

	self.setData = function(data) {
		ngdbUtils.browseObject(data, function(val, key) {
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

		ngdbUtils.browseObject(_queryParams, function(val) {
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
			'limit': {'matching': []},
			'table': _queryParams['table']
		};
	};

	/*
	** SETTERS
	*/
	self.setBy = function(where) {
		ngdbUtils.browseObject(where, function(val, key) {
			_queryParams['where']['matching'].push(key);
			_queryParams['where']['binds'].push(val);
		});

		return (this);
	};

	self.setOrder = function(order) {
		ngdbUtils.browseObject(order, function(val, key) {
			_queryParams['order']['matching'].push(key + " " + val);
		});

		return (this);
	};

	self.setLimit = function(from, to) {
		_queryParams['limit']['matching'][0] = parseInt(from, 10);
		_queryParams['limit']['matching'][1] = parseInt(to, 10);

		return (this);
	};

	return (self);
}
angular
	.module('ngDatabase')
	.factory('ngdbUtils', ngdbUtils);

ngdbUtils.$inject = [];
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
			if (repositorySchema && repositorySchema[fieldName] || !repositorySchema) {
				if (_isObject(fieldValue)) {
					fieldValue = angular.toJson(fieldValue);
				}
				else if (_isJson(fieldValue)) {
					fieldValue = angular.fromJson(fieldValue);
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