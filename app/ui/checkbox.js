//  Checkbox core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'checkbox';
  Module.dataTypes = ['TINYINT'];

  Module.Input = Backbone.Layout.extend({
    tagName: 'fieldset',
    beforeRender: function() {
      this.$el.html('<label>'+ app.capitalize(this.options.schema.id) +'</test>');
      this.$el.append('<input type="checkbox" name="'+this.options.name+'" id="'+this.options.name+'"/>');
    },
    initialize: function() {
      this.render();
    }
  });

  Module.list = function(options) {
    var val = (options.value) ? '<input type="checkbox" checked="true" disabled>' : '<input type="checkbox" disabled>';
    //var val = options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100);
    return val;//val;
  };


  return Module;
});