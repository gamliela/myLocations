'use strict';

angular.module('myApp', ['ui.router', 'uiGmapgoogle-maps', 'LocalStorageModule', 'isteven-multi-select'])

    // definition of states & views
    .config(['$stateProvider', function ($stateProvider) {

        // thin wrapper for storage resolve promise
        var asPromise = function ($q, func) {
            var deferred = $q.defer();
            var value = func();
            if (value)
                deferred.resolve(value);
            else
                deferred.reject("object not found in storage");
            return deferred.promise;
        };

        // define application states
        $stateProvider

            // welcome screen
            .state('root', {
                url: '',
                views: {
                    'top': { templateUrl: 'templates/top.html', controller: function ($scope) {
                        // a click on toolbar will generate event that should be handled by main controllers
                        $scope.actionClick = function (action) {
                            $scope.$root.$broadcast(action.event, action);
                        }
                    } },
                    'main': { templateUrl: 'templates/home.html' },
                    'bottom': { templateUrl: 'templates/bottom.html' }
                },
                data: { toolbarLabel: "myLocations" }
            })

            // category list screen (supports "new" action from toolbar)
            .state('root.category', {
                url: '/category',
                views: { 'main@': {  templateUrl: 'templates/categoryList.html', controller: 'myApp.ctrl.categoryList' } },
                data: {
                    toolbarLabel: "Category List",
                    toolbarActions: [
                        { event: "toolbarNew", label: "New" }
                    ]
                }
            })

            // new category screen
            .state('root.category.new', {
                url: '/new',
                views: { 'main@': {  templateUrl: 'templates/categoryEdit.html', controller: 'myApp.ctrl.categoryEdit' } },
                resolve: { category: function () {
                    return null;
                } },
                data: {
                    toolbarLabel: "New Category",
                    toolbarActions: [
                        { event: "toolbarSave", label: "Save" }
                    ]
                }
            })

            // edit category screen (will edit only existing entities)
            .state('root.category.edit', {
                url: '/:id',
                views: { 'main@': {  templateUrl: 'templates/categoryEdit.html', controller: 'myApp.ctrl.categoryEdit' } },
                resolve: {
                    category: ['$q', '$stateParams', 'myApp.storage', function ($q, $stateParams, storage) {
                        return asPromise($q, function () {
                            return storage.getCategory($stateParams.id);
                        });
                    }]
                },
                data: {
                    toolbarLabel: "Category Edit",
                    toolbarActions: [
                        { event: "toolbarSave", label: "Save" },
                        { event: "toolbarDelete", label: "Delete" }
                    ]
                }
            })

            // location list screen (supports "new" action from toolbar)
            .state('root.location', {
                url: '/location',
                views: { 'main@': {  templateUrl: 'templates/locationList.html', controller: 'myApp.ctrl.locationList' } },
                data: {
                    categorized: false,
                    toolbarLabel: "Location List",
                    toolbarActions: [
                        { event: "toolbarNew", label: "New" },
                        { event: "toolbarCategorized", label: "Categorize View" }
                    ]
                }
            })

            // new location screen
            .state('root.location.new', {
                url: '/new',
                views: { 'main@': {  templateUrl: 'templates/locationEdit.html', controller: 'myApp.ctrl.locationEdit' } },
                resolve: { location: function () {
                    return null;
                } },
                data: {
                    toolbarLabel: "New Location",
                    toolbarActions: [
                        { event: "toolbarSave", label: "Save" }
                    ]
                }
            })

            // edit location screen (will edit only existing entities)
            .state('root.location.edit', {
                url: '/:id',
                views: { 'main@': {  templateUrl: 'templates/locationEdit.html', controller: 'myApp.ctrl.locationEdit' } },
                resolve: {
                    location: ['$q', '$stateParams', 'myApp.storage', function ($q, $stateParams, storage) {
                        return asPromise($q, function () {
                            return storage.getLocation($stateParams.id);
                        });
                    }]
                },
                data: {
                    toolbarLabel: "Location Edit",
                    toolbarActions: [
                        { event: "toolbarSave", label: "Save" },
                        { event: "toolbarDelete", label: "Delete" }
                    ]
                }
            });

    }])

    // init google maps
    // see here for details: http://angular-ui.github.io/angular-google-maps/#!/use
    .config(['uiGmapGoogleMapApiProvider', function(GoogleMapApi) {
        GoogleMapApi.configure({ v: '3.20', libraries: '' });
    }])

    // application initialization code
    .run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
        // attach ui-router state & params to global root scope
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        // for debugging
        //$rootScope.$on("$stateChangeError", console.log.bind(console));
    }])

    // local storage service
    // we store categories and locations as objects in local storage.
    // each item in these objects has id property as a key, and location or category object as a value.
    // this allows us to refer category and location by number instead of by name.
    .service('myApp.storage', ['localStorageService', function ($storage) {

        // register storage values with defaults (only for demonstration effect)
        if (!$storage.get('categories') || !$storage.get('locations')) {
            $storage.set('categories', {
                "0": {id: 0, name: "Bars"},
                "1": {id: 1, name: "Shops"},
                "2": {id: 2, name: "Restaurants"},
                "next": 3
            });
            $storage.set('locations', {
                "0": {id: 0, name: "The Lool", address: "Herzl St 202, Rehovot", categories: [0], coords: { latitude: 31.899396805165384, longitude: 34.81049190953979 } },
                "1": {id: 1, name: "Crocs Shoes", address: "Jabotinski St 45, Ashdod", categories: [1], coords: { latitude: 31.8105665, longitude: 34.6529708 } },
                "2": {id: 2, name: "Moo & Moo", address: "Herzl St 177, Rehovot", categories: [2], coords: { latitude: 31.898473441968346, longitude: 34.81029882488406 } },
                "next": 3
            });
        }

        // will return the named list of entities
        this.getList = function (listName) {
            var list = $storage.get(listName);
            delete list.next;
            return list;
        };

        // will return a specific entity
        this.getEntity = function (listName, id) {
            return $storage.get(listName)[id];
        };

        // delete an entity
        this.removeEntity = function (listName, id) {
            var list = $storage.get(listName);
            delete list[id];
            $storage.set(listName, list);
        };

        // will add/replace entity, update its id as necessary
        this.persistEntity = function (listName, entity) {
            var list = $storage.get(listName);
            if (typeof(entity.id) !== 'number')
                entity.id = list.next++;
            list[entity.id] = entity;
            $storage.set(listName, list);
        };

        // create shortcuts for categories and locations
        this.getCategories = this.getList.bind(this, 'categories');
        this.getCategory = this.getEntity.bind(this, 'categories');
        this.removeCategory = this.removeEntity.bind(this, 'categories');
        this.persistCategory = this.persistEntity.bind(this, 'categories');
        this.getLocations = this.getList.bind(this, 'locations');
        this.getLocation = this.getEntity.bind(this, 'locations');
        this.removeLocation = this.removeEntity.bind(this, 'locations');
        this.persistLocation = this.persistEntity.bind(this, 'locations');

        // helper function - convert storage list to sorted array by name
        this.asSortedArray = function (list) {
            return Object.keys(list).map(function (id) {
                return list[id];
            }).sort(function (c1, c2) {
                    return c1.name > c2.name ? 1 : -1;
                });
        };
    }])

    // controller for the categories list view
    .controller('myApp.ctrl.categoryList', ['$scope', 'myApp.storage', function ($scope, storage) {
        // populate scope
        $scope.categories = storage.asSortedArray(storage.getCategories());
        // define new action
        $scope.$on("toolbarNew", function () {
            $scope.$state.go(".new");
        });
    }])

    // controller for add/edit category (category is null for "new" state)
    .controller('myApp.ctrl.categoryEdit', ['$scope', 'myApp.storage', 'category', function ($scope, storage, category) {
        // define validation function (returns true on success, and also updates $scope.validation
        // with detailed error status)
        var validate = function () {
            $scope.validation = {};
            if (!$scope.category.name)
                $scope.validation.name = 'Name parameter is required';
            return Object.keys($scope.validation).length === 0;
        };

        // populate scope
        if (category) {
            $scope.category = category;     // edit category
            $scope.locationsFiltered = storage.asSortedArray(storage.getLocations()).filter(function(location){
                return location.categories.indexOf(category.id) != -1;
            });
            $scope.$on("toolbarDelete", function () {
                if ($scope.locationsFiltered.length == 0) {
                    storage.removeCategory($scope.category.id);
                    $scope.$state.go("^");
                } else
                    $scope.validation = { delete: "Can't delete category with assigned locations" };
            });
        } else {
            $scope.category = {};           // new category (start with empty fields)
            $scope.locationsFiltered = [];
        }

        // define save action
        $scope.$on("toolbarSave", function () {
            if (validate()) {
                storage.persistCategory($scope.category);
                $scope.$state.go("^");      // back to list
            }
        });
    }])

    // controller for the locations list view
    .controller('myApp.ctrl.locationList', ['$scope', 'myApp.storage', function ($scope, storage) {
        // populate scope
        var plainCategories = storage.getCategories();
        $scope.categories = storage.asSortedArray(plainCategories);
        $scope.categories.forEach(function(category) {
            // prepare empty locations array for every category value
            category.locations = [];
        });
        $scope.locations = storage.asSortedArray(storage.getLocations());
        $scope.locations.forEach(function(location) {
            location.categories.forEach(function(categoryId) {
                plainCategories[categoryId].locations.push(location);
            })
        });
        $scope.categorized = $scope.$state.$current.data.categorized;

        // define new & categorize actions
        $scope.$on("toolbarNew", function () {
            $scope.$state.go(".new");
        });
        $scope.$on("toolbarCategorized", function (event, action) {
            $scope.$state.$current.data.categorized = !$scope.$state.$current.data.categorized;
            action.label = $scope.$state.$current.data.categorized ? "Flatten View" : "Categorize View";
            $scope.categorized = $scope.$state.$current.data.categorized;
        });
    }])

    // controller for add/edit location (location is null for "new" state)
    .controller('myApp.ctrl.locationEdit', ['$scope', 'myApp.storage', 'location', function ($scope, storage, location) {
        // define validation function (returns true on success, and also updates $scope.validation
        // with detailed error status)
        var validate = function () {
            $scope.validation = {};
            if (!$scope.location.name)
                $scope.validation.name = 'Name parameter is required';
            if (!$scope.location.address)
                $scope.validation.address = 'Address parameter is required';
            if ($scope.categoriesSelectOutput.length == 0)
                $scope.validation.categories = 'At least one category is required';
            return Object.keys($scope.validation).length === 0;
        };

        // populate scope
        $scope.categories = storage.getCategories();
        if (location) {
            $scope.location = location;     // edit location
            $scope.$on("toolbarDelete", function () {
                storage.removeLocation($scope.location.id);
                $scope.$state.go("^");
            })
        } else
            // new location (start with empty fields, default map at Azrieli Center)
            $scope.location = { coords: { latitude: 32.074392875096414, longitude: 34.79195251522219 } };
        $scope.categoriesSelectInput = storage.asSortedArray($scope.categories).map(function (category) {
            // mark selected categories in the input-model of the "isteven-multi-select" component
            // see description here: http://isteven.github.io/angular-multi-select/#/configs-options
            category.ticked = $scope.location.categories && ($scope.location.categories.indexOf(category.id) != -1);
            return category;
        });
        $scope.localLang = { nothingSelected: "Select at least one category" };
        $scope.mapCenter = _.clone($scope.location.coords); // do not mix map center and location coordinates

        // define save action
        $scope.$on("toolbarSave", function () {
            if (validate()) {
                $scope.location.categories = $scope.categoriesSelectOutput.map(function (category) {
                    return category.id;
                });
                storage.persistLocation($scope.location);
                $scope.$state.go("^");      // back to list
            }
        });
    }]);
