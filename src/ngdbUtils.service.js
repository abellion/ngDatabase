angular
	.module('ngDatabase')
	.factory('ngdbUtils', ngdbUtils);

ngdbUtils.$inject = [];
function ngdbUtils() {
	var self = this;

	/*
	** PRIVATE METHODS
	*/
	var _isObject = function(obj) {
		return (typeof obj === "object")
	};

	var _isJson = function(json) {
		try {
			JSON.parse(json);
		} catch(e) {
			return (false);
		}

		return (true);
	};

	/*
	** PROTECTED METHODS
	*/
	self.browseObject = function(obj, callback) {
		for (var key in obj) {
			var val = obj[key];

			if (val !== undefined && val !== null) {
				callback(val, key);
			}
		}
	};

	self.transformData = function(data, repositorySchema) {
		var formated = (data) ? {} : null;

		self.browseObject(data, function(fieldValue, fieldName) {
			if (repositorySchema && repositorySchema[fieldName] || !repositorySchema) {
				if (_isObject(fieldValue)) {
					fieldValue = angular.toJson(fieldValue);
				}
				else if (_isJson(fieldValue)) {
					fieldValue = angular.fromJson(fieldValue);
				}

				formated[fieldName] = fieldValue;
			}
		});

		return (formated);
	};

	self.errorHandler = function(message) {
		throw(new Error("NGDB : " + message, "", ""));
	};

	return (self);
}