'use strict';
angular.module('wiomPlate.services', ['ngResource'])
//.constant("baseURL","http://localhost:3001") // for simulator
//.constant("baseURL","http://192.168.1.3:3001") // for device over wifi
.constant("baseURL","http://whatisonmyplate.mybluemix.net")
.constant("CurrentVersion",1) // compare with the most recent published appver
.constant('AUTH_EVENTS', {notAuthenticated: 'auth-not-authenticated'})
.factory('$localStorage', ['$window', function($window) {
  return {
    store: function(key, value) {
        $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
    },
    storeObject: function(key, value) {
        $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key,defaultValue) {
        return JSON.parse($window.localStorage[key] || defaultValue);
    }
  }
}])

// copied
.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
      }[response.status], response);
      return $q.reject(response);
    }
  };
})

// Keeps the results of image analysis
.service('DetailService', function($q, $http, baseURL) {
    var analysisResults ={}; //Everything: image anylysis, nutInfo, and icon
    var DetailService = this ;
    var imageToAnalyze ='';
    var servingSelected ;
    var sendImageForAnalysis = true ; // control if sending the image to anylyze or using previous results

    DetailService.initDetailService = function () {
        imageToAnalyze ='';
        servingSelected =0;
        analysisResults ={};
    }
    DetailService.getImageToAnalyze = function () {
        return imageToAnalyze ;
    } 
    DetailService.setImageToAnalyze = function (image) {
        imageToAnalyze =image;
    } 
    DetailService.getSendImageForAnalysis = function () {
        return sendImageForAnalysis ;
    }
    DetailService.setSendImageForAnalysis = function (value) {
        sendImageForAnalysis = value;
    }

    DetailService.getServingUnit = function () {
        return [0, 0.25,0.33, .5, 1, 1.5 ,2, 2.5 ,3, 3.5, 4,5,6,7,8,9];
    } 
    DetailService.getServingSelected = function () {
        return servingSelected ;
    } 
    // set the index serving for a single dish
    DetailService.setServingSelected= function (servingIndex) {
        servingSelected=servingIndex ;
    } 
    DetailService.setAnalysisResults = function (inputJson) {
        analysisResults = inputJson ;
    } 
    // get all the dishes 
    DetailService.getAnalysisResults = function () {
        return analysisResults  ;
    } 
    // get a single dishe 
    DetailService.getSingleDish = function (dishId) {
        return analysisResults[dishId]  ;
    } 
    DetailService.getDishNutrient = function (reqDish, reqNutrientId) {
        var returnValue =0;
        var dishResults =DetailService.getSingleDish (reqDish);
        var nutrients =dishResults.metadata.nutInfo ;
        //console.log('calcNutrients',nutrients);
        for (var i = 0; i < nutrients.length; i++) { 
            var nutrient =nutrients[i];
            if (nutrient.nid==reqNutrientId) {
                return nutrient.v ;
            }
        }
        return 0; // must be an error
    }

 // prepare to add a dish
    DetailService.initDish = function () {
      var newDish ={};
       newDish.name ='' ;
       newDish.nutInfo=[] ;  
       var nutArray =[208, 205,204,203,291,601,307];
      for (var i in nutArray ) {
        var nid =nutArray[i];
        var aNutrient = {} ;
        switch (nid) {
          case 208 : // energy (calories)
            aNutrient.nid=nid;
            aNutrient.v='';
            aNutrient.name='Calories';
            aNutrient.u='Calories';
            break ;
          case 205 : 
            aNutrient.nid=nid;
            aNutrient.v='';
            aNutrient.name='Carbs';
            aNutrient.u='g';
            break ;
          case 204 : 
            aNutrient.nid=nid;
            aNutrient.v='';
            aNutrient.name='Fat';
            aNutrient.u='g';
            break ;
          case 203 : 
            aNutrient.nid=nid;
            aNutrient.v='';
            aNutrient.name='Protein';
            aNutrient.u='g';
            break ;
          case 291 : 
            aNutrient.nid=nid;
            aNutrient.v='';
            aNutrient.name='Fiber';
            aNutrient.u='g';
            break ;
          case 601 : 
            aNutrient.nid=nid;
            aNutrient.v='';
            aNutrient.name='Colesterol';
            aNutrient.u='g';
            break ;
          case 307 : 
            aNutrient.nid=nid;
            aNutrient.v='';
            aNutrient.name='Sodium';
            aNutrient.u='mg';
            break ;
        }
        newDish.nutInfo.push(aNutrient);
      }
      return newDish ;
    }
//
 })  


