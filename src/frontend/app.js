
import 'angular';
import ngRoute from 'angular-route';

import sampleDirective from './directives/sample-directive';

import sampleViewController from './views/sample-view/view-controller';

angular.module('angular-d3-webpack-node-boilerplate',[ngRoute, sampleDirective, sampleViewController])
    .config(function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/SampleView', {
                template: require('./views/sample-view/view-template.html'),
                controller: 'SampleViewController'
            })
            .otherwise({ redirectTo: '' }); //This could be one of the above routes

        $locationProvider.html5Mode(true);
    });