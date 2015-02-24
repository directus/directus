/*jshint multistr: true */

define(['app', 'backbone', 'moment', 'core/UIView'], function(app, Backbone, moment, UIView) {

  "use strict";

  var Module = {};

  Module.id = 'datetime';
  Module.dataTypes = ['DATETIME']; // 'DATE', 'TIME'

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'include_seconds', ui: 'checkbox'},
    {id: 'contextual_date_in_listview', ui: 'checkbox'},
    {id: 'auto-populate_when_hidden_and_null', ui: 'checkbox', def:'1'}
  ];

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
                    width: 110px; \
                    padding-right: 4px; \
                    margin-right: 5px; \
                  } \
                  input.seconds { \
                    width: 100px !important; \
                  } \
                  </style> \
                  <input type="date" {{#if readonly}}disabled{{/if}} class="date" {{#if hasDate}}value="{{valueDate}}"{{/if}}> \
                  <input type="time" {{#if readonly}}disabled{{/if}} class="time{{#if includeSeconds}} seconds{{/if}}" {{#if hasDate}}value="{{valueTime}}"{{/if}}> \
                  {{#unless readonly}}<a class="now secondary-info">Now</a>{{/unless}} \
                  <input class="merged" type="hidden" {{#if hasDate}}value="{{valueMerged}}"{{/if}} name="{{name}}" id="{{name}}">';

  //var format = 'ddd, DD MMM YYYY HH:mm:ss';
  var format = 'YYYY-MM-DD HH:mm';

  Module.Input = UIView.extend({

    tagName: 'div',
    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'blur  input.date':   'updateValue',
      'blur  input.time':   'updateValue',
      'change  input.date': 'updateValue',
      'change  input.time': 'updateValue',
      'click .now':         'makeNow'
    },

    makeNow: function() {
      this.value = moment();
      this.render();
    },

    updateValue: function() {
      var time = this.$('input[type=time]').val();
      var date = this.$('input[type=date]').val();
      var val = date + ' ' + time;

      if (moment(val).isValid()) {
        this.$('#'+this.name).val(moment(val).format(format));
      } else {
        this.$('#'+this.name).val('');
      }
    },

    // The HTML5 date tag accepts RFC3339
    // YYYY-MM-DD
    // ---
    // The HTML5 time tag acceps RFC3339:
    // 17:39:57
    serialize: function() {
      var data = {};
      var date = this.value;

      data.hasDate = this.value.isValid();

      data.valueDate = date.format('YYYY-MM-DD');
      data.valueTime = date.format('HH:mm');
      data.valueMerged = date.format(format);
      data.name = this.name;
      data.readonly = (this.options.settings && this.options.settings.has('readonly')) ? this.options.settings.get('readonly')!==0 : false;
      return data;
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

    var m = moment(value);

    if (m.isValid() || value === '' || value === null || value === undefined) {
      return;
    }

    return "Not a valid date";
  };

  //@todo make contextual date a ui
  Module.list = function(options) {
    var value = options.value;

    if (options.settings.get('contextual_date_in_listview') === '1') {
      var momentDate = moment(options.value);
      if (momentDate.isValid()) {
        value = momentDate.fromNow();
      } else {
        value = '-';
      }
    }

    return value;
  };

  return Module;

});