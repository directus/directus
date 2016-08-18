//  Time core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Attribute          Type              Contains                                Example
// -------------------------------------------------------------------------------------------------------------------------------------
// options.schema     Backbone.Model    Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
// options.model      Backbone.Model    Data/Model for this table row           options.model.get('id') [any column in current table row]
// options.value      String            Value for this field
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('length') [any key from this UI options]
// options.name       String            Field name
/*jshint multistr: true */


define(['app', 'moment', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, moment, UIComponent, UIView, __t) {

  'use strict';

  function getTimeData(value, options) {
    if (!value) {
      return;
    }

    var date = new Date();
    var timeParts = value.split(':');

    date.setHours(parseInt(timeParts[0],10));
    date.setMinutes(parseInt(timeParts[1],10) || 0 );
    date.setSeconds(parseInt(timeParts[2],10) || 0 );

    var hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    var seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();

    return {
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      meridiem: (hours >= 12)? 'pm' : 'am'
    };
  }

  var Input = UIView.extend({
    template: 'datetime/input',

    events: {
      'click .now': 'makeNow'
    },

    makeNow: function(e) {
      var timeFormat = 'HH:mm';
      if (this.options.settings.get('include_seconds') == 1) {
        timeFormat += ':ss';
      }

      this.value = moment().format(timeFormat);
      this.render();
    },

    serialize: function() {
      var date = getTimeData(this.value, this.options);
      var timeValue;

      if (date) {
        timeValue = [date.hours, date.minutes];
        if (this.options.settings.get('include_seconds') == 1) {
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
        readonly: !this.options.canWrite
      };
    },

    initialize: function() {
      this.value = this.options.value;
    }
  });

  var Component = UIComponent.extend({
    id: 'time',
    dataTypes: ['TIME'],
    variables: [
      {id: 'readonly', ui: 'checkbox'},
      {id: 'include_seconds', ui: 'checkbox'}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
      var data = getTimeData(options);
      if (!data) {
        return '-';
      }

      var hours = data.hours;
      var minutes = data.minutes;
      var seconds = data.seconds;
      var meridiem = data.meridiem;
      var settings = options.settings;
      var includeSeconds = settings.get('include_seconds') == 1;

      return hours + ':' + minutes + (includeSeconds ? ':' + seconds : '') + ' ' + meridiem;
    }
  });

  return Component;
});
