angular.module('wiomPlate.controllers', [])

// image loader
.controller('ImageController', function($scope,$location, DetailService,$cordovaCamera, $cordovaFileTransfer,
    $ionicLoading,$http,baseURL,$ionicPopup, AuthService,imageService) {
    var originalPath =$location.$$path ; // determine by the menu selected
    var galleryOrCamera = 0 ;//gallery
    $scope.initHidebutton = function () {
        $scope.hidebutton= true ;
        $scope.pic = '';
        DetailService.initDetailService() ;
    }
    var gotPic2 = function(fileUri) {
        $ionicLoading.show({template: '<ion-spinner>Getting Image</ion-spinner>Analyzing...'});
        $scope.pic = fileUri;
        window.resolveLocalFileSystemURL(fileUri, function(fileEntry) {
                fileEntry.file(function(fileObj) {
                    $ionicLoading.hide();
                    var imageSize = fileObj.size ;
                    console.log("Image size:= " +imageSize);
                    if (imageSize > 2097152) {
                        console.log("BEFORE Image size:= " +imageSize);
                        imageService.resize(fileObj, 256, 256)
                            .then(function (resizedImage) {
                                console.log("After Image size:= " +resizedImage.size);
                            })                        
                        console.log('After resize');
                        $scope.hidebutton= true ;
                        showAlert();
                        return ;
                    }
                    $scope.hidebutton= false ;
                    DetailService.setImageToAnalyze($scope.pic);
                    console.log("Ready to analyze image:", $scope.pic);    
                });
            },function(fail){
                $ionicLoading.hide();
                console.log('File System error',fail);
            }
        );
    }
    var camErr2 = function(e) {
        $ionicLoading.hide();
        console.log("Error from getImageFromGallery:", e);    
        $scope.hidebutton= true ;
        $scope.pic = '';
    }

    $scope.takePicture = function() { // use camera
        galleryOrCamera = 1 ;// camera
        DetailService.initDetailService() ;
        $scope.pic = '';
        var options = { 
            quality : 25, 
            destinationType : Camera.DestinationType.FILE_URI, //DATA_URL, 
            sourceType : Camera.PictureSourceType.CAMERA, 
            allowEdit : true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 250,
            targetHeight: 250,
            popoverOptions: CameraPopoverOptions,
            correctOrientation: true ,
            saveToPhotoAlbum: false
        };
        $cordovaCamera.getPicture(options).then(gotPic2,camErr2);
    }
    $scope.getImageFromGallery = function() { 
        galleryOrCamera = 0 ;//gallery
        console.log('getImageFromGallery statrs')  ;       
        DetailService.initDetailService() ;
        $scope.pic = '';
        navigator.camera.getPicture(gotPic2, camErr2, {
            sourceType:Camera.PictureSourceType.PHOTOLIBRARY,
            destinationType:Camera.DestinationType.FILE_URI
        });
    }
    var showAlert = function() {
        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'Image size exceeds maximum allowable size  (2MB). Please use proper size.'
        });

        alertPopup.then(function(res) {
             console.log('Image too big');
             $scope.hidebutton= true ;
        });
    };

 	$scope.analyzeImage = function() { 
        // check if user logged in to display diary button
        console.log('analyzeImage',originalPath)
        var username =AuthService.getUserLogin();
        if (username && username.length > 0) {
            $scope.showAddMealButton=true;
            console.log('Show button. User logged In. username:',username);
        }
        else {
            $scope.showAddMealButton=false;
            console.log('Do Not Show button. User is NOT logged In. username:',username);
        }

        var apiUrl ='';
        if (originalPath=='/app/analyzedummy') {
            apiUrl='uploadtest';
        } else {
            apiUrl='similarity';//uploadvisual
        }
        console.log('before getImageToAnalyze',apiUrl);
        var image = DetailService.getImageToAnalyze();
        console.log('analyzeImage:',image,'apiUrl',apiUrl);
        var displayResults = function (imageResults) {
            var checkForError = JSON.stringify(imageResults) ;
            if (checkForError.indexOf('Error:')>0) {
                console.log('displayResults:',checkForError);
                $scope.header ={'a':checkForError,'b':''};
                return ;
            } else if (imageResults.length > 0) {
                $scope.header ={'a':'Dish','b':'Actual Serving'};
            } else {
                $scope.header ={'a':'Image was not recognized as food.','b':''};
                return ;
            }
            $scope.results = imageResults;
            if (imageResults) {
                for (item in imageResults) {
                    console.log('set serving for dish',item)
                    DetailService.setIxServingForDish (item,2); // set the index to 2, actual is 1 
                    var str =imageResults[item].foodId.substr(0,32) ;
                    str = str + new Array(str.length <35 ? 35-str.length:1).join(' ');                    
                    imageResults[item].shortName =str;
                    imageResults[item].actualServing =1;
                    imageResults[item].dix =item ; // dish index
                }
                $scope.results ={'scores': imageResults}; // assigning the results to html elements
                // total the nutrients
            }
            DetailService.setResults(imageResults);
            $scope.header2 = {'nutrient':'Nutrient','total':'Total','unit':'Unit'};
            console.log('before')
            $scope.totalNutrients = DetailService.updateTotalNutrients();
        };
        var fileUri = image ;
        var imageResults = DetailService.getDishResults();
        if (imageResults.length >0) {
            console.log('Not doing analysis since imageResults.length:',imageResults.length);
            displayResults (imageResults);
            return ;
        }
        // do the analysis
        $scope.results ={};
        $scope.header ={'a':'','b':'','c':''};
        $ionicLoading.show({template: '<ion-spinner>Analyzing Image</ion-spinner> Analyzing...'});
		
        var successResults = function (result) {
            $ionicLoading.hide();
            var imageResults ;
            if (apiUrl =='similarity') {//uploadvisual
                imageResults = JSON.parse(result.response) ;
            } else {
                if (result.data) {
                    imageResults = result.data ;
                } 
            }
            displayResults (imageResults);
        }
      
        var failedResults =  function(err) {
            $ionicLoading.hide();
            var error =JSON.stringify(err)
            console.log('File upload Error:',error);
            var res = error.split("title>");
            $scope.header ={'a':'File Upload Error:', 'b':res[1]};
        } ;
        if (apiUrl =='similarity') {//uploadvisual
            var postOptions = {
                fileKey: "image",
                fileName: fileUri.split('/').pop(),
                chunkedMode: false,
                mimeType: "image/png"
            };
            if (galleryOrCamera==1) { //
                console.log('Analyzing image from Camera');
                $cordovaFileTransfer.upload(baseURL+"/api/"+apiUrl,fileUri, postOptions).then(successResults,successResults);
            } else { // 
                console.log('Analyzing image from Gallery');
                $cordovaFileTransfer.upload(baseURL+"/api/"+apiUrl, fileUri, postOptions).then(successResults,failedResults); 
            }
        } else     {
            console.log('Analyzing test image using http.get');
            $http.get(baseURL+'/api/'+apiUrl).then(successResults,failedResults); 
        }

    }
}) 

