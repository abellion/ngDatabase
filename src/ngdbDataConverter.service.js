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
		return (angular.isObject(val) &&  angular.toJson(val) || null);
	};
	var _convertObjectToGet = function(val) {
		return (_isJson(val) || null);
	};

	var _convertDateToAdd = function(val) {
		return (val instanceof Date && val.getTime() || null);
	};
	var _convertDateToGet = function(val) {
		return (isFinite(val) && new Date(val) || null);
	};

	var _convertNumberToAdd = function(val) {
		return (isFinite(val) && parseInt(val, 10) || null);
	};
	var _convertNumberToGet = function(val) {
		return (isFinite(val) && parseInt(val, 10) || null);
	};

	var _convertBoolToAdd = function(val) {
		return ((val === true) ? true : false);
	};
	var _convertBoolToGet = function(val) {
		return ((val === "true") ? true : false);
	};

	var _convertDataToAdd = function(data, dataType) {
		var converter = {
			'OBJECT': 	_convertObjectToAdd,
			'ARRAY': 	_convertObjectToAdd,
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
				formated[fieldName] = fun(fieldValue, repositorySchema[fieldName]);
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