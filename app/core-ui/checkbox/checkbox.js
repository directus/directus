//  Checkbox core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {
  'use strict';

  var Input = UIView.extend({
    template: 'checkbox/input',

    events: {
      'change input[type=checkbox]': function(e) {
        var val = (this.$el.find('input[type=checkbox]:checked').val() === undefined) ? 0 : 1;
        this.$el.find('input[type=hidden]').val(val);
      }
    },

    serialize: function() {
      var value = this.options.value;

      // Get default value if there is one...
      if (value === undefined && this.options.schema.has('def')) {
        value = this.options.schema.get('def');
      }

      var selected = parseInt(value,10) === 1;

      if (
        this.options.model.isNew() &&
        this.options.schema.has('default_value')) {
          selected = parseInt(this.options.schema.get('default_value'), 10) === 1;
      }

      return {
        name: this.options.name,
        selected: selected,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'checkbox',
    dataTypes: ['TINYINT'],
    variables: [
      {id: 'mandatory', ui: 'checkbox', comment: 'if this field should always be checked by the user.'}
    ],
    Input: Input,
    validate: function(value, options) {
      // If a checkbox is mandatory, it MUST be checked to save
      // similar to "agree to terms" functionality
      if (options.settings.get('mandatory') && value == 0) {
        return 'This field is required';
      }
    },
    list: function(options) {
      var listTemplateSource = '<input type="checkbox" {{#if selected}}checked="true"{{/if}} disabled>';

      return this.compileView(listTemplateSource, {selected: parseInt(options.value, 10) === 1});
    }
  });

  return Component;
});
