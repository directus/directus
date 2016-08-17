/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'moment', 'helpers/ui', 'core/t'], function(app, UIComponent, UIView, moment, UIHelper, __t) {

  'use strict';

  function removeTimeFromFormat(format) {
    return format.replace(/(A|a|H|h|m|s|S|z|Z|x|X)/g, '');
  }

  var Input = UIView.extend({
    template: 'datetime/input',

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
      var settings = this.options.settings;
      var dateValue = date.format('YYYY-MM-DD');

      return {
        hasDate: this.value.isValid(),
        useTime: false,
        dateValue: dateValue,
        value: dateValue,
        name: this.name,
        readonly: !this.options.canWrite || (settings && settings.has('readonly')) ? settings.get('readonly')!=0 : false
      };
    },

    initialize: function() {
      var value = this.model.get(this.name);
      if(undefined === value) {
        this.value = moment('0000-00-00');
      } else {
        this.value = moment(value);
      }
    }
  });

  var Component = UIComponent.extend({
    id: 'date',
    dataTypes: ['DATETIME', 'DATE', 'TIMESTAMP'],
    variables: [
      {id: 'readonly', ui: 'checkbox'},
      {id: 'format', ui: 'textinput', char_length: 255, def: 'YYYY-MM-DD'},
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }

      var date = moment(value);
      if (!value || date.isValid()) {
        return;
      }

      return 'Not a valid date';
    },
    list: function(options) {
      var value = options.value;
      var format = options.settings.get('format');

      if (format) {
        value = moment(value).format(removeTimeFromFormat(format));
      }

      return value;
    },
    sort: function(options) {
      return options.value;
    }
  });

  return Component;
});
