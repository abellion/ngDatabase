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