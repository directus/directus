define([], function() {

	var Exceptions = {};

	Exceptions.SystemError = function(message) {
		this.message = message;
	};

	Exceptions.RelationalError = function(message) {
		this.message = message;
	};

	return Exceptions;
});