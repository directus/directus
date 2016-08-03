//  Numeric core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var template = '<input type="text" value="{{value}}" placeholder="{{placeholder}}" name="{{name}}" id="{{name}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      'keyup input': 'checkChars',
      'blur input': 'checkChars'
    },

    checkChars: function() {
      var numeric = this.$el.find('input');
      var value = numeric.val();
      value = value.replace(/[^0-9-.]/ig, ""); // @TODO: regex needs to reflect datatype (no "." for INT, etc)
      numeric.val(value);
    },

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

      return {
        value: value,
        name: this.options.name,
        size: (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large',
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder_text') : '',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    },

    initialize: function() {
      // this.hasDecimals = (['float', 'decimal', 'numeric'].indexOf(this.options.schema.get('type')) > -1);
    }
  });

  var Component = UIComponent.extend({
    id: 'numeric',
    dataTypes: ['TINYINT', 'INT', 'NUMERIC', 'FLOAT', 'YEAR', 'VARCHAR', 'CHAR', 'DOUBLE', 'BIGINT'],
    variables: [
      {id: 'size', ui: 'select', options: {options: {'large':__t('size_large'),'medium':__t('size_medium'),'small':__t('size_small')} }},
      {id: 'placeholder_text', ui: 'textinput', char_length:200},
      {id: 'allow_null', ui: 'checkbox', def: '0'}
    ],
    Input: Input,
    validate: function(value, options) {
      // _.isEmpty (in the installed version) does not support INTs properly
      if (options.schema.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
      return _.isNumber(options.value) ? options.value.toLocaleString() : null;
    }
  });

  return Component;
});
