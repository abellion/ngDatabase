angular
	.module('ngDatabase')
	.factory('ngdbUtils', ngdbUtils);

ngdbUtils.$inject = [];
function ngdbUtils() {
	var self = this;

	self.browseObject = function(obj, callback) {
		for (var key in obj) {
			var val = obj[key];

			if (val !== undefined && val !== null) {
				callback(val, key);
			}
		}
	};

	self.errorHandler = function(message) {
		throw(new Error("NGDB : " + message, "", ""));
	};

	return (self);
}