//  Directus Email Component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'email';
  Module.dataTypes = ['VARCHAR'];

  Module.options = {};

  Module.Input = Backbone.Layout.extend({
    tagName: 'fieldset',
    initialize: function() {
      this.$input = $('<input type="text" value="'+(this.options.value || '')+'" name="'+this.options.name+'" id="'+this.options.name+'" maxlength="'+this.options.schema.get('char_length')+'"/>');
      this.$label = $('<span class="label char-count"></span>').html(this.options.schema.get('char_length')-this.$input.val().length).hide();
      this.$el.append('<label>'+app.capitalize(this.options.name)+'</label>');
      this.$el.append(this.$input);
      this.$el.append(this.$label);
    }
  });

  Module.list = function(options) {
    return '<a href="mailto:' + options.value + '">'+options.value+'</a>';
  };

  return Module;
});