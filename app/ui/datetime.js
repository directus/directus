//  Datetime core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'datetime';
  Module.dataTypes = ['DATETIME'];

  Module.Input = Backbone.Layout.extend({
    tagName: 'fieldset',
    initialize: function() {
      this.$el.append('<label>'+ app.capitalize(this.options.schema.id) +'</label>');
      this.$el.append('<input type="text" value="'+(this.options.value || '')+'" name="'+this.options.name+'" id="'+this.options.name+'" maxlength="'+this.options.schema.get('char_length')+'"/>');
    }
  });

  Module.list = function(options) {
    return '<div title="'+options.value+'">' + jQuery.timeago(options.value) + '</div>';
  };


  return Module;
});