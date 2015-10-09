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