.controller('NavCtrl', function($scope, $location, $state) {
 
  $scope.create = function() {
    $state.go('app.detail');
  };
  $scope.close = function() { 
    console.log('who colsed that view?');
     $state.go('app.home'); 
  };
})  

//
// Meal Diary. Meal entry form
.controller('MealController', function($scope,DetailService,$http,baseURL,ionicDatePicker,
    AuthService,$ionicPopup,$state, $ionicHistory) {
    var mealType ;    
    $scope.selectedDate1=new Date().toJSON().slice(0,10);

    var ipObj1 = {
      callback: function (val) {  //
        console.log('Return value from the datepicker popup is : ' + val, new Date(val));
        $scope.selectedDate1 = new Date(val);
      }
    };

    $scope.openDatePicker = function(){
      console.log('openDatePicker')
      ionicDatePicker.openDatePicker(ipObj1);
    };
    // Meal type
     $scope.mealOptions = [
        { id: 1, name: 'Breakfast' },
        { id: 2, name: 'Lunch' },
        { id: 3, name: 'Dinner' },
        { id: 4, name: 'Snack' }
    ];
    $scope.onchange = function(id) {
        console.log(id,"id:"+id.name);
    }
    $scope.initMealSelected = function () {
        $scope.mealselected = $scope.mealOptions[0].id;
        mealType =$scope.mealOptions[0].name;
    }
    $scope.onChangeMeal = function (id) {
        console.log("id:"+id.name);
        mealType=id.name ;
    }    

    var dishResults =DetailService.getDishResults ();
    var mealResults =[];

    for (item in dishResults) {
        var iXservingForDish = DetailService.getIxServingForDish(item) ;
        var element = dishResults[item] ;
        if (iXservingForDish >0) { 
            var x ={'shortName':element.foodId.substr(0,32),'actualServing': dishResults[item].actualServing} ;
            mealResults.push(x)
        } 
    }
    $scope.header ={'a':'Calories in this Meal:','b':DetailService.getNutrientForId(208)};
    $scope.results ={'scores': mealResults}; 

    $scope.AddMealToDiary = function () {
        var dishResults =DetailService.getDishResults ();
        var mealResults = [];
        for (item in dishResults) {
            var iXservingForDish = DetailService.getIxServingForDish(item) ;
            var element = dishResults[item] ;
            if (iXservingForDish >0) { 
                var x ={'foodId':element.foodId,'served': dishResults[item].actualServing} ;
                mealResults.push(x)
            }
        }

        var mealNutirents =[], totalNutrients =DetailService.getTotalNutrients();
        for (i in totalNutrients) {
            var x =totalNutrients[i];
            var mealNutirent ={'nId':x.nid,
                                'nName':x.nutrientName,
                                'nUnit':x.nutrientUnit,
                                'nTotal':x.nutrientTotal
                    };
            mealNutirents.push(mealNutirent);
        }
        var meal ={};
        meal.un=AuthService.getUserLogin(); // username
        meal.md =$scope.selectedDate1 ; // meal date
        meal.mt =mealType; // meal type
        meal.mr = mealResults; // meal results
        meal.mn =mealNutirents ; // meal nutrients
        console.log('AddMealToDiary. meal:',meal);
        // add to meals collections      
        $http.post(baseURL + '/api/meal/add', meal).then(function(result) {
            console.log('clicked for meal diary:',meal);
            if (result.data.success) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Meal Diary success!',
                    template: result.data.username
                });
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('app.mealdiary');
            } else {
                var alertPopup = $ionicPopup.alert({
                    title: 'Meal Diary failed!',
                    template: result.data.username
                });
            }
        }, function(errMsg) {
            var alertPopup = $ionicPopup.alert({
                title: 'Meal Diary failed!',
                template: errMsg
            });
        });
    }
})  


