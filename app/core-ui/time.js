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


define(['app', 'moment', 'core/UIComponent', 'core/UIView'], function(app, moment, UIComponent, UIView) {

  'use strict';

  var template =  '<style type="text/css"> \
                  input.time { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 130px; \
                    padding-right: 4px; \
                    margin-right: 5px; \
                  } \
                  input.seconds { \
                    width: 100px !important; \
                  } \
                  a.now { \
                    \
                  } \
                  </style> \
                  <input type="time" {{#if readonly}}disabled{{/if}} class="time{{#if includeSeconds}} seconds{{/if}}" value="{{value}}" name="{{name}}" id="{{name}}"> \
                  <a class="now secondary-info">Now</a>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      'click .now': 'makeNow'
    },

    makeNow: function(e) {
      this.value = moment().format('HH:mm');
      this.render();
    },

    serialize: function() {
      return {
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        value: this.value,
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
        return 'This field is required';
      }
    },
    list: function(options) {
      if(!options.value) {
        return '-';
      }

      var settings = options.settings;
      var include_seconds = (settings && settings.has('include_seconds') && settings.get('include_seconds') == 1)? true : false;
      var date = new Date();
      var timeParts = options.value.split(":");

      date.setHours(parseInt(timeParts[0],10));
      date.setMinutes(parseInt(timeParts[1],10) || 0 );
      date.setSeconds(parseInt(timeParts[2],10) || 0 );

      var hours = date.getHours();
      var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
      var seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
      var secondsFormat = (include_seconds) ? ':'+seconds+' ' : '';
      var suffix = (hours >= 12)? 'pm' : 'am';

      hours = (hours > 12) ? hours-12 : hours;
      hours = (hours == '00') ? 12 : hours;

      return (options.value) ? hours+':'+minutes+secondsFormat+' '+suffix : '';
    }
  });

  return Component;
});
