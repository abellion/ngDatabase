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