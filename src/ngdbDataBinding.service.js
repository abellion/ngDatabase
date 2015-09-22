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