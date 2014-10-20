//  Numeric core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  var template = '<input type="text" value="{{value}}" name="{{name}}" id="{{name}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/>';

  Module.id = 'numeric';
  Module.dataTypes = ['TINYINT', 'INT', 'NUMERIC', 'FLOAT', 'YEAR', 'VARCHAR', 'CHAR', 'DOUBLE', 'BIGINT'];

  Module.variables = [
    {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }},
    {id: 'allow_null', ui: 'checkbox', def: '0'}
  ];

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    events: {
      'keyup input': 'checkChars',
      'blur input': 'checkChars'
    },

    checkChars: function() {
      var numeric = this.$el.find('input');
      var value = numeric.val();
      value = value.replace(/[^0-9-.]/ig, "");
      numeric.val(value);
    },

    serialize: function() {
      var value = '';
      if(!isNaN(this.options.value)) {
        value = this.options.value;
      }

      // Fill in default value
      if (
        this.options.model.isNew() &&
        this.options.schema.has('default_value')) {
          value = this.options.schema.get('default_value');
      }

      return {
        value: value,
        name: this.options.name,
        size: (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    },

    initialize: function() {
      // this.hasDecimals = (['float', 'decimal', 'numeric'].indexOf(this.options.schema.get('type')) > -1);
    }

  });

  Module.list = function(options) {
    var val = options.value;
    return val;
  };

  return Module;
});