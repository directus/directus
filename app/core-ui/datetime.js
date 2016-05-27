/*jshint multistr: true */

define(['app', 'backbone', 'moment', 'core/UIView', 'helpers/ui'], function(app, Backbone, moment, UIView, UIHelper) {

  'use strict';

  var Module = {};

  // UI unique name
  Module.id = 'datetime';

  // List of column data types this UI supports
  Module.dataTypes = ['DATETIME', 'DATE', 'TIMESTAMP'];

  // UI Settings
  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'format', ui: 'textinput', char_length: 255, def: 'YYYY-MM-DD HH:mm:ss'},
    {id: 'useTime', ui: 'checkbox', def: 0},
    {id: 'include_seconds', ui: 'checkbox'},
    {id: 'contextual_date_in_listview', ui: 'checkbox'},
    {id: 'auto-populate_when_hidden_and_null', ui: 'checkbox', def:'1'}
  ];

  // Directus Settings to be added.
  Module.settings = [];

  // Template source (Handlebars)
  var template =  '<style type="text/css"> \
                  input.date { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 150px; \
                    padding-right: 4px; \
                    margin-right: 5px; \
                  } \
                  input.time { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 130px; \
                    padding-right: 4px; \
                    margin-right: 5px; \
                  } \
                  input.seconds { \
                    width: 100px !important; \
                  } \
                  </style> \
                  <input type="date" {{#if readonly}}disabled{{/if}} class="date" {{#if hasDate}}value="{{valueDate}}"{{/if}}> \
                  {{#if useTime}}<input type="time" {{#if readonly}}disabled{{/if}} class="time{{#if includeSeconds}} seconds{{/if}}" {{#if hasDate}}value="{{valueTime}}"{{/if}}>{{/if}} \
                  {{#unless readonly}}<a class="now secondary-info">Now</a>{{/unless}} \
                  <input class="merged" type="hidden" {{#if hasDate}}value="{{valueMerged}}"{{/if}} name="{{name}}" id="{{name}}">';

  // The HTML5 date tag accepts RFC3339
  // YYYY-MM-DD
  // ---
  // The HTML5 time tag acceps RFC3339:
  // 17:39:57
  var dateFormat = 'YYYY-MM-DD';
  var timeFormat = 'HH:mm:ss';

  // UI Input (View)
  // This view represents the UI itself
  Module.Input = UIView.extend({

    template: Handlebars.compile(template),

    events: {
      'blur  input.date':   'updateValue',
      'blur  input.time':   'updateValue',
      'change  input.date': 'updateValue',
      'change  input.time': 'updateValue',
      'click .now':         'makeNow'
    },

    supportsTime: function(type) {
      type = type || this.columnSchema.get('type');
      return UIHelper.supportsTime(type);
    },

    makeNow: function() {
      this.value = moment();
      this.render();
    },

    updateValue: function() {
      var val = this.$('input[type=date]').val();
      var format = dateFormat;

      if (this.supportsTime()) {
        val += ' ' + this.$('input[type=time]').val();
        format += ' ' + timeFormat;
      }

      if (moment(val).isValid()) {
        this.$('#'+this.name).val(moment(val).format(format));
      } else {
        this.$('#'+this.name).val('');
      }
    },

    serialize: function() {
      var date = this.value;
      var supportsTime = this.supportsTime();
      var useTime = false;
      var format = dateFormat;
      var settings = this.options.settings;

      if (supportsTime && settings && settings.get('use_time') != 0) {
        useTime = true;
        format += ' ' + timeFormat;
      }

      return {
        hasDate: this.value.isValid(),
        useTime: useTime,
        valueTime: useTime ? date.format(timeFormat) : null,
        valueDate: date.format(dateFormat),
        valueMerged: date.format(format),
        name: this.name,
        readonly: (settings && settings.has('readonly')) ? settings.get('readonly')!=0 : false
      };
    },

    initialize: function(options) {
      var value = this.model.get(this.name);
      if(undefined === value) {
        this.value = moment('0000-00-00 00:00:00');
      } else {
        this.value = moment(value);
      }
    }

  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value)) {
      return 'This field is required';
    }

    var date = moment(value);
    if (!value || date.isValid()) {
      return;
    }

    return 'Not a valid date';
  };

  // value used to represents the UI
  Module.list = function(options) {
    var value = options.value;
    var format = options.settings.get('format');

    if (options.settings.get('contextual_date_in_listview') == 1) {
      var momentDate = moment(options.value);
      value = '-';
      if (momentDate.isValid()) {
        value = momentDate.fromNow();
      }
    } else if (format) {
      value = moment(value).format(format);
    }

    return value;
  };

  // value used to sort the UI
  Module.sort = function(options) {
    return options.value;
  };

  return Module;
});
