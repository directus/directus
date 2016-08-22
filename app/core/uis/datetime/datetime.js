//  DateTime core UI component
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


define(['app', 'underscore', 'core/uis/datetime/date', 'moment'], function(app, _, UIDate, moment) {

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
    getDate: function() {
      var date = Input.__super__.getDate.apply(this, arguments);

      date.value += ' ' + this.$('input[type=time]').val();
      date.timeFormat = this.getTimeFormat();
      date.dateFormat = date.format;
      date.format += ' ' + date.timeFormat;

      return date;
    },
    getDateFormat: function() {
      return dateFormat;
    },
    getTimeFormat: function() {
      var includeSeconds = this.options.settings.get('include_seconds') === 1;

      return includeSeconds ? timeFormat : timeFormat.replace(':ss', '');
    },
    serialize: function() {
      var data = ParentInput.prototype.serialize.apply(this, arguments);
      var date = this.value;
      var format = dateFormat + ' ' + timeFormat;
      var settings = this.options.settings;

      return _.extend(data, {
        hasValue: this.value.isValid(),
        useDate: true,
        useTime: true,
        timeValue: date.format(this.getTimeFormat()),
        dateValue: date.format(this.getDateFormat()),
        value: date.format(format),
        name: this.name,
        readonly: this.options.canWrite === false || (settings && settings.has('readonly')) ? settings.get('readonly') === true : false
      });
    },
  });

  var variables = UIDate.prototype.variables.slice();
  variables.push({id: 'include_seconds', type: 'Boolean', def: false, ui: 'checkbox'});

  var Component = UIDate.extend({
    id: 'datetime',
    dataTypes: ['DATETIME', 'TIMESTAMP'],
    variables: variables,
    Input: Input,
    getFormat: function(options) {
      return options.settings.get('format');
    }
  });

  return Component;
});
