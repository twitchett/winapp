(function () {

	'use strict';

	/*
	* Provides CRUD operations for Tracks. All interaction with the DB concerning Tracks goes through this service.
	* Methods accept & return TrackModel objects.
	*/
	function TrackService($log, $http, $q, userService, TrackModel) {

		var TrackService = {};
		var log = $log.getInstance('TrackService');

		var API_TRACK_URL 		= '/api/track/',
			API_TRACKS_URL 		= '/api/tracks/',
			API_TAGS_URL		= '/api/tags/';

		// POSTs the given TrackModel to the server
		TrackService.save = function(trackModel) {
			if (!trackModel) {
				log.warn('save failed, trackModel=' + typeof trackModel);
				return $q.reject('no data to save');
			}

			var postData = extendWithUserData(trackModel);
			var postUrl = API_TRACK_URL + userService.getCurrentUser().getUserId();

			return $http.post(postUrl, postData)
				.then(function(response) {	// response: data, status, headers, config
					log.debug('saved track: ' + trackModel);
					return new TrackModel(response.data);
				},
				function(response){
					log.debug('error saving track: ' , response);
					return response.data;
				});
		}

		// POSTs all the given TrackModels to the database. Expects an array of TrackModels.
		// Note: this is a batch operation
		TrackService.saveAll = function(trackModels) {
			if (!trackModels) {
				log.warn('saveAll failed, trackModels=' + typeof trackModels);
				return $q.reject('no data to save');
			}

			var postData = trackModels.map(extendWithUserData)
			var postUrl = API_TRACKS_URL + userService.getCurrentUser().getUserId();

			console.log('sending data ' + JSON.stringify(postData, null, 4));

			return $http.post(postUrl, postData)
				.then(function(response) {
					log.debug('imported ' + response.data.length + ' tracks' );

					// var trackModels = [];
					// angular.forEach(response.data, function(trackData, idx) {
					// 	trackModels.push(new TrackModel(trackData));
					// })

					// return trackModels;

					return response.data; // just return JSON for now, TrackModels not needed
				},
		 		function(response) {
					log.error('could not import tracks: ' , response);
					return response.data;
		 		});
		}

		// Get all the tracks of the current user
		TrackService.getAllTracks = function() {
			var userId = userService.getCurrentUser().getUserId();
			log.debug('getting library for user with id ' + userId);

			return $http.get(API_TRACKS_URL).then(function(response) {
					log.debug('got libary, tracks: ' + response.data.length);

					var trackModels = [];
					angular.forEach(response.data, function(trackData, idx) {
						trackModels.push(new TrackModel(trackData));
					})
					return trackModels;
				},
		 		function(response) {
					log.error('error getting library for user ' + userId);
					return response.data;
		 		});
		}

		TrackService.update = function(trackModel, params) {
			var url = API_TRACK_URL + trackModel.getId();
			var data = JSON.stringify(params);

			log.debug('updating track with ', params);

			return $http.post(url, data).then(function(response) {
				log.debug('got updated track: ', response.data);
				return response.data;
			},
	 		function(response) {
				log.error('error updating track', response);
				return false;
	 		});
		}

		// Removes all the TrackModels from the database. Expects an array of TrackModels.
		// Note: unlike saveAll, this is not a batch operation
		TrackService.deleteAll = function(trackModels) {
			if (!trackModels) {
				log.warn('deleteAll failed, trackModels=' + trackModels);
				return $q.reject('no data to delete');
			}

			log.debug('deleting ' + trackModels.length + ' tracks');

			for (var i=0; i<trackModels.length; i++) {
				var trackId = trackModels[i].getId();

				if (trackId != null) {
					$http.get(API_TRACK_URL + trackId)
						.then(function(response) {
							log.debug(response.data);
						},
				 		function(response) {
							log.error('error deleting track ' + trackId);
				 		});

				} else {
					log.warn('could not delete track ' + trackModels[i].name + ': no _id found');
				}
			}
		}

		TrackService.getTags = function() {
			return $http.get(API_TAGS_URL).then(function(response) {
				log.debug('got tags: ', response.data);
				return response.data;
			}, function(response) {
				log.error('error getting tags', response);
			});
		}

		// TODO: would be better as a server-side interceptor
		function extendWithUserData(data) {
			var id = userService.getCurrentUser().getUserId();
			var newData = angular.extend(data, { userId : id } );

			return newData;
		}

		return TrackService;
	}

	angular
		.module('app.track')
		.factory('TrackService', ['$log', '$http', '$q', 'UserService', 'TrackModel', TrackService]);

})();