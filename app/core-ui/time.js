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


define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'time';
  Module.dataTypes = ['TIME'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'include_seconds', ui: 'checkbox'}
  ];

  var template =  '<label>{{capitalize name}} <span class="note">{{comment}}</span></label> \
                  <style type="text/css"> \
                  input.time { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 80px; \
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
                  <input type="time" class="time{{#if includeSeconds}} seconds{{/if}}" value="{{value}}" name="{{name}}" id="{{name}}"> \
                  <a class="now">Now</a>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'click .now': 'makeNow'
    },

    makeNow: function(e) {
      var now = this.getCurrentTime();
      var include_seconds = (this.options.settings && this.options.settings.has('include_seconds') && this.options.settings.get('include_seconds') == '1')? true : false;
      var timeFormat = (include_seconds) ? now.thh+':'+now.tmm+':'+now.tss : now.thh+':'+now.tmm;
      this.$el.find('input.time').val(timeFormat);
      this.updateValue();
    },

    afterRender: function() {
      //
    },

    serialize: function() {
      var value = this.options.value || '';
      var now = this.getCurrentTime(value);
      var include_seconds = (this.options.settings && this.options.settings.has('include_seconds') && this.options.settings.get('include_seconds') == '1')? true : false;

      if(!include_seconds){now.tss='00';}

      return {
        value: (include_seconds) ? now.thh+':'+now.tmm+':'+now.tss : now.thh+':'+now.tmm,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        includeSeconds: include_seconds
      };
    },

    getCurrentTime: function(value) {
      var thisDate = new Date();

      if(value){
        var time = value.split(":");

        thisDate.setHours( parseInt(time[0],10) + (time[2] ? 12 : 0) );
        thisDate.setMinutes( parseInt(time[1],10) || 0 );
        thisDate.setSeconds( parseInt(time[2],10) || 0 );
      }

      var thh = thisDate.getHours();
      var tmm = thisDate.getMinutes();
      var tss = thisDate.getSeconds();

      if(thh<10){thh='0'+thh;}
      if(tmm<10){tmm='0'+tmm;}
      if(tss<10){tss='0'+tss;}

      return {
        'value': value,
        'thh': thh,
        'tmm': tmm,
        'tss': tss
      };
    },

    initialize: function() {
      //
    }

  });

  Module.validate = function(value) {
    //
  };

  Module.list = function(options) {
    var include_seconds = (options.settings && options.settings.has('include_seconds') && options.settings.get('include_seconds') == '1')? true : false;

    var d = new Date();
    var time = options.value.split(":");
    d.setHours( parseInt(time[0],10) + (time[2] ? 12 : 0) );
    d.setMinutes( parseInt(time[1],10) || 0 );
    d.setSeconds( parseInt(time[2],10) || 0 );
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = (d.getSeconds() === 0) ? '00' : d.getSeconds();

    var secondsFormat = (include_seconds) ? ':'+seconds+' ' : '';

    var suffix = (hours >= 12)? 'pm' : 'am';
    hours = (hours > 12)? hours -12 : hours;
    hours = (hours == '00')? 12 : hours;

    return (options.value) ? hours+':'+minutes+secondsFormat+' '+suffix : '';
  };

  return Module;

});