//  Date core UI component
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

  Module.id = 'date';
  Module.dataTypes = ['DATE'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'}
  ];

  var template =  '<label>{{capitalize name}} <span class="note">{{note}}</span></label> \
                  <style type="text/css"> \
                  input.date { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 110px; \
                    padding-right: 4px; \
                    margin-right: 5px; \
                  } \
                  a.now { \
                    \
                  } \
                  </style> \
                  <input type="date" class="date" name="{{name}}" id="{{name}}" value="{{valueDate}}"> \
                  <a class="now">Now</a>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'click .now': 'makeNow'
    },

    updateValue: function(e) {
      var date = null;
      var candidate = this.$el.find('input[type=date]').val();
      try {
        date = new Date(candidate);
      } catch (e) {
        // Do nothing if the date is bad
        return;
      }
      this.options.value = date.toISOString();
      this.render();
    },

    makeNow: function(e) {
      var now = this.getCurrentTime();
      this.$el.find('input.date').val(now.yyyy+'-'+now.mm+'-'+now.dd);
      this.updateValue();
    },

    afterRender: function() {
      //
    },

    serialize: function() {
      var value = this.options.value || '';
      var now = this.getCurrentTime(value);

      return {
        value: now.gmtValue,
        valueDate: now.yyyy+'-'+now.mm+'-'+now.dd,
        name: this.options.name,
        note: this.options.schema.get('comment')
      };
    },

    getCurrentTime: function(value) {
      var thisDate = (value)? new Date(value+'Z') : new Date();
      var gmtValue;

      // Could be handled more elegantly
      try{
        gmtValue = new Date(thisDate).toISOString();
      } catch(err){
        thisDate = new Date();
      }

      var dd = thisDate.getDate();
      var mm = thisDate.getMonth()+1; // January is 0!
      var yyyy = thisDate.getFullYear();

      if(dd<10) {dd='0'+dd;}
      if(mm<10) {mm='0'+mm;}

      return {
        'gmtValue': gmtValue,
        'dd': dd,
        'mm': mm,
        'yyyy': yyyy
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
    var template = Handlebars.compile('{{contextualDate date}}');
    return template({date: options.value});
  };

  return Module;

});