angular
	.module('ngDatabase', ['ngCordova'])
	.constant('NGDB_TYPES', {
		ID: 		'integer',
		STRING: 	'text',
		NUMBER: 	'integer',
		BOOLEAN: 	'text',
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
	self.repositoriesSchema = {};

	var _validRepository = function(repositorySchema) {
		var isValid = true;

		ngdbUtils().browseObject(repositorySchema, function(type, name) {
			isValid = (NGDB_TYPES[type]) ? isValid : false;
		});

		return (isValid)
	};

	self.setRepository = function(repositoryName, repositorySchema) {
		if (_validRepository(repositorySchema)) {
			repositorySchema['id'] = 'ID';

			self.repositoriesSchema[repositoryName] = repositorySchema;
		}
		else {
			ngdbUtils().errorHandler("Unable to create '"+repositoryName+"' due to unknown datatype.");
		}

		return (self);
	};

	self.$get = ngdbFactory;

	return (self);
}

ngdbFactory.$inject = ['$q', '$injector', 'ngdbUtils', 'ngdbQuery', 'ngdbCache', 'NGDB_TYPES'];
function ngdbFactory($q, $injector, ngdbUtils, ngdbQuery, ngdbCache, NGDB_TYPES) {
	var self 		= this;
	var ngdb 		= {};

	/*
	** REPOSITORIES
	*/
	var _formatRepository = function(repositorySchema) {
		var ret = {};

        ngdbUtils.browseObject(repositorySchema, function(columnType, columnName) {
        	ret[columnName] = (columnName !== "id") ? NGDB_TYPES[columnType] : 'integer primary key';
        });

		return (ret);
	};

	ngdb.createRepositories = function() {
		var queries = [];
		var schema 	= self.repositoriesSchema;

		ngdbUtils.browseObject(schema, function(table, tableName) {
			var columns = [];
			table 		= _formatRepository(table);

            ngdbUtils.browseObject(table, function(columnType, columnName) {
                columns.push('`' + columnName + '` ' + columnType);
            });

            queries.push(ngdbQuery.make('CREATE TABLE IF NOT EXISTS `' + tableName + '` (' + columns.join(', ') + ')'));
		});

		return ($q.all(queries));
	};

	ngdb.getRepository = function(repositoryName, binding) {
		var repository 			= $injector.instantiate(ngdbRepository, { 'ngdbQueryBuilder': $injector.instantiate(ngdbQueryBuilder) });
		var repositorySchema 	= ngdb.getRepositorySchema(repositoryName);

		repository.ngdbRepositorySetRepository(repositoryName, repositorySchema, binding);

		return (repository);
	};

	ngdb.getRepositorySchema = function(repositoryName) {
		return (self.repositoriesSchema[repositoryName] || null);
	};

	ngdb.getQueryMaker = function() {
		return (ngdbQuery);
	};

	/*
	** WATCHERS
	*/
	ngdb.putWatcher = function(value, callback, call) {
		var watcherId = ngdbCache.putWatcher(value, callback);

		if (call === true || typeof call === "undefined") {
			ngdbCache.callWatcher(value, value);
		}

		return (watcherId);
	};

	ngdb.popWatcher = function(watcherId) {
		return (ngdbCache.popWatcher(watcherId));
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

ngdbRepository.$inject = ['$q', '$injector', 'ngdbUtils', 'ngdbQuery', 'ngdbQueryBuilder', 'ngdbCache', 'ngdbDataConverter'];
function ngdbRepository($q, $injector, ngdbUtils, ngdbQuery, ngdbQueryBuilder, ngdbCache, ngdbDataConverter) {
	var self 				= this;
	var _binding 			= true;
	var _repositoryName 	= null;
	var _repositorySchema 	= null;

	/*
	** UTILS METHODS
	*/
	self.ngdbRepositorySetRepository = function(repositoryName, repositorySchema, binding) {
		_repositoryName 	= repositoryName;
		_repositorySchema 	= repositorySchema;
		_binding 			= (binding === false) ? false : true;

		ngdbQueryBuilder.ngdbQueryBuilderSetRepository(repositoryName);

		return (self);
	};

	var _formatGet = function(result) {
		var fetched = ngdbQuery.fetchAll(result);

		fetched && fetched.forEach(function(val, index) {
			fetched[index] = ngdbDataConverter.convertDataToGet(val, _repositorySchema);
		});

		return (fetched);
	};

	var _formatGetOne = function(result) {
		var fetched = ngdbDataConverter.convertDataToGet(ngdbQuery.fetch(result), _repositorySchema);

		return ((fetched) ? fetched : null);
	};

	var _updateCache = function(promise) {
		if (!_binding) {
			return (0);
		}

		promise.then(function() {
			ngdbCache.updateCache(_repositoryName);
		});
	};

	/*
	** USER METHODS
	*/
	self.get = function() {
		var deferred 	= $q.defer();
		var query 		= this.buildQuery('SELECT');
		var cache 		= ngdbCache.getCache(_repositoryName, query, _formatGet);

		if (cache === false) {
			var result = ngdbQuery.make(query['query'], query['binds']);

			result.then(function(result) {
				var formated = _formatGet(result);

				deferred.resolve(formated);
				ngdbCache.putCache(_repositoryName, query, _formatGet, formated);
			}, deferred.reject);
		}
		else {
			deferred.resolve(cache);
		}

		return (this.resetBuilder(), deferred.promise);
	};

	self.getOne = function() {
		var deferred 	= $q.defer();
		var query 		= this.setLimit(0, 1).buildQuery('SELECT');
		var cache 		= ngdbCache.getCache(_repositoryName, query, _formatGetOne);

		if (cache === false) {
			var result = ngdbQuery.make(query['query'], query['binds']);

			result.then(function(result) {
				var formated = _formatGetOne(result);

				deferred.resolve(formated);
				ngdbCache.putCache(_repositoryName, query, _formatGetOne, formated);
			}, deferred.reject);
		}
		else {
			deferred.resolve(cache);
		}

		return (this.resetBuilder(), deferred.promise);
	};

	self.add = function(data) {
		data 		= ngdbDataConverter.convertDataToAdd(data, _repositorySchema);
		var query 	= this.buildQuery('INSERT', data);
		var result 	= ngdbQuery.make(query['query'], query['binds']);

		_updateCache(result);
		return (this.resetBuilder(), result);
	};

	self.update = function(data) {
		data 		= ngdbDataConverter.convertDataToAdd(data, _repositorySchema);
		var query 	= this.buildQuery('UPDATE', data);
		var result 	= ngdbQuery.make(query['query'], query['binds']);

		_updateCache(result);
		return (this.resetBuilder(), result);
	};

	self.delete = function() {
		var query 	= this.buildQuery('DELETE');
		var result 	= ngdbQuery.make(query['query'], query['binds']);

		_updateCache(result);
		return (this.resetBuilder(), result);
	};

	angular.extend(self, ngdbQueryBuilder);

	return (self);
}
angular
	.module('ngDatabase')
	.factory('ngdbCache', ngdbCache);

ngdbCache.$inject = ['ngdbQuery', 'ngdbUtils'];
function ngdbCache(ngdbQuery, ngdbUtils) {
	var self 		= this;
	var _cache 		= {};
	var _watchers 	= [];

	/*
	** CACHE UTILS METHODS
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
	** WATCH UTILS METHODS
	*/
	var _getWatcher = function(value) {
		var ret = false;

		_watchers.some(function(watcher) {
			return (watcher['value'] === value && (ret = watcher));
		});

		return ((ret === false) ? false : ret);
	};

	/*
	** CACHE METHODS
	*/
	self.getCache = function(repositoryName, query, dataFormater) {
		var repositoryCache 	= _cache[repositoryName];
		var tmpDataFormater 	= dataFormater.toString();
		var tmpQuery 			= JSON.stringify(query);
		var ret 				= false;

		repositoryCache && repositoryCache.some(function(bind) {
			var bindDataFormater 	= bind['dataFormater'].toString();
			var bindQuery 			= JSON.stringify(bind['query']);

			return (bindQuery === tmpQuery && bindDataFormater === tmpDataFormater && (ret = bind));
		});

		return ((ret === false) ? false : ret['value']);
	};

	self.putCache = function(repositoryName, query, dataFormater, value) {
		if (!repositoryName || !query || !dataFormater || !value) {
			return (0);
		}
		_cache[repositoryName] = (_cache[repositoryName]) ? _cache[repositoryName] : [];

		_cache[repositoryName].push({
			'query': 		query,
			'value': 		value,
			'dataFormater': dataFormater
		});
	};

	self.updateCache = function(repositoryName) {
		var repositoryCache = _cache[repositoryName];

		repositoryCache && repositoryCache.forEach(function(bind) {
			var query = ngdbQuery.make(bind['query']['query'], bind['query']['binds']);

			query.then(function(result) {
				var newValue = bind['dataFormater'].call(null, result);
				var oldValue = angular.copy(bind['value']);

				if (!angular.equals(newValue, oldValue)) {
					_mergeData(bind['value'], newValue);
					self.callWatcher(bind['value'], oldValue);
				}
			});
		});
	};

	/*
	** WATCH METHODS
	*/
	self.putWatcher = function(value, callback) {
		var watcher 	= _getWatcher(value);
		this.watcherId 	= this.watcherId || 0;

		if (watcher) {
			watcher['callbacks'].push({
				'id': 		++this.watcherId,
				'callback': callback
			});

			return (this.watcherId);
		}
		else {
			_watchers.push({
				'value': 		value,
				'callbacks': 	[]
			});

			return (self.putWatcher(value, callback));
		}

		return (0);
	};

	self.popWatcher = function(watcherId) {
		var ret = false;

		_watchers.some(function(watcher, index) {
			var tmp = watcher['callbacks'].some(function(callback, index) {
				return (callback['id'] === watcherId && (ret = index));
			});

			return (tmp && delete _watchers[index]['callbacks'][ret]);
		});

		return (!(ret === false));
	};

	self.callWatcher = function(newValue, oldValue) {
		var watcher = _getWatcher(newValue);

		if (watcher) {
			watcher['callbacks'].forEach(function(callback) {
				callback['callback'](newValue, oldValue);
			});
		}
	};

	return (self);
}
angular
	.module('ngDatabase')
	.factory('ngdbDataConverter', ngdbDataConverter);

ngdbDataConverter.$inject = ['ngdbUtils'];
function ngdbDataConverter(ngdbUtils) {
	var self 			= this;

	/*
	** PRIVATE METHODS
	*/
	var _isJson = function(val) {
		var ret = null;

		try {
			ret = angular.fromJson(val);
		} catch(e) {
			return (false);
		}

		return (ret);
	};

	var _convertObjectToAdd = function(val) {
		return (angular.isObject(val) && Object.keys(val).length && angular.toJson(val) || undefined);
	};
	var _convertArrayToAdd = function(val) {
		return (angular.isObject(val) && val.length && angular.toJson(val) || undefined);
	};
	var _convertObjectToGet = function(val) {
		return (_isJson(val) || undefined);
	};

	var _convertDateToAdd = function(val) {
		return (val instanceof Date && val.getTime() || undefined);
	};
	var _convertDateToGet = function(val) {
		return (isFinite(val) && new Date(val) || undefined);
	};

	var _convertNumberToAdd = function(val) {
		return (isFinite(val) && parseInt(val, 10) || undefined);
	};
	var _convertNumberToGet = function(val) {
		return (isFinite(val) && parseInt(val, 10) || undefined);
	};

	var _convertBoolToAdd = function(val) {
		return ((val === true || val === false) ? val.toString() : undefined);
	};
	var _convertBoolToGet = function(val) {
		return ((val === "true") ? true : false);
	};

	var _convertDataToAdd = function(data, dataType) {
		var converter = {
			'OBJECT': 	_convertObjectToAdd,
			'ARRAY': 	_convertArrayToAdd,
			'DATE': 	_convertDateToAdd,
			'BOOLEAN': 	_convertBoolToAdd,
			'NUMBER': 	_convertNumberToAdd
		};

		return ((converter[dataType]) ? converter[dataType].call(null, data) : data);
	};
	var _convertDataToGet = function(data, dataType) {
		var converter = {
			'OBJECT': 	_convertObjectToGet,
			'ARRAY': 	_convertObjectToGet,
			'DATE': 	_convertDateToGet,
			'BOOLEAN': 	_convertBoolToGet,
			'NUMBER': 	_convertNumberToGet
		};

		return ((converter[dataType]) ? converter[dataType].call(null, data) : data);
	};
	var _convertData = function(data, repositorySchema, fun) {
		var formated = (data) ? {} : null;

		ngdbUtils.browseObject(data, function(fieldValue, fieldName) {
			if (repositorySchema && repositorySchema[fieldName]) {
				var ret = fun(fieldValue, repositorySchema[fieldName]);

				if (ret !== undefined) {
					formated[fieldName] = ret;
				}
			}
		});

		return (formated);
	};

	/*
	** PUBLIC METHODS
	*/
	self.convertDataToAdd = function(data, repositorySchema) {
		return (_convertData(data, repositorySchema, _convertDataToAdd));
	};

	self.convertDataToGet = function(data, repositorySchema) {
		return (_convertData(data, repositorySchema, _convertDataToGet));
	};

	return (self);
}
angular
	.module('ngDatabase')
	.service('ngdbQueryBuilder', ngdbQueryBuilder);

ngdbQueryBuilder.$inject = ['ngdbUtils'];
function ngdbQueryBuilder(ngdbUtils) {
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
		return ("SELECT * FROM `" + _queryParams['table']+ "`");
	};

	var _buildUpdateQuery = function() {
		var matching = _queryParams['data']['matching'].map(function(val) {
			return ("`" + val + "` = ?");
		});

		return ("UPDATE `" + _queryParams['table'] + "` SET " + matching.join(","));
	};

	var _buildInsertQuery = function() {
		var matching = _queryParams['data']['matching'].map(function(val) {
			return ("?");
		});

		return ("INSERT INTO `" + _queryParams['table'] + "` (`" + _queryParams['data']['matching'].join("`, `") + "`) VALUES (" + matching.join(",") + ")");
	};

	var _buildDeleteQuery = function() {
		return ("DELETE FROM `" + _queryParams['table'] + "`");
	};

	/*
	** BUILD PARAMS METHODS
	*/
	var _buildWhereParam = function() {
		var matching = _queryParams['where']['matching'].map(function(val) {
			return ("`" + val + "` = ?");
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
	self.ngdbQueryBuilderSetRepository = function(repositoryName) {
		_queryParams['table'] = repositoryName;

		return (this);
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

	self.browseObject = function(obj, callback) {
		for (var key in obj) {
			var val = obj[key];

			if (val !== undefined && val !== null) {
				callback(val, key);
			}
		}
	};

	self.errorHandler = function(message) {
		throw(new Error("NGDB : " + message, "", ""));
	};

	return (self);
}