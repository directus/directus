//  Numeric core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'numeric';
  Module.dataTypes = ['TINYINT', 'INT', 'NUMERIC', 'FLOAT', 'YEAR', 'VARCHAR', 'CHAR','DOUBLE'];


  Module.options = {
    options: []
  };

  Module.variables = [
    {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }}
  ];

  Module.Input = Backbone.Layout.extend({
    tagName: 'fieldset',
    events: {
      'keydown input': function(e) {
        if (!e.metaKey && !(e.which < 58 || (this.hasDecimals && e.which === 190))) {
          e.preventDefault();
        }
      },
      'blur input': function(e) {
        var val;
        if (!this.$input.val()) return;
        if (this.hasDecimals) {
          val = parseFloat(this.$input.val(), 10);
        } else {
          val = parseInt(this.$input.val(), 10);
        }
        this.$input.val(val);
      }
    },
    initialize: function(options) {
      var size = (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large';
      this.$input = $('<input type="text" value="'+(this.options.value || '')+'" name="'+this.options.name+'" id="'+this.options.name+'" class="'+size+'"/>');
      this.$el.append('<label>'+app.capitalize(this.options.name)+'</test>');
      this.$el.append(this.$input);
      this.hasDecimals = (['float', 'decimal', 'numeric'].indexOf(this.options.schema.get('type')) > -1);
    }
  });

  Module.list = function(options) {
    var val = options.value;
    return val;
  };

  return Module;
});