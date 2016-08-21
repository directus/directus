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

    getDate: function() {
      return {
        value: this.$('input[type=date]').val(),
        format: 'YYYY-MM-DD'
      }
    },

    updateValue: function() {
      var date = this.getDate();
      var val = date.value;
      var format = date.format;

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
        hasValue: this.value.isValid(),
        useDate: true,
        useTime: false,
        dateValue: dateValue,
        value: dateValue,
        name: this.name,
        readonly: this.options.canWrite === false || (settings && settings.has('readonly')) ? settings.get('readonly') === true : false
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
    dataTypes: ['DATE'],
    variables: [
      {id: 'readonly', type: 'Boolean', def: false, ui: 'checkbox'},
      {id: 'format', type: 'String', ui: 'textinput', char_length: 255, def: 'YYYY-MM-DD', comment: '<a href="http://momentjs.com/docs/#/displaying/format/" target="_blank">Formatting Rules</a>', options: {placeholder_text: 'eg: YYYY-MM-DD HH:mm:ss'}},
      {id: 'contextual_date_in_listview', type: 'Boolean', ui: 'checkbox', comment: 'Eg: 3 days ago'},
      {id: 'auto-populate_when_hidden_and_null', type: 'Boolean', ui: 'checkbox', def: true}
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
      var format = this.getFormat(options);

      if (options.settings.get('contextual_date_in_listview') === true) {
        var momentDate = moment(options.value);
        value = '-';
        if (momentDate.isValid()) {
          value = momentDate.fromNow();
        }
      } else if (format) {
        value = moment(value).format(format);
      }

      return value;
    },
    getFormat: function(options) {
      var format = options.settings.get('format');

      return removeTimeFromFormat(format);
    },
    sort: function(options) {
      return options.value;
    }
  });

  return Component;
});