// For quick browser testing
// analyze the image via api/uploadtest and api/similarity
.controller('TestuiController', function($scope, DetailService,$cordovaCamera, $cordovaFile,$ionicLoading,baseURL) { 
    $scope.initHidebutton = function () {
        $scope.hidebutton= true ;
        $scope.pic = '';
        DetailService.initDetailService() ;
        //console.log('TestuiController initHidebutton hide and seek',$scope.hidebutton)
    }
    $scope.getDummyImage = function() { 
        $scope.pic ='images/testimage.jpg';
        DetailService.initDetailService() ;
        DetailService.setImageToAnalyze($scope.pic);
        $scope.hidebutton= false ;
    }  
//    console.log('TestuiController. hidebutton:',$scope.hidebutton ,'total.length:'+DetailService.getServingArray().length);
})

// Detail Nutrients Page
.controller('DishDetailController', function ($scope, DetailService, $stateParams, baseURL, 
    $ionicPopover, $ionicModal) {

    //console.log('params=', JSON.stringify( $stateParams));
    var params =JSON.parse($stateParams.name);
    var dishResults = DetailService.getDishResults();
    var dix =params.dix ; // dish index
    console.log('DishDetailController. name:',params.foodId,'serving:',
        params.actualServing,'for dish:',dix); //'# nutrients',params.nutrients.length) ;
    $scope.nutrientName = params.foodId;
    $scope.serving = params.serving;
    $scope.nutrients =params.metadata.nutInfo;
    
    
    $scope.measures = [];
    var label ;

    $scope.populateLists = function () {
        if (typeof dishResults.length=='undefined')
            return ;

        $scope.items = DetailService.getServingUnit() ;
        $scope.size = {};
        //$scope.size.index = params.actualServingIx ; // initial setting to 1 serving size. index is 2

        var servingIndex =DetailService.getIxServingForDish(dix) ;
        $scope.size.index = servingIndex ;
//        var sizeActIx=$scope.items[$scope.size.index]; 
        if (servingIndex >0) {
            var actualServing =DetailService.getServingUnit()[servingIndex] ;
            dishResults[dix].actualServing =actualServing ;
            console.log('Possibaly updating actualServing to',actualServing, 'for dix:',dix);
        }else {
            console.log('Actual size is zero for dix',dix);
            dishResults[dix].actualServing ='' ;
        }
        calcNutrients(actualServing);
    }
    
    $scope.changedTotal = function() {
        var servingIndex =$scope.size.index; // size's index
        var sizeAct = DetailService.getServingUnit()[servingIndex] ;
        if (sizeAct > 0) {
            dishResults[dix].actualServing =sizeAct ; // actual?            
        } else {
            dishResults[dix].actualServing ='';
        }
        console.log('changedTotal actualServingIx to',sizeAct, 'for dix:',dix);
        DetailService.setIxServingForDish(dix,servingIndex);
        DetailService.updateTotalNutrients(); // update the summry page
        calcNutrients(sizeAct);
    }

    var calcNutrients = function(sizeAct) {
        var nutrients =params.metadata.nutInfo ;
        console.log('calcNutrients',nutrients);
        for (var i = 0; i < nutrients.length; i++) { // recalculation of ingredient measurements
            var nutrient =nutrients[i];
            if (nutrient.nid==208) {
                console.log('nutrient',nutrient.v,'sizeAct',sizeAct);
                $scope.nutrients[i].m='Calories';
            }
            $scope.nutrients[i].value= Math.round(sizeAct * nutrient.v * 100 )/100 ;
        }    

    }
})

