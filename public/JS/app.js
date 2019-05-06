
var app = angular.module("myapp", ['ngRoute']);

app.config(function ($routeProvider) {

    $routeProvider
        .when('/', {
            template: "<h1>Please login/signup to use Message App!!</h1>"
        })
        .when("/signup", {
            templateUrl: "views/signup.html",
            controller: "mycntrl"
        })
        .when("/home", {
            templateUrl: "views/home.html",
            controller: "mycntrl",
            resolve: ["authservice",function(authservice){
                return authservice.checkuserstatus();
            }]
        })
        .when("/login", {
            templateUrl: "views/login.html",
            controller: "mycntrl"
        })
        .when("/message", {
            templateUrl: "views/message.html",
            controller: "messagecntrl",
            resolve: ["authservice",function(authservice){
                return authservice.checkuserstatus();
            }]
        })
        .when("/messagedetail/:mid", {
            templateUrl: "views/messagedetail.html",
            controller: "messagedetail",
            resolve: ["authservice",function(authservice){
                return authservice.checkuserstatus();
            }]
        });
    // .otherwise({
    //     template: "<h4>Invalid route, Please try later!!!</h4>"
    // });
});

app.factory("authservice", function($location){
return{
    secretToken:getToken(),
    checkuserstatus: function(){        
        if(this.secretToken){                        
            return true;
        }
        else{
            $location.path(['/login']);
            return false;
        }
    }
}

});

app.controller("mycntrl", function ($scope, $http, $location, $rootScope) {

    // For login page
    var user;
    $rootScope.isLoggedin = HideShowLink();
    $scope.showinvalidcredentials = false;
    $scope.Login = function () {

        $http.post("http://localhost:3000/IsUserAvailable", this.user)
            .then(function (resp) {

                if (resp.data.data == "available") {
                    localStorage.setItem("token", resp.data.token);
                    $location.path(["/home"]);
                    $rootScope.isLoggedin = HideShowLink();
                }
                else {
                    $scope.showinvalidcredentials = true;
                }
            })
            .catch(function (ex) {
                console.log(ex.message);
            });

    };

    $scope.Logout = function () {
        $rootScope.isLoggedin = true;
        localStorage.removeItem("token");
    }

    // For Sign-up page
    var signup;
    $scope.submitNewUser = function () {
        $http.post("http://localhost:3000/createUser", this.signup).then(function (resp) {
            if (resp.status == 200) {
                $location.path(["/login"]);
            }
        })
            .catch(function (ex) {
                console.log(ex.message);
            });
    };

});

app.controller("messagecntrl", function ($scope, $http, $route) {


    $http.get("http://localhost:3000/binddropdown", {
        headers: { 'token': getToken() }
    })
        .then(function (resp) {
            $scope.data = {
                availableOptions: resp.data
            };
        })
        .catch(function (ex) {
            console.log(ex.message);
        });

    $http.get("http://localhost:3000/getmessages", {
        headers: { 'token': getToken() }
    })
        .then(function (resp) {
            $scope.messagedata = resp.data;
        })
        .catch(function (ex) {
            console.log(ex.message);
        });

    $scope.Sendmessage = function () {        
        if ($scope.msg.username != undefined) {
            $scope.msg.IsImportant = false;
            $http.post("http://localhost:3000/SendMessage", $scope.msg, {
                headers: { 'token': getToken() }
            })
                .then(function (resp) {
                    alert(resp.data);
                    //$scope.msg = {};
                    $route.reload();
                })
                .catch(function (ex) {
                    console.log(ex.message);
                });
        }
        else {
            alert("Please select user");
        }
    }

});

app.controller("messagedetail", function ($scope, $http, $routeParams, $location, $timeout, $route) {

    $scope.showhideMsg = false;

    var messageId = { messageid: $routeParams['mid'] };
    $http.post("http://localhost:3000/getmessagedetail", messageId, {
        headers: { 'token': getToken() }
    })
        .then(function (resp) {
            $scope.chkselct = resp.data[0].IsImportant;
            $scope.messagedetaildata = resp.data;
        })
        .catch(function (ex) {
            console.log(ex.message);
        });

    $scope.markImportant = function () {
        if (this.chkselct == true) {
            markImportantMsg(true);
        }
        else {
            markImportantMsg(false);
        }
    };

    function markImportantMsg(IsImprtnt) {
        let msgIdwithIsImp = messageId;
        msgIdwithIsImp.isImpo = IsImprtnt;

        $http.post("http://localhost:3000/setUnsetMsgImp", msgIdwithIsImp, {
            headers: { 'token': getToken() }
        })
            .then(function (resp) {
                $scope.showhideMsg = true;
                $scope.updatedMsgforImpField = resp.data;
                $timeout(function () {
                    $scope.showhideMsg = false;
                }, 2000);

            })
            .catch(function (ex) {
                console.log(ex.message);
            });
    }

    $http.get("http://localhost:3000/binddropdown", {
        headers: { 'token': getToken() }
    })
        .then(function (resp) {
            $scope.data = {
                availableOptions: resp.data
            };
        })
        .catch(function (ex) {
            console.log(ex.message);
        });

    $scope.Sendmessage = function () {        
        if ($scope.msg.username != undefined) {
            $scope.msg.IsImportant = false;
            $http.post("http://localhost:3000/SendMessage", $scope.msg, {
                headers: { 'token': getToken() }
            })
                .then(function (resp) {
                    alert(resp.data);                    
                    $route.reload();
                })
                .catch(function (ex) {
                    console.log(ex.message);
                });
        }
        else {
            alert("Please select user");
        }
    }

    $scope.DeleteMessage = function (mid) {
        var messid = { id: mid };
        $http.post("http://localhost:3000/Deletemsg", messid, {
            headers: { 'token': getToken() }
        }).then(function (resp) {
            if (resp.status == 200 && resp.data == "user deleted") {
                $location.path(['/message']);
            }
        })
            .catch(function (ex) {
                console.log(ex.message);
            });
    };

    $scope.BacktoList = function () {
        $location.path(['/message']);
    };
});

function getToken() {    
    if (localStorage.getItem("token")) {        
        return localStorage.getItem("token");
    }
}

function HideShowLink() {
    if (localStorage.getItem("token")) {
        return true;
    }
    else {
        return false;
    }
}
