angular.module('wiomPlate.controllers', [])

// Image selector. Either photo gallery or camera. For analyzing or training
.controller('ImageController', function($scope,$location, DetailService,$cordovaCamera,
    $ionicLoading, $state) {

    var originalPath =$location.$$path ; // analyz or train determined by the menu selection
    $scope.showButton= false ;

    if (originalPath=='/app/trainwatson') {
        console.log('trainwatson is called')
        $scope.pageTitle ="Train";
        $scope.buttonLabel='Train';
    } else {
        console.log('analyze myplate is called')
        $scope.pageTitle ="My Plate";
        $scope.buttonLabel='Analyze';
    } 

    $scope.initHidebutton = function () {
        console.log('-->>initHidebutton is called')
        $scope.showButton= false ;
        DetailService.initDetailService() ;
        $scope.pic='';
    }

    var gotPic2 = function(fileUri) {
        var imageToAnalyze = fileUri ;
        $ionicLoading.show({template: '<ion-spinner>Getting Image</ion-spinner>Analyzing...'});
        $scope.pic = imageToAnalyze;
        DetailService.setImageToAnalyze($scope.pic);
        window.resolveLocalFileSystemURL(imageToAnalyze, function(fileEntry) {
                fileEntry.file(function(fileObj) {
                    $ionicLoading.hide();
                    var imageSize = fileObj.size ;
                    if (imageSize > 2097152) {
                        console.log("Image size is BIG:= " +imageSize);
                    }
                    $scope.showButton= true ;
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
        $scope.showButton= false ;
        $scope.pic = '';
    }

    $scope.getImageFromCamera = function() { // use camera
        console.log('getImageFromCamera statrs')  ;       
        DetailService.initDetailService() ;
        $scope.pic = '';
        var options = { 
            quality : 25, 
            destinationType : Camera.DestinationType.FILE_URI, //DATA_URL, 
            sourceType : Camera.PictureSourceType.CAMERA, //PHOTOLIBRARY, will use library instead
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
        console.log('getImageFromGallery statrs')  ;       
        DetailService.initDetailService() ;
        $scope.pic = '';
        navigator.camera.getPicture(gotPic2, camErr2, {
            sourceType:Camera.PictureSourceType.PHOTOLIBRARY,
            destinationType:Camera.DestinationType.FILE_URI
        });
    }

    $scope.analyzeOrTrain  = function() {
        console.log('analyzeOrTrain originalPath=',originalPath);
        $scope.showButton= false ;
        $scope.pic = '';
        if (originalPath=='/app/trainwatson') {
            $state.go('app.traindish') ;
        } else {
            DetailService.setSendImageForAnalysis(true);
            $state.go('app.analyzedish') ;
        }

    }
}) // end image controller

// Analyze Image
.controller('AnalyzeController', function($scope,$location, DetailService,$cordovaCamera, $cordovaFileTransfer,
    $ionicLoading,$http,baseURL, $state) {

    var originalPath =$location.$$path ;
    console.log('AnalyzeController originalPath=',originalPath);

    var apiUrl ='';
    if (originalPath=='/app/analyzedummy') {
        apiUrl='uploadtest';
    } else {
        apiUrl='similarity';//another legacy option is: uploadvisual
    }
    var dishSelected ; // user selection for best fit dish

    $scope.initAnalyzeImage = function() { 
        var imageToAnalyze = DetailService.getImageToAnalyze();
        var sendImageForAnalysis =DetailService.getSendImageForAnalysis();
        console.log('initAnalyzeImage:',imageToAnalyze,'apiUrl',apiUrl,'path:',originalPath,
                    'analyze?',sendImageForAnalysis);
        
        if (sendImageForAnalysis ) { // do the analysis if first time on this page
            console.log('sendImageForAnalysis is true, therefore running analysis');
            DetailService.setAnalysisResults({});// reset before
            $scope.results ={};
            $scope.instructUser1 ='Analyzing your dish. Please wait...';
            $ionicLoading.show({template: '<ion-spinner>Analyzing Image</ion-spinner> Analyzing...'});
            
            if (apiUrl =='similarity') {//analyzing- post image and options to api/similarity
                var postOptions = {
                    fileKey: "image",
                    fileName: imageToAnalyze.split('/').pop(),
                    chunkedMode: false,
                    mimeType: "image/png"
                };
                $cordovaFileTransfer.upload(baseURL+"/api/"+apiUrl, imageToAnalyze, postOptions).then(successResults,failedResults); 
            } else  { // test image data
                console.log('Analyzing test image using http.get');
                $http.get(baseURL+'/api/'+apiUrl).then(successResults,failedResults); 
            }
           return ;
        } else {// don't repleat analysis if user go back
            var finalImageResults = DetailService.getAnalysisResults();
            console.log('Not doing analysis since finalImageResults is there:',finalImageResults.length);
            $scope.instructUser1 ='Select from suggested or create your own';
            $scope.showToDiarayButton=true;
            $scope.results ={'scores': finalImageResults};
        }
    } // end initAnalyzeImage function

    var successResults = function (result) {
        console.log('successResults');
        $ionicLoading.hide();
        var rawImageResults ;
        if (apiUrl =='similarity') {//uploadvisual
            rawImageResults = JSON.parse(result.response) ;
        } else {
            if (result.data) {
                rawImageResults = result.data ;
            } 
        }
        displayResults (rawImageResults);
    }

    var displayResults = function (imageResults) {
        var checkForError = JSON.stringify(imageResults) ;
        if (checkForError.indexOf('Error:')>0) {
            console.log('displayResults:',checkForError);
            $scope.instructUser1 =checkForError;
            return ;
        } else if (imageResults.length > 0) {
            $scope.instructUser1 ='Select from suggested or create your own';
            $scope.showToDiarayButton=true;
        } else {
            $scope.instructUser1 ='Image was not recognized as food.';
            $scope.showToDiarayButton=false;
            return ;
        }
        var finalImageResults = imageResults ;
        console.log('setting thumb-list for '+imageResults.length+' dishes');
        for (item in imageResults) {
            finalImageResults[item].actualServing =1;
            finalImageResults[item].dix =item ; // dish index
            finalImageResults[item].icon ='data:image/JPEG;base64,'+imageResults[item].icon ;//from server
            finalImageResults[item].calories=caloriesForDish(imageResults[item])+' Calories';
        }
        var newDish ={}; // add the dish that was analized
        newDish.foodId ='? Your Own Dish' ;
        newDish.calories ='? Calories' ;
        newDish.dix=99 ; // an arbitrary number for new dish
        newDish.icon= DetailService.getImageToAnalyze(); // original image
        newDish.metadata ={}
        newDish.metadata.nutInfo=[] ; 
        finalImageResults.push(newDish);
        $scope.results ={'scores': finalImageResults}; // assigning the results to html elements
        DetailService.setAnalysisResults(finalImageResults);// save for future usage
    }

    var failedResults =  function(err) {
        console.log('failedResults');

        $ionicLoading.hide();
        var error =JSON.stringify(err)
        console.log('File upload Error:',error);
        var res = error.split("title>");
        $scope.instructUser1 ='File Upload Error:'+res[1];
    } 
    $scope.newDishSelected = function(value) {
       console.log('>>>',value);
       if (value == 99) { // new dish
            $scope.isDishSelected=false; // false-if neither one of the real dishes is selected
       } else {
            dishSelected= value ;
            $scope.isDishSelected=true; // true-when one of the dishes is checked. 
       }
    }        

    $scope.gotoDishDetails = function() {
        console.log('ImageController gointo to DishDetailController with dishSelected',dishSelected);
        DetailService.setSendImageForAnalysis(false);
        $state.go('app.dishdetails',{dish:dishSelected });
    };

    $scope.gotoNewDishEntry = function() {
        console.log('ImageController gointo to TrainDishController');
        $state.go('app.traindish');
    };

    var caloriesForDish = function(dish) {
        var nutrients =dish.metadata.nutInfo ;
        //console.log('calcNutrients',nutrients);
        for (var i = 0; i < nutrients.length; i++) { 
            var nutrient =nutrients[i];
            if (nutrient.nid==208) {
                return nutrient.v ;
            }
        }
        return 0; // must be an error
    }

}) // end Analyze Image controller

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
    AuthService,$ionicPopup,$state, $ionicHistory,$stateParams) {

    //console.log('params=', JSON.stringify( $stateParams));
    var dishSelected =JSON.parse($stateParams.dish);
    var dishResult = DetailService.getSingleDish(dishSelected);
    console.log('DishDetailController. dish:',dishResult.foodId);
    $scope.nutrientName = dishResult.foodId;
    var servingIndex = DetailService.getServingSelected() ;
    $scope.serving = DetailService.getServingUnit()[servingIndex] ;

    $scope.header ={'b': $scope.serving * DetailService.getDishNutrient(dishSelected,208)};
    $scope.pic =dishResult.icon ;
    
    var mealType ;    
    $scope.selectedDate1=new Date().toJSON().slice(0,10);

    $scope.initDiary = function(){
        // check if user logged in to display diary button
        var username =AuthService.getUserLogin();
        if (username && username.length > 0) {
            $scope.showAddMealButton=true;
    //        console.log('Add Meal- button. User logged In. username:',username);
        }
        else {
            $scope.showAddMealButton=false;
      //      console.log('Login button. User is NOT logged In. username:',username);
        }
    }
    // Meal type
     $scope.mealOptions = [
        { id: 1, name: 'Breakfast' },
        { id: 2, name: 'Lunch' },
        { id: 3, name: 'Dinner' },
        { id: 4, name: 'Snack' }
    ];
    $scope.initMealSelected = function () {
        $scope.mealselected = $scope.mealOptions[0].id;
        mealType =$scope.mealOptions[0].name;
    }
    $scope.onChangeMeal = function (id) {
        console.log("id:"+id.name);
        mealType=id.name ;
    }    
    var ipObj1 = {
      callback: function (val) {  
        var date = new Date(val );
        console.log('Datepicker returns date:' +date);
        $scope.selectedDate1 = date;
      }
    };
    $scope.openDatePicker = function(){
      console.log('openDatePicker')
      ionicDatePicker.openDatePicker(ipObj1);
    };
    $scope.AddMealToDiary = function () {
        var oneDish ={'foodId':dishResult.foodId,'served': dishResult.actualServing,'icon':dishResult.icon} ;
        var mealNutirents =[], totalNutrients =dishResult.metadata.nutInfo; 
//        console.log('Before AddMealToDiary loop totalNutrients:',totalNutrients.length);
        for (var i in totalNutrients) {
            var x =totalNutrients[i];
            var nUnit = x.m ? x.m : x.u ;
            var mealNutirent ={'nId':x.nid,
                            'nName':x.name,
                            'nUnit':nUnit,
                            'nTotal': Math.round($scope.serving * x.v * 100 )/100 
                    };
            mealNutirents.push(mealNutirent);
        }
        var meal ={};
        meal.un=AuthService.getUserLogin(); // username
        var uDate =$scope.selectedDate1
        console.log('Using Date',uDate );
        meal.md =uDate ; // meal date
        meal.mt =mealType; // meal type
        meal.mr = oneDish; // meal results
        meal.mn =mealNutirents ; // meal nutrients
        console.log('Before POSTing to api/meal/add... meal is:',meal);
        // add to meals collections      
        $http.post(baseURL + '/api/meal/add', meal).then(function(result) {
            if (result.data.success) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Meal Diary success!',
                    template: result.data.msg
                });
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                DetailService.initDetailService ();
                $state.go('app.mealdiary'); // todo is that correct

            } else {
                var alertPopup = $ionicPopup.alert({
                    title: 'Meal Diary failed!',
                    template: result.data.msg
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
.controller('TestuiController', function($scope, DetailService,$cordovaCamera, $ionicLoading,baseURL) { 
 /*   var canvas = document.getElementById('signatureCanvas');
    console.log('testui canvas',canvas)
    var signaturePad = new SignaturePad(canvas);
 
    $scope.clearCanvas = function() {
        signaturePad.clear();
    }
 
    $scope.saveCanvas = function() {
        var sigImg = signaturePad.toDataURL();
        console.log('sigImg',sigImg,'size',sigImg.size)
        $scope.signature = sigImg;
    }
*/
    $scope.initHidebutton = function () {
        $scope.showButton= false ;
        $scope.pic = '';
        DetailService.initDetailService() ;
        //console.log('TestuiController initHidebutton hide and seek',$scope.hidebutton)
    }
    $scope.getDummyImage = function() { 
        console.log('start get getDummyImage')
        $scope.pic ='images/testimage.jpg';
        DetailService.initDetailService() ;
        DetailService.setImageToAnalyze($scope.pic);
        $scope.showButton= true ;
    }  
})

// Detail Nutrients Page
.controller('DishDetailController', function ($scope, DetailService, $stateParams, baseURL, 
    $ionicPopover, $ionicModal,$state) {

    //console.log('params=', JSON.stringify( $stateParams));
    var dishSelected =JSON.parse($stateParams.dish);
    var dishResult = DetailService.getSingleDish(dishSelected);
    console.log('DishDetailController. dish:',dishResult.foodId);
    $scope.nutrientName = dishResult.foodId;
    DetailService.setServingSelected(4); // start with 1 serving size
    $scope.nutrients =dishResult.metadata.nutInfo;
    $scope.pic =dishResult.icon ;
    
    $scope.measures = [];
    var label ;

    $scope.populateLists = function () {
        $scope.items = DetailService.getServingUnit() ;
        $scope.size ={}; //must use size.index format or list change won't work

        var servingIndex =DetailService.getServingSelected() ;
        $scope.size.index = servingIndex ;
        if (servingIndex >0) {
            var actualServing =DetailService.getServingUnit()[servingIndex] ;
            dishResult.actualServing =actualServing ;
            $scope.showAddDishDiary=true ;
            console.log('Possibaly updating actualServing to',actualServing, 'for dishSelected:',dishSelected);
        }else {
            console.log('Actual size is zero for dishSelected',dishSelected);
            $scope.showAddDishDiary=false ;
            dishResult.actualServing ='' ;
        }
        calcNutrients(actualServing);
    }
    
    $scope.changedTotal = function() {
        var servingIndex =$scope.size.index; // size's index
        var sizeAct = DetailService.getServingUnit()[servingIndex] ;
        if (sizeAct > 0) {
            dishResult.actualServing =sizeAct ; // actual?            
            $scope.showAddDishDiary=true ;
        } else {
            $scope.showAddDishDiary=false ;
            dishResult.actualServing ='';
        }
        console.log('changedTotal actualServingIx to',sizeAct, 'for dishSelected:',dishSelected);
        DetailService.setServingSelected(servingIndex);
//        DetailService.updateTotalNutrients(); // update the summry page
        calcNutrients(sizeAct);
    }

    $scope.gotoAddDishDiary = function() {
        console.log('DishDetailController gointo to MealController with dishSelected',dishSelected);
        $state.go('app.addmeal',{dish:dishSelected });
    };

    var calcNutrients = function(sizeAct) {
        var nutrients =dishResult.metadata.nutInfo ;
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
.controller('LoginCtrl', function($scope, AuthService, $ionicPopup, $state,$ionicHistory) {
    console.log('LoginCtrl')
  $scope.user = {
    name: '',
    password: ''
  };
 
  $scope.login = function() {
    console.log('login function',$scope.user)
    AuthService.login($scope.user).then(function(username) {
        //console.log('user login',AuthService.getUserLogin());
        var backView =$ionicHistory.backView();
        console.log('backView',backView);
        if (backView==null) {
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('app.home');
        } else {
            $ionicHistory.goBack();
        }
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
            var backView =$ionicHistory.backView();
            console.log('backView',backView);
            if (backView==null) {
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('app.home');
            } else {
                var backViewId =backView.backViewId;
                console.log('backViewId',backViewId);
                if (backViewId == null) {
                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $state.go('app.home');
                } else {
                    $ionicHistory.goBack(-2);
                }
            }

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
 
.controller('HomeCtrl', function($scope, AuthService,baseURL,$state,$ionicHistory,
        $ionicPopup,$http,CurrentVersion) {
    $scope.pic ='images/about.png';
//StateService.goBackMany();StateService

    var username =AuthService.getUserLogin();
    if (username && username.length > 0) {
        $scope.realUserLoggedIn=true; // real user logged in vs.
    } else {
        username='Guest';
        $scope.realUserLoggedIn=false; // guest        
    }
    $scope.username=username;
    console.log('Logged In as username:',username);

    $http.get(baseURL+'/api/app').success(function(app) {
        console.log('app',app);
        if (CurrentVersion < app.appver ) {
            var alertPopup = $ionicPopup.alert({
                title: 'MyPlate',
                template: 'A new version is available. Please download from app store'
            });
            $state.go('app.blank');            
        }
    });

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

.controller('MealdiaryCtrl', function($scope, $http,baseURL, AuthService, $ionicPopup,$state,$ionicHistory) {
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
        $http.get(baseURL+'/api/meal/list/'+username)
            .success(function(meals) {
                console.log('total meals:',meals.length);
                var meallist =[], totalEnergy = 0, icon;
                var dateChanged ,mealCount,types=[]; 
                for (var i in meals){
                    var date = meals[i].md.split("T")[0] ;
                    if (dateChanged !=date) {
                        if (i>0) {
                            var meal={'date':dateChanged,'types':types,'total':Math.round(totalEnergy)}
                            meallist.push(meal);
                            types =[];
                        } 
                        dateChanged = date ;
                        totalEnergy = 0;
                    }
                    var energy =findEnergy(meals[i].mn,208);
                    totalEnergy +=energy ;
                    //console.log('totalEnergy +=energy',i,totalEnergy,energy);
                    var mr = meals[i].mr[0];
                    if (mr) {
                        if (mr.icon ) {
                            icon =mr.icon;
                        } else {
                            icon ='images/foodicon.png';
                        } 
                        types.push({'mt':meals[i].mt,'cal':energy,'icon':icon,'name':mr.foodId});
                    } else {
                        console.log('logical error. dish is half backed',i,meals[i]);
                    }
                }
                if (meals.length > 0) {
                    var meal={'date':date,'types':types,'total':Math.round(totalEnergy)}
                    meallist.push(meal);
                } else {
                    meallist.push({'date':'No meal was entered yet'})
                }
                $scope.meals = {'list':meallist} ;
            })
            .error(function(err) {
                console.log('meal/list get error',err)
            });
    } else {  // user not logged in
        var alertPopup = $ionicPopup.alert({
            title: 'Not Logged In',
            template: 'Log in to add dishes and view your diary'
        });
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $state.go('app.login');
    }

 
})

.controller('TrainDishController', function($scope, DetailService, $ionicPopup,$state,
    $ionicHistory, $cordovaFileTransfer,$ionicLoading,$http,baseURL,$ionicPopup,AuthService) {

    var imageToAnalyze = DetailService.getImageToAnalyze();
    var dishServing =0;
    $scope.pic = imageToAnalyze ;
    $scope.size = {};
    $scope.populateLists = function () {
        console.log('traindish init is called.');
        $scope.dishInfo = DetailService.initDish() ;
        $scope.items = DetailService.getServingUnit() ;
        $scope.size.index = 0; // size.index works with list changes
    }

    $scope.changedTotal = function() {
        var servingIndex =$scope.size.index; // index
        dishServing = DetailService.getServingUnit()[servingIndex] ;
        //console.log('changedTotal actualServingIx to',actualServing, 'for servingIndex:',servingIndex);
    }

    $scope.enterNewDish = function() {
        //console.log('EnterNewDish is called $scope.dishInfo',JSON.stringify( $scope.dishInfo));
        //console.log('ca:',$scope.dishInfo.nutInfo[0].v,'serving',dishServing);
        if ($scope.dishInfo.nutInfo[0].v=='' || dishServing <0.1 ) {
            var err ='Dish name, Serving size and Calories are required fields';
            var alertPopup = $ionicPopup.alert({
                title: 'Adding a New Dish - Failed!',
                template: err
            });
            return ;
        } 
        var username =AuthService.getUserLogin();
        if (! username ) {// user not logged in
            var alertPopup = $ionicPopup.alert({
                title: 'Not Logged In',
                template: 'Log in to add your own dish'
            });
            $state.go('app.login');
            return ;
        }

        var nutArray = $scope.dishInfo.nutInfo ;
        var newNutArray =[];
        for (i in nutArray ) {
            var aNutrient = nutArray[i];
            if (aNutrient.v >0 ) {
                aNutrient.v =Math.round(aNutrient.v / dishServing  * 100 ) / 100
                newNutArray.push(aNutrient);
            }
        }
        $scope.dishInfo.nutInfo = newNutArray ;
        console.log('Nutrient Array:',$scope.dishInfo.nutInfo,'serving',dishServing);
        
        var postOptions = {
            fileKey: "image",
            fileName: imageToAnalyze.split('/').pop(),
            chunkedMode: false,
            mimeType: "image/png",
            params: {
                "metadata" : angular.toJson($scope.dishInfo) // JSON.stringify($scope.dishInfo)
            }
        };
        $ionicLoading.show({template: '<ion-spinner>Loading Image</ion-spinner>Adding New Dish...'});
        $cordovaFileTransfer.upload(baseURL+"/api/addnewdish",imageToAnalyze,postOptions).then(function(result) {
            $ionicLoading.hide();
            var resJson =JSON.parse(result.response);
            if (resJson.success) {            
                console.log('Successfuly added a new image. ID:',resJson.msg);
                var imgId=resJson.msg.dishid;
                var dishname =resJson.msg.name  ;
                var alertPopup = $ionicPopup.alert({
                    title: 'Added a New Dish Successfully',
                    template: dishname
                });
                console.log('dishname',dishname)
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                DetailService.initDetailService ();
                $state.go('app.home');
                
            } else { // error
                console.log('ERROR adding a new dish. resJson',resJson.msg);
                var alertPopup = $ionicPopup.alert({
                    title: 'Adding a New Dish - Failed!',
                    template: resJson.msg
                });
            }
        },function (error){
            $ionicLoading.hide();
            var err =JSON.parse( error.body );
            console.log('ERROR adding a new dish. ERROR',JSON.stringify( error),'err',JSON.stringify(err.error));
            var alertPopup = $ionicPopup.alert({
                title: 'Adding a New Dish - Failed!',
                template: err.error
            }); 
        });
       $ionicLoading.hide();
    };
})

.controller('AboutController', ['$scope', 'baseURL',function($scope, baseURL) {
        $scope.baseURL=baseURL;
        console.log('AboutController is called');
}])

.controller('BlankController', function($scope) {
    $scope.pic ='images/about.png';
    console.log('BlankController is called');
})

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
    

  
/* taken from:
    $scope.analyzeImage = function() { 
        console.log('analyzeImage',originalPath);

        // check if user logged in to display diary button
        var username =AuthService.getUserLogin();
        if (username && username.length > 0) {
            $scope.showAddMealButton=true;
            console.log('Show button. User logged In. username:',username);
        }
        else {
            $scope.showAddMealButton=false;
            console.log('Do Not Show button. User is NOT logged In. username:',username);
        }

*/
/* removed from myplate-step1 (header: cache-view="false")
        <div  class="col text-center" ng-if="showAddMealButton==true && showToDiarayButton==true">
          <button class="button button-block button-positive" ui-sref="app.addmeal">Add Dish to Food Diary</button>
        </div>
*/
/* to set next view as root
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });        */
/* myplate-step3 is now addmeal
              <div class="col col-75">
                  <select ng-init="initMealSelected()" ng-model="mealselected" 
    ng-options="count.id as count.name for count in mealOptions" ng-change="onChangeMeal(mealOptions[mealselected-1])">
                  </select>
              </div>

*/