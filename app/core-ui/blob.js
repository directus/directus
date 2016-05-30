//  Blob core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

  var Input = UIView.extend({
    initialize: function() {
      var image = document.createElement('img');
      image.src = 'data:image/png;base64,'+this.options.value;
      this.$el.append('<label>'+app.capitalize(this.options.name)+'</label>');
      this.$el.append(image);
    }
  });

  var Component = UIComponent.extend({
    id: 'blob',
    dataTypes: ['BLOB','MEDIUMBLOB'],
    Input: Input,
    list: function(options) {
      return 'BLOB';
    }
  });

  return new Component();
});
