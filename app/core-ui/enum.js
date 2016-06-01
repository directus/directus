//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView'],function(app, UIComponent, UIView) {

  'use strict';

  var template = '<div class="select-container"> \
                    <select name="{{name}}" {{#if readonly}}disabled{{/if}}><option value="">Select from below</option>{{#options}}<option value="{{value}}" {{#if selected}}selected{{/if}}>{{value}}</option>{{/options}}</select> \
                    <i class="material-icons select-arrow">arrow_drop_down</i> \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,

    serialize: function() {
      var selectedValue = this.options.value;

      var enumText = this.options.schema.attributes.column_type;
      enumText = enumText.substr(5,enumText.length-6); //Remove enum() from string
      enumText = enumText.replace(/'/g, '');
      var enumArray = enumText.split(",");

      enumArray = _.map(enumArray, function(value) {
        var item = {};
        item.value = value;
        item.selected = (item.value == selectedValue);
        return item;
      });

      return {
        value: this.options.value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        options: enumArray
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'enum',
    dataTypes: ['ENUM','SET'],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return 'This field is required';
      }
    },
    list: function(options) {
      return _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    }
  });

  return Component;
});
