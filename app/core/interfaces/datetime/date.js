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

    supportsTime: function (type) {
      type = type || this.columnSchema.get('type');

      return UIHelper.supportsTime(type);
    },

    makeNow: function () {
      this.value = moment();
      this.render();
      this.$('input.date, input.time').trigger('change');
    },

    getDate: function () {
      return {
        value: this.$('input[type=date]').val(),
        format: 'YYYY-MM-DD'
      }
    },

    updateValue: function () {
      var date = this.getDate();
      var value = date.value;
      var format = date.format;
      var newValue = '';

      if (moment(value).isValid()) {
        newValue = moment(value).format(format);
      }

      this.$('#' + this.name).val(newValue);
      this.model.set(this.name, newValue);
    },

    serialize: function () {
      var settings = this.options.settings;
      if (settings.get('auto-populate_when_hidden_and_null') === true && !this.value.isValid()) {
        this.value = moment();
      }

      var date = this.value;
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

    initialize: function () {
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
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'toggle'},
      {
        id: 'format',
        ui: 'text_input',
        type: 'String',
        comment: '<a href="http://momentjs.com/docs/#/displaying/format/" target="_blank">Formatting Rules</a>',
        char_length: 255,
        default_value: 'YYYY-MM-DD',
        options: {
          placeholder: 'eg: YYYY-MM-DD HH:mm:ss'
        }
      },
      {
        id: 'contextual_date_in_listview',
        type: 'Boolean',
        ui: 'toggle',
        comment: 'Show dates in relatively to now (eg: 3 days ago)',
        default_value: false
      },
      {
        id: 'auto-populate_when_hidden_and_null',
        type: 'Boolean',
        ui: 'toggle',
        comment: 'Automatically fill this field with the current date if the input is hidden and empty',
        default_value: true
      }
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }

      var date = moment(value);
      if (!value || date.isValid()) {
        return;
      }

      return 'Not a valid date';
    },
    list: function (options) {
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
    getFormat: function (options) {
      var format = options.settings.get('format');

      return removeTimeFromFormat(format);
    },
    sort: function (options) {
      return options.value;
    }
  });

  return Component;
});
