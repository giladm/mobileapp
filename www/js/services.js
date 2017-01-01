'use strict';
angular.module('wiomPlate.services', ['ngResource'])
//.constant("baseURL","http://localhost:3001") // only for simulator
.constant("baseURL","http://whatisonmyplate.mybluemix.net")
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

.service('DetailService', function() {
    var DetailService = this ;
    var imageToAnalyze ='';
    var servingArray =[];
    var analysisResults ={};
    var totalNutrients =[];

    DetailService.initDetailService = function () {
        imageToAnalyze ='';
        servingArray =[];
        analysisResults ={};
        totalNutrients =[];
    }
    DetailService.getImageToAnalyze = function () {
        return imageToAnalyze ;
    } 
    DetailService.setImageToAnalyze = function (image) {
        imageToAnalyze =image;
    } 
    DetailService.getServingUnit = function () {
        return [0, .5, 1, 1.5 ,2, 2.5 ,3, 3.5, 4,5,6,7,8,9];
    } 
    DetailService.getIxServingForDish = function (ix) {
        return servingArray[ix] ;
    } 
    DetailService.getServingArray = function () {
        return servingArray ;
    } 
    // set the index serving for a single dish
    DetailService.setIxServingForDish = function (dix, servingIndex) {
        servingArray[dix]=servingIndex ;
    } 
    DetailService.setResults = function (inputJson) {
        analysisResults = inputJson ;
        //console.log('set results',inputJson,'to',analysisResults)
    } 
    // get all the dishes from VR above a treshold
    DetailService.getDishResults = function () {
        //console.log('analysisResults is',analysisResults.length)
        return analysisResults  ;
    } 
    DetailService.getTotalNutrients = function () {
        return totalNutrients;
    }
    DetailService.getNutrientForId = function (reqNutrientId) {
        var returnValue =0;
        var dishResults =DetailService.getDishResults ();
        
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
        var dishResults =DetailService.getDishResults ();
        
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
// copied from  https://gist.github.com/fisch0920/37bac5e741eaec60e983
.service('imageService', function ($http, $q, $timeout) {
  var NUM_LOBES = 3
  var lanczos = lanczosGenerator(NUM_LOBES)

  // resize via lanczos-sinc convolution
  this.resize = function (img, width, height,canvas) {
    var self = { }

    self.type    = "image/png"
    self.quality = 1.0
    self.resultD = $q.defer()

//    self.canvas = document.createElement('tempCanvas')

// create the canvas
//        var canvas = document.getElementById('tempCanvas');
    console.log('IN start canvas',canvas,'typeof' ,typeof canvas.width);
        canvas.width = 300.0;
        canvas.height = 300;
    console.log('after set context canvas',canvas,'w',canvas.width);
        var context = canvas.getContext('2d');
        // draw a rectangular white frame for our content
    console.log('The canvas',canvas);
    self.canvas = canvas ;

    self.ctx = getContext(self.canvas)
    self.ctx.imageSmoothingEnabled       = true
    self.ctx.mozImageSmoothingEnabled    = true
    self.ctx.oImageSmoothingEnabled      = true
    self.ctx.webkitImageSmoothingEnabled = true
    console.log('img.naturalWidth',img.naturalWidth)

    if (img.naturalWidth <= width || img.naturalHeight <= height) {
      console.log("FAST resizing image", img.naturalWidth, img.naturalHeight, "=>", width, height)

      self.canvas.width  = width
      self.canvas.height = height
      self.ctx.drawImage(img, 0, 0, width, height)
      resolveLanczos(self)
    } else {
      console.log("SLOW resizing image", img.naturalWidth, img.naturalHeight, "=>", width, height)

      self.canvas.width  = img.naturalWidth
      self.canvas.height = img.naturalHeight
      self.ctx.drawImage(img, 0, 0, self.canvas.width, self.canvas.height)

      self.img = img
      self.src = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height)
      self.dest = {
        width:  width,
        height: height
      }
      self.dest.data = new Array(self.dest.width * self.dest.height * 4)

      self.ratio     = img.naturalWidth / width
      self.rcpRatio  = 2 / self.ratio
      self.range2    = Math.ceil(self.ratio * NUM_LOBES / 2)
      self.cacheLanc = {}
      self.center    = {}
      self.icenter   = {}

      $timeout(function () { applyLanczosColumn(self, 0) })
    }

    return self.resultD.promise
  }

  function applyLanczosColumn (self, u) {
    self.center.x  = (u + 0.5) * self.ratio
    self.icenter.x = self.center.x | 0

    for (var v = 0; v < self.dest.height; v++) {
      self.center.y  = (v + 0.5) * self.ratio
      self.icenter.y = self.center.y | 0

      var a, r, g, b
      a = r = g = b = 0

      var norm = 0
      var idx

      for (var i = self.icenter.x - self.range2; i <= self.icenter.x + self.range2; i++) {
        if (i < 0 || i >= self.src.width) continue
        var fX = (1000 * Math.abs(i - self.center.x)) | 0
        if (!self.cacheLanc[fX]) {
          self.cacheLanc[fX] = {}
        }

        for (var j = self.icenter.y - self.range2; j <= self.icenter.y + self.range2; j++) {
          if (j < 0 || j >= self.src.height) continue

          var fY = (1000 * Math.abs(j - self.center.y)) | 0
          if (self.cacheLanc[fX][fY] === undefined) {
            self.cacheLanc[fX][fY] = lanczos(Math.sqrt(Math.pow(fX * self.rcpRatio, 2) + Math.pow(fY * self.rcpRatio, 2)) / 1000)
          }

          var weight = self.cacheLanc[fX][fY]
          if (weight > 0) {
            idx = (j * self.src.width + i) * 4
            norm += weight

            r += weight * self.src.data[idx + 0]
            g += weight * self.src.data[idx + 1]
            b += weight * self.src.data[idx + 2]
            a += weight * self.src.data[idx + 3]
          }
        }
      }

      idx = (v * self.dest.width + u) * 4
      self.dest.data[idx + 0] = r / norm
      self.dest.data[idx + 1] = g / norm
      self.dest.data[idx + 2] = b / norm
      self.dest.data[idx + 3] = a / norm
    }

    if (++u < self.dest.width) {
      if (u % 16 === 0) {
        $timeout(function () { applyLanczosColumn(self, u) })
      } else {
        applyLanczosColumn(self, u)
      }
    } else {
      $timeout(function () { finalizeLanczos(self) })
    }
  }

  function finalizeLanczos (self) {
    self.canvas.width  = self.dest.width
    self.canvas.height = self.dest.height
    //self.ctx.drawImage(self.img, 0, 0, self.dest.width, self.dest.height)
    self.src = self.ctx.getImageData(0, 0, self.dest.width, self.dest.height)
    var idx
    for (var i = 0; i < self.dest.width; i++) {
      for (var j = 0; j < self.dest.height; j++) {
        idx = (j * self.dest.width + i) * 4
        self.src.data[idx + 0] = self.dest.data[idx + 0]
        self.src.data[idx + 1] = self.dest.data[idx + 1]
        self.src.data[idx + 2] = self.dest.data[idx + 2]
        self.src.data[idx + 3] = self.dest.data[idx + 3]
      }
    }
    self.ctx.putImageData(self.src, 0, 0)
    resolveLanczos(self)
  }

  function resolveLanczos (self) {
    var result = new Image()

    result.onload = function () {
      self.resultD.resolve(result)
    }

    result.onerror = function (err) {
      self.resultD.reject(err)
    }

    result.src = self.canvas.toDataURL(self.type, self.quality)
  }

  // resize by stepping down
  this.resizeStep = function (img, width, height, quality) {
    quality = quality || 1.0

    var resultD = $q.defer()
    var canvas  = document.createElement( 'canvas' )
    var context = getContext(canvas)
    var type = "image/png"

    var cW = img.naturalWidth
    var cH = img.naturalHeight

    var dst = new Image()
    var tmp = null

    //resultD.resolve(img)
    //return resultD.promise

    function stepDown () {
      cW = Math.max(cW / 2, width) | 0
      cH = Math.max(cH / 2, height) | 0

      canvas.width  = cW
      canvas.height = cH

      context.drawImage(tmp || img, 0, 0, cW, cH)

      dst.src = canvas.toDataURL(type, quality)

      if (cW <= width || cH <= height) {
        return resultD.resolve(dst)
      }

      if (!tmp) {
        tmp = new Image()
        tmp.onload = stepDown
      }

      tmp.src = dst.src
    }

    if (cW <= width || cH <= height || cW / 2 < width || cH / 2 < height) {
      canvas.width  = width
      canvas.height = height
      context.drawImage(img, 0, 0, width, height)
      dst.src = canvas.toDataURL(type, quality)

      resultD.resolve(dst)
    } else {
      stepDown()
    }

    return resultD.promise
  }

  function getContext (canvas) {
    var context = canvas.getContext('2d')

    context.imageSmoothingEnabled       = true
    context.mozImageSmoothingEnabled    = true
    context.oImageSmoothingEnabled      = true
    context.webkitImageSmoothingEnabled = true

    return context
  }

  // returns a function that calculates lanczos weight
  function lanczosGenerator (lobes) {
    var recLobes = 1.0 / lobes

    return function (x) {
      if (x > lobes) return 0
      x *= Math.PI
      if (Math.abs(x) < 1e-16) return 1
      var xx = x * recLobes
      return Math.sin(x) * Math.sin(xx) / x / xx
    }
  }
})

.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});
;
