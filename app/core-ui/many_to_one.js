//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core/UIView'], function(app, Backbone, UIView) {

  "use strict";

  var Module = {};

  Module.id = 'many_to_one';
  Module.dataTypes = ['INT'];

  Module.variables = [
    {id: 'visible_column', ui: 'textinput', char_length: 64, required: true, comment: "Enter Visible Column Name"},
    {id: 'visible_column_template', ui: 'textinput', char_length: 64, required: true, comment: "Enter Twig Template String"}
    //{id: 'use_radio_buttons', ui: 'checkbox', def: '0'}
  ];

  var template = '<style type="text/css"> \
                  label.radiobuttons { \
                    font-weight:normal; \
                    display:inline; \
                    margin-right: 10px; \
                    padding: 4px; \
                  } \
                  </style> \
                  {{#if use_radio_buttons}} \
                  {{#data}}<input style="margin-top:-3px;" type="radio" name="{{../name}}" value="{{id}}" id="radio-{{id}}" {{#if selected}}checked{{/if}}> \
                  <label class="radiobuttons" for="radio-{{id}}">{{name}}</label>{{/data}} \
                  {{else}} \
                  <select {{#unless canEdit}}disabled{{/unless}}> \
                  <option value="">Select from below</option> \
                  {{#data}}<option value="{{id}}" {{#if selected}}selected{{/if}}>{{name}}</option>{{/data}} \
                  </select> \
                  {{/if}}';

  //name="{{name}}"

  Module.Input = UIView.extend({

    tagName: 'div',

    events: {
      'change select': function(e) {
        var model = this.model.get(this.name);
        var selectedId = parseInt($(e.target).find(':selected').val(),10);
        model.clear();
        model.set({id: selectedId});

        console.log(model.toJSON());
      }
    },

    template: Handlebars.compile(template),

    serialize: function() {
      var optionTemplate = function(){};
      if(this.options.settings.has('visible_column_template')) {
        optionTemplate = Handlebars.compile(this.options.settings.get('visible_column_template'));
      }
      var data = this.collection.map(function(model) {
        var data = model.toJSON();

        var name = optionTemplate(data);
        return {
          id: model.id,
          name: name,
          selected: this.options.value !== undefined && (model.id === this.options.value.id)
        };
      }, this);

      // default data while syncing (to avoid flickr when data is loaded)
      if (this.options.value !== undefined && this.options.value.id && !data.length) {
        data = [{
          id: this.options.value.id,
          name: this.options.value,
          selected: true
        }];
      }

      data = _.sortBy(data, 'name');
      return {
        canEdit: this.canEdit,
        name: this.options.name,
        data: data,
        handleBarString: this.options.settings.get('value_template'),
        comment: this.options.schema.get('comment'),
        use_radio_buttons: (this.options.settings && this.options.settings.has('use_radio_buttons') && this.options.settings.get('use_radio_buttons') == '1') ? true : false
      };
    },

    initialize: function(options) {
      // @todo display warning on UI & gracefully fail if the next value is undefined
      var relatedTable = this.columnSchema.relationship.get('table_related');
      var value = this.model.get(this.name);

      this.canEdit = this.model.canEdit(this.name);
      this.collection = value.collection.getNewInstance({omit: ['preferences']});

      // FILTER HERE!
      this.collection.fetch({includeFilters: false, data: {active:1}});
      //this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    }

  });

  Module.validate = function(value, options) {

    if (!options.schema.isNullable()) {
      // a numer is ok
      if (!_.isNaN(parseInt(value,10))) {
        return;
      }
      //empty is not ok
      if (_.isEmpty(value)) {
        return 'The field cannot be empty';
      }
      // model value without proper id is not ok
      if (value instanceof Backbone.Model && _.isNaN(value.get('id'))) {
        return 'The field cannot be empty';
      }
    }
  };

  Module.list = function(options) {
    if (options.value === undefined) return '';
    if(options.settings.get('visible_column_template') !== undefined) {
      var displayTemplate = Handlebars.compile(options.settings.get('visible_column_template'));
      if (options.value instanceof Backbone.Model) return displayTemplate(options.value.attributes);
    }
    if (options.value instanceof Backbone.Model) return options.value.get(options.settings.get('visible_column'));
    return options.value;
  };

  return Module;
});