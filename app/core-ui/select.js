//  Select Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'],function(app, Backbone) {

  var Module = {};

  var template = '<label>{{{capitalize name}}} <span class="note">{{comment}}</span></label><select name="{{name}}"><option value="">Select from below</option>{{#options}}<option value="{{key}}" {{#if selected}}selected{{/if}}>{{value}}</option>{{/options}}</select>';

  Module.id = 'select';
  Module.dataTypes = ['VARCHAR', 'INT'];
  Module.variables = [
    {id: 'options', ui: 'textarea', options:{'rows': 25}  }
  ];

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    tagName: 'fieldset',

    serialize: function() {
      var selectedValue = this.options.value;
      var options = this.options.settings.get('options');

      if (_.isString(options)) {
        options = jQuery.parseJSON(options);
      }

      options = _.map(options, function(value, key) {
        var item = {};
        item.value = value;
        item.key = key;
        if (item.key === selectedValue) item.selected = true;
        return item;
      });

      return {
        options: options,
        name: this.options.name,
        comment: this.options.schema.get('comment')
      };
    }

  });

  Module.list = function(options) {
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    return val;
  };

  return Module;
});