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