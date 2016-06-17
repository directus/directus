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


define(['app', 'backbone', 'moment'], function(app, Backbone, moment) {

  "use strict";

  var Module = {};

  Module.id = 'time';
  Module.dataTypes = ['TIME'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'include_seconds', ui: 'checkbox'}
  ];

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
                  <a class="now">Now</a>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'click .now': 'makeNow'
    },

    makeNow: function(e) {
      this.value = moment().format('HH:mm');
      this.render();
    },

    serialize: function() {
      var data = {};

      data.name = this.options.name;
      data.comment = this.options.schema.get('comment');
      data.value = this.value;

      data.readonly = !this.options.canWrite;

      return data;
    },

    initialize: function() {
      this.value = this.options.value;
    }

  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value)) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    if(!options.value) {
      return "-";
    }

    var include_seconds = (options.settings && options.settings.has('include_seconds') && options.settings.get('include_seconds') == '1')? true : false;

    var d = new Date();
    var time = options.value.split(":");
    d.setHours( parseInt(time[0],10) );
    d.setMinutes( parseInt(time[1],10) || 0 );
    d.setSeconds( parseInt(time[2],10) || 0 );
    var hours = d.getHours();
    var minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    var seconds = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
    var secondsFormat = (include_seconds) ? ':'+seconds+' ' : '';

    var suffix = (hours >= 12)? 'pm' : 'am';
    hours = (hours > 12)? hours -12 : hours;
    hours = (hours == '00')? 12 : hours;

    return (options.value) ? hours+':'+minutes+secondsFormat+' '+suffix : '';
  };

  return Module;

});
