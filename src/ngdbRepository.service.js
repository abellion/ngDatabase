angular
	.module('ngDatabase')
	.service('ngdbRepository', ngdbRepository);

ngdbRepository.$inject = ['$q', 'ngdbUtils', 'ngdbQuery', 'ngdbQueryBuilder', 'ngdbDataBinding', 'ngdbDataConverter'];
function ngdbRepository($q, ngdbUtils, ngdbQuery, ngdbQueryBuilder, ngdbDataBinding, ngdbDataConverter) {
	var self 				= this;
	var _dataBinding 		= false;
	var _repositoryName 	= null;
	var _repositorySchema 	= null;

	/*
	** UTILS METHODS
	*/
	self.ngdbRepositoryGetNew = function() {
		return (new ngdbRepository($q, ngdbUtils, ngdbQuery, ngdbQueryBuilder.ngdbQueryBuilderGetNew(), ngdbDataBinding, ngdbDataConverter));
	};

	self.ngdbRepositorySetRepository = function(repositoryName, repositorySchema) {
		_repositoryName 	= repositoryName;
		_repositorySchema 	= repositorySchema;

		ngdbQueryBuilder.ngdbQueryBuilderSetRepository(repositoryName);

		return (self);
	};

	self.setDataBinding = function(val) {
		_dataBinding = (val === true);

		return(self);
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
		data 		= ngdbDataConverter.convertDataToAdd(data, _repositorySchema);
		var query 	= this.buildQuery('INSERT', data);
		var result 	= ngdbQuery.make(query['query'], query['binds']);

		_dataBindingUpdate(result);
		return (this.resetBuilder(), result);
	};

	self.update = function(data) {
		data 		= ngdbDataConverter.convertDataToAdd(data, _repositorySchema);
		var query 	= this.buildQuery('UPDATE', data);
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

	angular.extend(self, ngdbQueryBuilder);

	return (self);
}