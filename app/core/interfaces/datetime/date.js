/* global _ */
define([
  'app',
  'underscore',
  'core/UIComponent',
  'core/UIView',
  'moment',
  'helpers/ui',
  'core/t'
], function (app, _, UIComponent, UIView, moment, UIHelper, __t) {
  'use strict';

  function removeTimeFromFormat(format) {
    return format.replace(/(A|a|H|h|m|s|S|z|Z|x|X)/g, '');
  }

  var dateFormat = 'YYYY-MM-DD';

  var Input = UIView.extend({
    template: 'datetime/input',

    events: {
      'blur input.date': 'updateValue',
      'blur input.time': 'updateValue',
      'change input.date': 'updateValue',
      'change input.time': 'updateValue',
      'click .now': 'makeNow'
    },

    getFormat: function () {
      return dateFormat;
    },

    unsavedChange: function () {
      // NOTE: Only set the new value (mark changed) if the value has changed
      if (this.value.isValid() && (this.model.isNew() || this.model.hasChanges(this.name))) {
        return this.value.format(this.getFormat());
      }
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
        format: dateFormat
      };
    },

    updateValue: function () {
      var date = this.getDate();
      var value = date.value;
      var format = date.format;
      var newValue = '';

      if (moment(value).isValid()) {
        this.value = moment(value);
        newValue = this.value.format(format);
      }

      this.$('#' + this.name).val(newValue);
      this.model.set(this.name, newValue);
    },

    serialize: function () {
      var settings = this.options.settings;
      var isValid = this.value.isValid();
      var dateValue = isValid ? this.value.format(dateFormat) : null;

      return {
        hasValue: isValid,
        useDate: true,
        useTime: false,
        dateValue: dateValue,
        value: dateValue,
        name: this.name,
        readOnly: settings.get('read_only') || !this.options.canWrite
      };
    },

    initialize: function () {
      var value = this.model.get(this.name);
      var settings = this.options.settings;

      if (value === undefined) {
        value = moment('0000-00-00');
      } else {
        value = moment(value);
      }

      if (settings.get('auto_populate') === true && value.isValid() === false) {
        value = moment();
      }

      this.value = value;
    }
  });

  var Component = UIComponent.extend({
    id: 'date',
    dataTypes: ['DATE'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
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
        id: 'auto_populate',
        type: 'Boolean',
        ui: 'toggle',
        comment: 'Automatically fill this field with the current date if it\'s empty',
        default_value: true
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }

      var date = moment(value);
      if (!value || date.isValid()) {
        return;
      }

      return 'Not a valid date';
    },
    list: function (interfaceOptions) {
      var value = interfaceOptions.value;
      var format = this.getFormat(interfaceOptions);

      if (interfaceOptions.settings.get('contextual_date_in_listview') === true) {
        var momentDate = moment(interfaceOptions.value);

        value = '-';

        // make sure the value is also valid
        // otherwise the date will be "now"
        if (interfaceOptions.value && momentDate.isValid()) {
          value = momentDate.fromNow();
        }
      } else if (format) {
        value = moment(value).format(format);
      }

      return value;
    },
    getFormat: function (interfaceOptions) {
      var format = interfaceOptions.settings.get('format');

      return removeTimeFromFormat(format);
    },
    sort: function (interfaceOptions) {
      return interfaceOptions.value;
    }
  });

  return Component;
});
