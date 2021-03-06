(function () {

	'use strict';

	/*
	* Import controller for Youtube content
	* This currently handles both playlists and videos. Should split into two.
	*/ 
	function ImportYTController($log, $scope, ytService, trackService, trackFactory, ytAuthService, CONST) {

		var log			= $log.getInstance('ImportYTController'),
			vm 			= this,
			PLAYLISTS 	= "playlists",
			VIDEOS 		= "videos";

		/* Set state-holding variables */

		if (!vm.playlists && isConnected()) getPlaylists(); 
		
		vm.selectAllPl 			= false;  			// model for "select all" playlists checkbox
		vm.selectAllVd 			= false;			// model for "select all" videos
		vm.screen 				= PLAYLISTS; 		// model for ng-switch (swaps between playlists/videos)
		vm.connectErr 			= false;			// model for ng-switch connection error message
		vm.isConnected 			= isConnected(); 	// model for modal-body ng-switch

		/* Set functions */

		vm.getPlaylists 		= getPlaylists;
		vm.getVideos 			= getVideos;
		vm.importOne 			= importOne;
		vm.importAll 			= importAll;
		vm.importPlaylist 		= null;
		vm.importAllPlaylists 	= null;
		vm.goToPlaylists 		= goToPlaylists;
		vm.selectPlaylistItem  	= selectPlaylistItem;
		vm.selectVideoItem 		= selectVideoItem;
		vm.selectAll 			= selectAll;
		vm.connect 				= connect;

		function isConnected() {
			return ytAuthService.isReady();
		}

		function connect() {
			ytAuthService.connect(false).then(function() {
				vm.connectErr = false;
				vm.connected = true;
				getPlaylists();
			},
			function(errMsg) {
				vm.connectErr = true;
				vm.connected = false;
			});
		}

		// called on list-item click
		function selectPlaylistItem(index) {
			vm.playlists[index].selected = !vm.playlists[index].selected;
		}

		function selectVideoItem (index) {
			var video = vm.videos[index];
			console.log(index + ' video selected: ', vm.videos[index]);
			//video.selected = !video.selected; 		---- testing
			if (video.getImportStatus() === CONST.TRACK.IMPORT.NONE) {
				video.selected = !video.selected;
			}
		}

		// called on select-all checkbox change
		function selectAll() {
			console.log('selectAll with ' + vm.screen);
			if (vm.screen === PLAYLISTS) {
				vm.playlists.map(function(item) {
					return angular.extend(item, { selected : vm.selectAllPl } )
				})
			} else {
				vm.videos.map(function(item) {
					//return angular.extend(item, { selected : vm.selectAllVd } ) --- testing
					if (item.getImportStatus() === CONST.TRACK.IMPORT.NONE) {
						return angular.extend(item, { selected : vm.selectAllVd } );
					}
				})
			}
		}

		function importOne($index, $event) {
			$event.stopPropagation();
			if (vm.screen === PLAYLISTS) {

			} 
			else if (vm.screen === VIDEOS) {
				var video = vm.videos[$index];
				if (video) {
					trackService.save(video).then(function(response) {
						log.info('import one success ' , response)
						video.setImportStatus(CONST.TRACK.IMPORT.SUCCESS);
					},
					function(response) {
						log.error('import one error ' , response)
						video.setImportStatus(CONST.TRACK.IMPORT.FAILURE);
					});
				}
			}
		}

		function importAll() {
			if (vm.screen === PLAYLISTS) {

			} 
			else if (vm.screen === VIDEOS) {
				console.log('calling trackservice saveall...')
				var selected = vm.videos.filter(selectedFilter);

				trackService.saveAll(selected).then(function(data) {
					// replace models with new ones or just set flag?
					selected.map(function(item) {
						item.setImportStatus(CONST.TRACK.IMPORT.SUCCESS);
					})
					$scope.$apply();
				},
				function(error) {
					log.error('save all error ' , error)
				});
			}
		}

		function getPlaylists() {
			ytService.getPlaylists().then(function(response) {
				vm.playlists = response;
				$scope.$apply();
			},
			function(response) {
				log.error('error getting youtube playlists ', response)
			});
		}

		function getVideos(idx, $event) {
			$event.stopPropagation();
			var playlist = vm.playlists[idx];

			if (playlist) {

				// check: did we already retreive this playlist?
				if (playlist.videos) {
					vm.videos = playlist.videos; // set as 'current' videos
					vm.listTitle = playlist.title;
					goToVideos();			 	 // switch to videos screen

				// otherwise, we need to make a call to get them
				} else {
					ytService.getPlaylist(playlist.id).then(function(response) {
						console.log('success getting videos', response);

						playlist.videos = response; // update model with the videos
						vm.videos = response;		// set as 'current' videos
						vm.listTitle = playlist.title;
						goToVideos();				// switch to videos screen
						$scope.$apply();			// trigger
					}, 
					function(response) {
						log.error('error getting youtube videos ', response)
					});
				}
			} else {
				log.warn('getVideos(): no playlist found at idx ' + idx);
			}
		}

		function goToPlaylists() {
			vm.screen = PLAYLISTS;
		}

		function goToVideos() {
			vm.screen = VIDEOS;
		}

		function selectedFilter(item) {
			return item.selected;
		}
	}

	// angular config
	angular
		.module('app.import.yt')
		.config(['$routeProvider', function($routeProvider) {
			$routeProvider.when('/import/yt', {
				controller: 'ImportYTController'
			});
		}])
		.controller('ImportYTController', ['$log', '$scope', 'YTService', 'TrackService', 'TrackFactory', 'YTAuthService', 'CONST', ImportYTController]);

})();