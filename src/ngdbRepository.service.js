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