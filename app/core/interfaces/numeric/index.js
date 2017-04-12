//  Numeric core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'core/UIComponent',
  'core/UIView',
  'core/t'
], function(app, UIComponent, UIView, __t) {

  'use strict';

  var Input = UIView.extend({
    template: 'numeric/input',

    serialize: function() {
      var value = '';

      if(!isNaN(this.options.value)) {
        value = this.options.value;
      }

      // Fill in default value
      if (
        this.options.value === undefined &&
        this.options.schema.has('default_value')) {
          value = this.options.schema.get('default_value');
      }

      var step = 1;

      if (
        this.options.schema.get('type') === 'FLOAT' ||
        this.options.schema.get('type') === 'VARCHAR' ||
        this.options.schema.get('type') === 'CHAR'
      ) {
        step = 'any';
      }

      return {
        value: value,
        name: this.options.name,
        size: this.options.settings.get('size'),
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder_text') : '',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        step: step
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'numeric',
    dataTypes: [
      'TINYINT',
      'SMALLINT',
      'MEDIUMINT',
      'INT',
      'FLOAT',
      'YEAR',
      'DOUBLE',
      'VARCHAR',
      'CHAR',
      'BIGINT'
    ],
    variables: [
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {'large':__t('size_large'),'medium':__t('size_medium'),'small':__t('size_small')} }},
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'localized', type: 'Boolean', default_value: true, ui: 'checkbox', comment: __t('numeric_localized_comment')}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && value != 0 && !value) {
        return __t('this_field_is_required');
      }

      if (!options.view.$el.find('input')[0].checkValidity()) {
        return __t('confirm_invalid_value');
      }
    },
    list: function (options) {
      var value = options.value;

      if (!isNaN(Number(value))) {
        value = Number(value);

        if (options.settings.get('localized')) {
          value = value.toLocaleString();
        }
      } else {
        value = '<span class="silver">--</span>';
      }

      return value;
    }
  });

  return Component;
});
