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
    {id: 'include_seconds', ui: 'checkbox'},
    {id: 'auto-populate_when_hidden_and_null', ui: 'checkbox'}
  ];

  var template =  '<label>{{capitalize name}} <span class="note">{{note}}</span></label> \
                  <style type="text/css"> \
                  input.date { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 140px; \
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
                  <input type="date" class="date" value="{{valueDate}}""> \
                  <input type="time" class="time{{#if includeSeconds}} seconds{{/if}}" value="{{valueTime}}"> \
                  <a class="now">Now</a> \
                  <input class="merged" type="hidden" value="{{value}}" name="{{name}}" id="{{name}}">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'blur  input': 'updateValue',
      'click .now': 'makeNow'
    },

    updateValue: function(e) {
      var date = null;
      var candidate = this.$el.find('input[type=date]').val() + ' ' +
                      this.$el.find('input[type=time]').val();

      try {
        date = new Date(candidate);
      } catch (e) {
        // Do nothing if the date is bad
        return;
      }

      this.value = date;
      this.render();
    },

    makeNow: function() {
      this.value = new Date();
      this.render();
    },

    serialize: function() {
      var value = this.value;
      var data = {
        value: null,
        valueDate: null,
        valueTime: null,
        name: this.options.name,
        note: this.options.schema.get('comment')
      };

      // console.log( 'Module.Input.serialize BEGIN', this );

      var nullValue = (this.value == undefined || this.value == 'Invalid Date');
      // console.log( 'nullValue', nullValue);
      // console.log( 'this.value', this.value);
      if (nullValue && this.autoPopulateWhenHiddenAndNull) {
        this.makeNow();
        var attr = this.options.name;
        this.model.attributes[attr] = this.value;
        // @todo there must be a more correct way of doing this, than manually
        // setting the `changed` values.
        this.model.changed[attr] = this.value;
      }

      // console.log( 'Module.Input.serialize END', this );

      if (value !== undefined) {

        // Don't show corrupted dates
        try {
          value = new Date(value);
          if (_.isNaN(value.getTime())) {
            throw Error();
          }
        } catch (e) {
          return data;
        }

        var date = [
          value.getFullYear(),
          ('0'+(value.getMonth()+1)).slice(-2),
          ('0'+value.getDate()).slice(-2)
        ];
        data.valueDate = date.join('-');

        var time = [
          ('0'+value.getHours()).slice(-2),
          ('0'+value.getMinutes()).slice(-2)
        ];

        if (this.includeSeconds) {
          time.push(('0'+value.getSeconds()).slice(-2));
        }
        data.valueTime = time.join(':');

        // To guard against presumptive locale adjustments which are made by Daee.toISOString,
        // render the zulu format manually. See directus6 issue #289:
        // https://github.com/RNGR/directus6/issues/289
        var zuluDate = data.valueDate + 'T' + data.valueTime + ':00.000Z';

        data.value = zuluDate;
      }

      return data;
    },

    initialize: function(options) {
      this.value = options.value;
      this.includeSeconds = (options.settings && options.settings.has('include_seconds') && options.settings.get('include_seconds') == '1');
      this.autoPopulateWhenHiddenAndNull = (options.settings && options.settings.has('auto-populate_when_hidden_and_null') && options.settings.get('auto-populate_when_hidden_and_null') == '1');
    }

  });

  Module.validate = function(value,options) {
    if (!_.isDate(value)) {
      value = new Date(value);
    }
    if (!_.isNaN(value.getTime())) {
      return;
    }
    return "Not a valid date";
  };

  //@todo make contextual date a ui
  Module.list = function(options) {
    var template = Handlebars.compile('{{contextualDate date}}');
    return template({date: options.value});
  };

  return Module;

});