(function () {
	
	'use strict';

	angular.module('app', [
		// angular modules
		'ngRoute',
		'ngResource',

		// external libraries/components encapsulated as an angular module (SC, underscore, etc)
		'app.external',

		// custom app modules
		'app.user',
		'app.import',
		'app.import.yt',
		'app.import.sc',
		'app.library',
		'app.track',
		//'app.version'
		'app.logEnhancer',

		// third party stuff
		// bootstrap
		'ui.bootstrap'
	])

	// config block
	.config(['$routeProvider', 'logEnhancerProvider', function($routeProvider, logEnhancerProvider) {

		// configure routing (note: individual routing configs are set in controllers)
		$routeProvider
			.otherwise({
				redirectTo: '/library'
			});

		// configure log enhancer - nothing to put here yet
	}])

	.constant('PROPERTIES', {
		'CONFIGS' : '/app/config.json' 	// relative path to app-level config file
	});

})();