// copied
.controller('LoginCtrl', function($scope, AuthService, $ionicPopup, $state) {
    console.log('LoginCtrl')
  $scope.user = {
    name: '',
    password: ''
  };
 
  $scope.login = function() {
    console.log('login function',$scope.user)
    AuthService.login($scope.user).then(function(username) {
        console.log('user login',AuthService.getUserLogin());
        $state.go('app.home');
    }, function(errMsg) {
      var alertPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: errMsg
      });
    });
  };
})
 
.controller('RegisterCtrl', function($scope, AuthService, $ionicPopup, $state,$ionicHistory) {
    $scope.user = {
        name: '',
        password: ''
    };
    console.log('RegisterCtrl');
    $scope.signup = function() {
        AuthService.register($scope.user).then(function(username) {
            console.log('signup for user:',$scope.user);
            //$ionicSideMenuDelegate.toggleLeft();
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('app.home');
            var alertPopup = $ionicPopup.alert({
                title: 'Registered Successfully',
                template: $scope.user.name 
            });
        }, function(errMsg) {
            var alertPopup = $ionicPopup.alert({
                title: 'Registration failed!',
                template: errMsg
            });
        });
    };
})
 
.controller('HomeCtrl', function($scope, AuthService,baseURL,$state,$ionicHistory,$ionicPopup) {
    $scope.pic ='images/about.png';
    var username =AuthService.getUserLogin();
    if (username && username.length > 0) {
        $scope.realUserLoggedIn=true; // real user logged in vs.
    } else {
        username='Guest';
        $scope.realUserLoggedIn=false; // guest        
    }
    $scope.username=username;
    console.log('Logged In as username:',username);

    $scope.gotoMealdiary = function() {
        console.log('HomeCtrl gointo to mealdiary');
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });        
        $state.go('app.mealdiary');
    };
    $scope.gotoMyplate = function() {
        console.log('HomeCtrl going to my plate')
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $state.go('app.myplate',{}, {reload: true});// why myplate shows home and not side menu
    }
    $scope.gotoLogin = function() {
        console.log('HomeCtrl going to login')
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $state.go('app.login');
    };
    $scope.logout = function() {
        console.log('HomeCtrl logout')
        AuthService.logout();
        $state.go($state.current, {}, {reload: true});
        var alertPopup = $ionicPopup.alert({
            title:  'Successfully Logged Out',
            template: username
        });    
    };
})

