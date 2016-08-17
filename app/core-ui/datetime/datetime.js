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


define(['app', 'underscore', 'core-ui/datetime/date', 'moment'], function(app, _, UIDate, moment) {

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
    serialize: function() {
      var data = ParentInput.prototype.serialize.apply(this, arguments);
      var date = this.value;
      var supportsTime = this.supportsTime();
      var useTime = false;
      var format = dateFormat;
      var settings = this.options.settings;

      if (supportsTime && settings && settings.get('use_time') != 0) {
        useTime = true;
        format += ' ' + timeFormat;
      }

      return _.extend(data, {
        hasDate: this.value.isValid(),
        useTime: useTime,
        timeValue: useTime ? date.format(timeFormat) : null,
        dateValue: date.format(dateFormat),
        value: date.format(format),
        name: this.name,
        readonly: !this.options.canWrite || (settings && settings.has('readonly')) ? settings.get('readonly')!=0 : false
      });
    },
  });

  var variables = UIDate.prototype.variables.slice();

  [
    {id: 'format', ui: 'textinput', char_length: 255, def: 'YYYY-MM-DD HH:mm:ss'},
    {id: 'useTime', ui: 'checkbox', def: 0},
    {id: 'include_seconds', ui: 'checkbox'},
    {id: 'contextual_date_in_listview', ui: 'checkbox'},
    {id: 'auto-populate_when_hidden_and_null', ui: 'checkbox', def:'1'}
  ].forEach(function(variable) {
    variables.push(variable);
  });

  var Component = UIDate.extend({
    id: 'datetime',
    variables: variables,
    Input: Input,
    list: function(options) {
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
    }
  });

  return Component;
});
