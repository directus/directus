define(['app', 'underscore', 'core/interfaces/datetime/date'], function (app, _, UIDate) {
  'use strict';

  // The HTML5 date tag accepts RFC3339
  // YYYY-MM-DD
  // ---
  // The HTML5 time tag acceps RFC3339:
  // 17:39:57
  var dateFormat = 'YYYY-MM-DD';
  var timeFormat = 'HH:mm:ss';

  var ParentInput = UIDate.prototype.Input;
  var Input = ParentInput.extend({
    getDate: function () {
      var date = Input.__super__.getDate.apply(this, arguments);

      date.value += ' ' + this.$('input[type=time]').val();
      date.timeFormat = this.getTimeFormat();
      date.dateFormat = date.format;
      date.format += ' ' + date.timeFormat;

      return date;
    },
    getFormat: function () {
      return this.getDateFormat() + ' ' + this.getTimeFormat();
    },
    getDateFormat: function () {
      return dateFormat;
    },
    getTimeFormat: function () {
      var includeSeconds = this.options.settings.get('include_seconds') === true;

      return includeSeconds ? timeFormat : timeFormat.replace(':ss', '');
    },
    serialize: function () {
      var data = ParentInput.prototype.serialize.apply(this, arguments);
      var date = this.value;
      var format = dateFormat + ' ' + timeFormat;

      return _.extend(data, {
        useDate: true,
        useTime: true,
        timeValue: date.format(this.getTimeFormat()),
        dateValue: date.format(this.getDateFormat()),
        value: date.format(format),
        name: this.name,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      });
    }
  });

  var options = UIDate.prototype.options.slice();
  // TODO: add time step setting
  options.push({id: 'include_seconds', type: 'Boolean', default_value: true, ui: 'toggle'});

  var Component = UIDate.extend({
    id: 'datetime',
    dataTypes: ['DATETIME', 'TIMESTAMP'],
    options: options,
    Input: Input,
    getFormat: function (interfaceOptions) {
      return interfaceOptions.settings.get('format');
    }
  });

  return Component;
});
