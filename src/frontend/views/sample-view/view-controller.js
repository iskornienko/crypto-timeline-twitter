
let controller = angular.module('sample-view-controller',[])
    .controller('SampleViewController', function($scope, $routeParams) {
        $scope.name = 'ChapterController';
        $scope.params = $routeParams;
    })


export default controller.name;