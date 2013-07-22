//  Datetime core UI component
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

  var Module = {};

  Module.id = 'datetime';
  Module.dataTypes = ['DATETIME']; // 'DATE', 'TIME'

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'include_seconds', ui: 'checkbox'}
  ];

  var template =  '<label>{{capitalize name}} <span class="note">{{note}}</span></label> \
                  <style type="text/css"> \
                  input.date { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 120px; \
                    padding-right: 4px; \
                    margin-right: 5px; \
                  } \
                  input.time { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 100px; \
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
                  {{#if includeDate}}<input type="date" class="date" value="{{valueDate}}"">{{/if}} \
                  {{#if includeTime}}<input type="time" class="time{{#if includeSeconds}} seconds{{/if}}" value="{{valueTime}}">{{/if}} \
                  <a class="now">Now</a> \
                  <input class="merged" type="hidden" value="{{value}}" name="{{name}}" id="{{name}}">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'change input': 'updateValue',
      'click .now': 'makeNow'
    },

    updateValue: function(e) {
      var value = this.$el.find('input.date').val() + ' ' + this.$el.find('input.time').val();
      var now = new Date(value);
      var gmtValue = new Date(value).toISOString();

      this.$el.find('input.merged').val(gmtValue);
    },

    makeNow: function(e) {
      var now = this.getCurrentTime();
      var include_seconds = (this.options.settings && this.options.settings.has('include_seconds') && this.options.settings.get('include_seconds') == '1')? true : false;
      var timeFormat = (include_seconds) ? now.thh+':'+now.tmm+':'+now.tss : now.thh+':'+now.tmm;
      this.$el.find('input.date').val(now.yyyy+'-'+now.mm+'-'+now.dd);
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


      console.log(_.isDate(value));

      return {
        value: now.gmtValue,
        valueDate: now.yyyy+'-'+now.mm+'-'+now.dd,
        valueTime: (include_seconds) ? now.thh+':'+now.tmm+':'+now.tss : now.thh+':'+now.tmm,
        includeDate: (this.options.schema.get('type') == 'DATETIME' || this.options.schema.get('type') == 'DATE') ? true : false,
        includeTime: (this.options.schema.get('type') == 'DATETIME' || this.options.schema.get('type') == 'TIME') ? true : false,
        name: this.options.name,
        note: this.options.schema.get('comment'),
        includeSeconds: include_seconds
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
      var thh = thisDate.getHours();
      var tmm = thisDate.getMinutes();
      var tss = thisDate.getSeconds();

      if(dd<10){dd='0'+dd;}
      if(mm<10){mm='0'+mm;}
      if(thh<10){thh='0'+thh;}
      if(tmm<10){tmm='0'+tmm;}
      if(tss<10){tss='0'+tss;}

      return {
        'gmtValue': gmtValue,
        'dd': dd,
        'mm': mm,
        'yyyy': yyyy,
        'thh': thh,
        'tmm': tmm,
        'tss': tss
      };
    },

    initialize: function() {
      //
    }

  });

  Module.validate = function(value,options) {
    if (!_.isDate(value)) {
      console.log(value);
    }
    if (_.isDate(value) && !_.isNaN(value.getTime())) {
      return;
    }
    console.log('bad date', value);
  };

  Module.list = function(options) {
    var template = Handlebars.compile('{{contextualDate date}}');
    return template({date: options.value});
  };

  return Module;

});