//  Blob core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  'use strict';

  var Module = {};

  Module.id = 'blob';
  Module.dataTypes = ['BLOB','MEDIUMBLOB'];

  Module.Input = Backbone.Layout.extend({
    tagName: 'div',
    attributes: {
      'class': 'field'
    },
    initialize: function() {
      var image = document.createElement('img');
      image.src = 'data:image/png;base64,'+this.options.value;
      this.$el.append('<label>'+app.capitalize(this.options.name)+'</label>');
      this.$el.append(image);
    }
  });

  Module.list = function(options) {
    return 'BLOB';
  };


  return Module;
});