// Copied from authentication-2
.service('AuthService', function($q, $http, baseURL) {
  var LOCAL_TOKEN_KEY = 'yourTokenKey';
  var LOCAL_USER_KEY = 'UserName';
  var isAuthenticated = false;
  var authToken;
 
  function loadUserCredentials() {
    var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (token) {
      useCredentials(token);
    }
  }
 
  function storeUserCredentials(token,username) {
    window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
    window.localStorage.setItem(LOCAL_USER_KEY, username);
    useCredentials(token);
  }
 
  function useCredentials(token) {
    isAuthenticated = true;
    authToken = token;
 
    // Set the token as header for your requests!
    $http.defaults.headers.common.Authorization = authToken;
  }
 
  function destroyUserCredentials() {
    authToken = undefined;
    isAuthenticated = false;
    $http.defaults.headers.common.Authorization = undefined;
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    window.localStorage.removeItem(LOCAL_USER_KEY);
  }
 
  var register = function(user) {
    return $q(function(resolve, reject) {
      $http.post(baseURL + '/api/signup', user).then(function(result) {
        if (result.data.success) {
            storeUserCredentials(result.data.token,user.name);
            resolve(result.data.username);
        } else {
          reject(result.data.msg);
        }
      });
    });
  };
 
  var login = function(user) {
    return $q(function(resolve, reject) {
      $http.post(baseURL + '/api/authenticate', user).then(function(result) {
        if (result.data.success) {
          storeUserCredentials(result.data.token,user.name);
          console.log('Back from login. UserName:',result.data.username,'. Storing token and username',user.name);
          resolve(result.data.username);
        } else {
            console.log('result',result.data);
          reject(result.data.msg);
        }
      });
    });
  };
 
  var logout = function() {
    destroyUserCredentials();
  };
  loadUserCredentials();
 
  return {
    login: login,
    register: register,
    logout: logout,
    getUserLogin: function() {return window.localStorage.getItem(LOCAL_USER_KEY); } ,
    isAuthenticated: function() {return isAuthenticated;},
  };
  // get user login
})

//https://forum.ionicframework.com/t/how-can-i-use-ionichistory-to-go-back-2-views/16176/8
.service('StateService', function($ionicHistory){
    var StateService = this ;
    
    StateService.goBackMany = function(depth)  {
        console.log('goBackMany',depth);
        // get the right history stack based on the current view
        var historyId = $ionicHistory.currentHistoryId();
        var history = $ionicHistory.viewHistory().histories[historyId];
        // set the view 'depth' back in the stack as the back view
        var targetViewIndex = history.stack.length - 1 - depth;
        $ionicHistory.backView(history.stack[targetViewIndex]);
        // navigate to it
        $ionicHistory.goBack();
    }
})
/*
.service('returnToState', function($ionicHistory){
  return function(stateName){
    var historyId = $ionicHistory.currentHistoryId();
    var history = $ionicHistory.viewHistory().histories[historyId];
    for (var i = history.stack.length - 1; i >= 0; i--){
      if (history.stack[i].stateName == stateName){
        $ionicHistory.backView(history.stack[i]);
        $ionicHistory.goBack();
      }
    }
  }
}) */
// end ionicHistory

// start Dates only https://gist.github.com/weberste/354a3f0a9ea58e0ea0de#file-gistfile1-js
.directive('datepickerLocaldate', ['$parse', function ($parse) {
        var directive = {
            restrict: 'A',
            require: ['ngModel'],
            link: link
        };
        return directive;

        function link(scope, element, attr, ctrls) {
            var ngModelController = ctrls[0];

            // called with a JavaScript Date object when picked from the datepicker
            ngModelController.$parsers.push(function (viewValue) {
                // undo the timezone adjustment we did during the formatting
                viewValue.setMinutes(viewValue.getMinutes() - viewValue.getTimezoneOffset());
                // we just want a local date in ISO format
                return viewValue.toISOString().substring(0, 10);
            });

            // called with a 'yyyy-mm-dd' string to format
            ngModelController.$formatters.push(function (modelValue) {
                if (!modelValue) {
                    return undefined;
                }
                // date constructor will apply timezone deviations from UTC (i.e. if locale is behind UTC 'dt' will be one day behind)
                var dt = new Date(modelValue);
                // 'undo' the timezone offset again (so we end up on the original date again)
                dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
                return dt;
            });
        }
    }])
// end dates only
.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});
;


