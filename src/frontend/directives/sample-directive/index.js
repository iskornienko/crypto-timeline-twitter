import "./style.less";

let directive = angular.module('sample-directive',[])
    .directive('sampleDirective',[
        function () {
            return {
                restrict:"AEC",
                replace:true,
                scope:{
                    
                },
                template:require('./template.html'),
                controller: [
                    '$scope', '$http',
                    function ($scope, $http) {

                        $http({
                            method:'GET',
                            url:'/api/sample-get' //getting data from a proxy
                        }).then(function (response) {
                            //success callback
                            $scope.userIP = response.data.ip;

                        }, function (response) {
                            //error callback

                        })

                        var socket = io.connect();
                        socket.on('connect', function(data) {
                            //connected
                        });

                        socket.on('get-field-update', function(data) {
                            //get updates from server
                            $scope.syncInput = data;
                            $scope.$apply();
                        });

                        $scope.pushFieldUpdate = function () {
                            //push updates to server
                            socket.emit('push-field-update', $scope.syncInput);
                        }

                    }
                ]
            }}
    ])


export default directive.name;