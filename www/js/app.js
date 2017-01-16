// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('wiomPlate', ['ionic','ionic-datepicker', 'ngCordova', 'wiomPlate.controllers',
  'wiomPlate.services'])
/*
.run(function ($rootScope, $state, AuthService, AUTH_EVENTS) {
  $rootScope.$on('$stateChangeStart', function (event,next, nextParams, fromState) {
    if (!AuthService.isAuthenticated()) {
      console.log('in app.run',next.name);
      if (next.name !== 'app.login' && next.name !== 'app.register') {
        event.preventDefault();
        $state.go('app.login');
      }
    }
  })
})
/*/
.run(function($ionicPlatform, $rootScope, $ionicLoading, $cordovaSplashscreen, $timeout,
    $cordovaPush) {
  $ionicPlatform.ready(function() {
  // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
  // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    setTimeout(function() {
        navigator.splashscreen.hide();
    }, 100);

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
  $rootScope.$on('loading:show', function () {
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading ...'
        })
    });

    $rootScope.$on('loading:hide', function () {
        $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function () {
        $rootScope.$broadcast('loading:show');
    });

    $rootScope.$on('$stateChangeSuccess', function () {
        $rootScope.$broadcast('loading:hide');
    });
})// */
// copied from ionic-datepicker https://github.com/rajeshwarpatlolla/ionic-datepicker


.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/sidebar.html',
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: '/home',
    views: {
      'mainContent': {
    templateUrl: 'templates/home.html',
    controller: 'HomeCtrl'
      }
    }
  })
  .state('app.myplate', {
    url: '/myplate',
    views: {
      'mainContent': {
          templateUrl: 'templates/myplate-step1.html' ,
          controller :'ImageController'
      }
    }
  })
    //meal diary
  .state('app.mealdiary', {
    url: '/mealdiary',
    views: {
      'mainContent': {
    templateUrl: 'templates/mealdiary.html',
    controller: 'MealdiaryCtrl'
      }
    }
  })

  .state('app.dishdetails', {
    url: '/menu/:name',
    views: {
      'mainContent': {
        templateUrl: 'templates/dishdetail.html',
        controller: 'DishDetailController' 
      }
    }
  })

  .state('app.testui', {
    url: '/testui',
    views: {
      'mainContent': {
          templateUrl: 'templates/testui-step1.html',
          controller :'TestuiController'
      }
    }
  })


  .state('app.analyzedummy', {
    url: '/analyzedummy',
    views: {
      'mainContent': {
          templateUrl: 'templates/myplate-step2.html',
          controller :'ImageController'
      }
    }
  })
 
   .state('app.analyzemyplate', {
    url: '/analyzemyplate',
    views: {
      'mainContent': {
          templateUrl: 'templates/myplate-step2.html' ,
          controller :'ImageController'
      }
    }
  })

  .state('app.addmeal', {
    url: '/addmeal',
    views: {
      'mainContent': {
          templateUrl: 'templates/myplate-step3.html' ,
          controller :'MealController'
      }
    }
  })

  .state('app.aboutus', {
      url: '/aboutus',
      views: {
        'mainContent': {
          templateUrl: 'templates/aboutus.html',
            controller: 'AboutController'
        }
      }
    })
   .state('app.trainwatson', {
      url: '/trainwatson',
      views: {
      'mainContent': {
          templateUrl: 'templates/myplate-step1.html' ,
          controller :'ImageController'
      }
    }
  })

  .state('app.traindish', {
    url: '/traindish',
    views: {
      'mainContent': {
        templateUrl: 'templates/traindish.html',
        controller: 'TrainDishController' 
      }
    }
  })

 // login
   .state('app.login', {
    url: '/login',
      views: {
        'mainContent': {
          templateUrl: 'templates/login.html',
          controller: 'LoginCtrl'
        }
      }
    })
    .state('app.register', {
      url: '/register',
      views: {
        'mainContent': {
      templateUrl: 'templates/register.html',
      controller: 'RegisterCtrl'
        }
      }
    })


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
//  $urlRouterProvider.otherwise('/app/login');

});