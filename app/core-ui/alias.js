//  Alias core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  'use strict';

  var Module = {};

  Module.id = 'alias';
  Module.dataTypes = ['ALIAS', 'ONETOMANY', 'MANYTOMANY'];

  Module.Input = Backbone.Layout.extend({

  });

  return Module;
});