/*
// update the current user selecton for the dish and return the object
    DetailService.updateTotalNutrients = function () {
        for(var i = totalNutrients.length - 1; i >= 0; i--) {
            if(totalNutrients[i] ) {
               totalNutrients.splice(i, 1); // just clean the array elements
            }
        }

        var json208={}, json204={}, json203 ={}, json205 ={}, json269 ={};
        var json291={}, json307={}, json601 ={};
            json208.nutrientTotal =0,json204.nutrientTotal =0,json203.nutrientTotal =0;
            json205.nutrientTotal =0,json269.nutrientTotal =0,json291.nutrientTotal =0;
            json307.nutrientTotal =0,json601.nutrientTotal =0 ;
        var dishResults =DetailService.getAnalysisResults ();
        
        for (item in dishResults) {
            var servingIndex = DetailService.getIxServingForDish(item) ;
            var element = dishResults[item] ;
            if (servingIndex ==0) {
                console.log('Size zero for',element.foodId);
                continue ;
            }
            var servingForDish=DetailService.getServingUnit()[servingIndex];
//            console.log('element',element,'nutrients size',element.metadata.nutInfo.length)
            for (var i = 0; i < element.metadata.nutInfo.length; i++) {
                var nutrient =element.metadata.nutInfo[i];
                var nid =nutrient.nid ;
                switch (nid) {
                    case 208 : // energy (calories)
                        json208.nid =nid;
                        json208.nutrientUnit =nutrient.u;
                        json208.nutrientName = nutrient.name ;
                        console.log('nutrient.v',nutrient.v)
                        json208.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json208.nutrientTotal)* 100 )/100 ;
                        break ;
                    case 203 : // protein
                        json203.nid =nid;
                        json203.nutrientUnit =nutrient.m;
                        json203.nutrientName = nutrient.name ;
                        //console.log('nutrient.v',nutrient.v)
                        json203.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json203.nutrientTotal)* 100 )/100 ;
                        break ;
                    case 204 : // fat
                        json204.nid =nid;
                        json204.nutrientUnit =nutrient.m;
                        json204.nutrientName = nutrient.name ;
                        //console.log('nutrient.v',nutrient.v)
                        json204.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json204.nutrientTotal)* 100 )/100 ;
                        break ;

                    case 205 : // Carbohydrate
                        json205.nid =nid;
                        json205.nutrientUnit =nutrient.m;
                        json205.nutrientName = nutrient.name ;
                        //console.log('nutrient.v',nutrient.v)
                        json205.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json205.nutrientTotal)* 100 )/100 ;
                        break ;

                    case 269 : // Sugar
                        json269.nid =nid;
                        json269.nutrientUnit =nutrient.m;
                        json269.nutrientName = nutrient.name ;
                        //console.log('nutrient.v',nutrient.v)
                        json269.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json269.nutrientTotal)* 100 )/100 ;
                        break ; 
                    case 291 : // Fiber
                        json291.nid =nid;
                        json291.nutrientUnit =nutrient.m;
                        json291.nutrientName = nutrient.name ;
                        //console.log('nutrient.v',nutrient.v)
                        json291.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json291.nutrientTotal)* 100 )/100 ;
                        break ; 
                    case 601 : // Colesterol
                        json601.nid =nid;
                        json601.nutrientUnit =nutrient.m;
                        json601.nutrientName = nutrient.name ;
                        //console.log('nutrient.v',nutrient.v)
                        json601.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json601.nutrientTotal)* 100 )/100 ;
                        break ; 
                    case 307 : // Sodium
                        json307.nid =nid;
                        json307.nutrientUnit =nutrient.m;
                        json307.nutrientName = nutrient.name ;
                        //console.log('nutrient.v',nutrient.v)
                        json307.nutrientTotal = Math.round((servingForDish * nutrient.v 
                                + json307.nutrientTotal)* 100 )/100 ;
                        break ; 
                } 
            }
        }
        totalNutrients.push(json208);
        totalNutrients.push(json204);
        totalNutrients.push(json203);
        totalNutrients.push(json205);
//        totalNutrients.push(json269);
        totalNutrients.push(json291);
        totalNutrients.push(json601);
        totalNutrients.push(json307);
        console.log('totalNutrients',totalNutrients)
        return totalNutrients ;
    }
*/ /*
    DetailService.addNewDish = function(newDish) {
      return $q(function(resolve, reject) {
        $http.post(baseURL + '/api/addnewdish', newDish).then(function(result) {
          if (result.data.success) {            
            console.log('Back from addNewDish. newDish:',result.data.dishname);
            resolve(result.data.dishname);
          } else {
              console.log('ERROR adding a new dish. result',result.data);
              reject(result.data.msg);
          }
        });
      });
    }   */
/* 
    DetailService.getServingArray = function () {
        return servingArray ;
    } 
    DetailService.getTotalNutrients = function () {
        return totalNutrients;
    }
    {
        for (item in dishResults) {
            var servingIndex = DetailService.getIxServingForDish(item) ;
            var element = dishResults[item] ;
            if (servingIndex ==0) {
                console.log('Size zero for',element.foodId);
                continue ;
            }
            var servingForDish=DetailService.getServingUnit()[servingIndex];
            for (var i = 0; i < element.metadata.nutInfo.length; i++) {
                var nutrient =element.metadata.nutInfo[i];
                var nid =nutrient.nid ;
                if (nid ==reqNutrientId) {
                    returnValue = Math.round((servingForDish * nutrient.v + returnValue)* 100 )/100 ;
                }
            }
        }
        return returnValue ;
    }

*/