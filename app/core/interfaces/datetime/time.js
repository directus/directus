/* global _ */
define(['app', 'moment', 'core/UIComponent', 'core/UIView', 'core/t'], function (app, moment, UIComponent, UIView, __t) {
  'use strict';

  function getTimeData(value) {
    if (!value) {
      return;
    }

    var date = new Date();
    var timeParts = value.split(':');

    date.setHours(parseInt(timeParts[0], 10));
    date.setMinutes(parseInt(timeParts[1], 10) || 0);
    date.setSeconds(parseInt(timeParts[2], 10) || 0);

    var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    var seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();

    return {
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      meridiem: (hours >= 12) ? 'pm' : 'am'
    };
  }

  var Input = UIView.extend({
    template: 'datetime/input',

    events: {
      'blur  input.time': 'updateValue',
      'change  input.time': 'updateValue',
      'click .now': 'makeNow'
    },

    makeNow: function () {
      var timeFormat = 'HH:mm';

      if (this.options.settings.get('include_seconds') === true) {
        timeFormat += ':ss';
      }

      this.value = moment().format(timeFormat);
      this.updateValue();

      this.render();
    },

    getTime: function () {
      var format = 'HH:mm';

      if (this.options.settings.get('include_seconds')) {
        format += ':ss';
      }

      return {
        value: this.$('input[type=time]').val(),
        format: format
      };
    },

    updateValue: function () {
      var time = this.getTime();
      var value = time.value;
      var format = time.format;

      if (!moment(value, format).isValid()) {
        value = '';
      }

      this.$('#' + this.name).val(value);
      this.model.set(this.name, value);
    },

    serialize: function () {
      var date = getTimeData(this.value, this.options);
      var timeValue;

      if (date) {
        timeValue = [date.hours, date.minutes];
        if (this.options.settings.get('include_seconds')) {
          timeValue.push(date.seconds);
        }

        timeValue = timeValue.join(':');
      }

      return {
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        useDate: false,
        useTime: true,
        hasValue: true,
        timeValue: timeValue,
        value: timeValue,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      };
    },

    initialize: function () {
      this.value = this.options.value;
    }
  });

  var Component = UIComponent.extend({
    id: 'time',
    dataTypes: ['TIME'],
    variables: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'include_seconds',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Include seconds in the interface',
        default_value: false
      }
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      var data = getTimeData(options);

      if (!data) {
        return '-';
      }

      var hours = data.hours;
      var minutes = data.minutes;
      var seconds = data.seconds;
      var meridiem = data.meridiem;
      var settings = options.settings;
      var includeSeconds = settings.get('include_seconds') === true;

      return hours + ':' + minutes + (includeSeconds ? ':' + seconds : '') + ' ' + meridiem;
    }
  });

  return Component;
});