// not clear for the purpuse of this... 
.controller('AppCtrl', function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS, baseURL) {
  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    console.log('AppCtrl notAuthenticated:',event) ;
    AuthService.logout();
    $state.go('app.login');
    var alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, You have to login again.'
    });
  });
})

.controller('MealdiaryCtrl', function($scope, $http,baseURL, AuthService) {
    console.log('MealdiaryCtrl')
    var findEnergy = function(nutrients,nutrientId) {
        for (var i = 0; i < nutrients.length; i++) {
            var nutrient =nutrients[i];
            if (nutrient.nId ==nutrientId) {
                return nutrient.nTotal ;
            }
        }    
        return 0;    
    }
    var username =AuthService.getUserLogin();
    if (username && username.length > 0) {
        console.log('mealdiary. meals for user',username)
        $scope.icon ='images/foodicon.png';
        $http.get(baseURL+'/api/meal/list/'+username)
            .success(function(meals) {
                console.log('meals size',meals.length);
                var meallist =[];
                var dateChanged ,mealCount,types=[]; 
                for (var i in meals){
                    var date = meals[i].md.split("T")[0]
                    if (dateChanged !=date) {
                        if (i>0) {
                            var meal={'date':dateChanged,'types':types}
                            meallist.push(meal);
                            types =[];
                            console.log('meal',meal);
                        } 
                        dateChanged = date ;
                    }
                    var energy =findEnergy(meals[i].mn,208);
                    types.push({'mt':meals[i].mt,'cal':energy});
                }
                if (meals.length > 0) {
                    var meal={'date':date,'types':types}
                    meallist.push(meal);
                    console.log('meal',meal);
                } else {
                    meallist.push({'date':'No meal was entered yet'})
                }
                $scope.meals = {'list':meallist} ;
            })
            .error(function(err) {
                console.log('meal/list get error',err)
            });
    }
 
})

.controller('TrainWatsonController', ['$scope','baseURL',function($scope) {
        console.log('trainwatson is called');
 }])

.controller('AboutController', ['$scope', 'baseURL',function($scope, baseURL) {
        $scope.baseURL=baseURL;
        console.log('AboutController is called');
      }])

.filter('favoriteFilter', function () {
    return function (dishes, favorites) {
        var out = [];
        for (var i = 0; i < favorites.length; i++) {
            for (var j = 0; j < dishes.length; j++) {
                if (dishes[j].id === favorites[i].id)
                    out.push(dishes[j]);
            }
        }
        return out;

    }});
;
    

  