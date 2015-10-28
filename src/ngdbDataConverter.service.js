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
		return (!isNaN(parseFloat(val)) && isFinite(val) || undefined);
	};
	var _convertNumberToGet = function(val) {
		return (!isNaN(parseFloat(val)) && isFinite(val) || undefined);
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
