//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone', 'core/UIComponent', 'core/UIView'], function(app, Backbone, UIComponent, UIView) {

  'use strict';

  var template = '<div class="select-container"> \
                    <select {{#unless canEdit}}disabled{{/unless}}> \
                    <option value="">{{placeholder_text}}</option> \
                    {{#data}}<option value="{{id}}" {{#if selected}}selected{{/if}}>{{{name}}}</option>{{/data}} \
                  </select> \
                  <i class="material-icons select-arrow">arrow_drop_down</i> \
                  </div>';

  var Input = UIView.extend({
    events: {
      'change select': function(e) {
        var model = this.model.get(this.name);
        var selectedId = parseInt($(e.target).find(':selected').val(),10);
        model.clear();
        model.set({id: selectedId});
      }
    },

    templateSource: template,

    serialize: function() {
      var optionTemplate = function(){};
      if(this.options.settings.has('visible_column_template')) {
        optionTemplate = Handlebars.compile(this.options.settings.get('visible_column_template'));
      }

      if(this.options.settings.get("readonly") === true) {
        this.canEdit = false;
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
        use_radio_buttons: (this.options.settings && this.options.settings.has('use_radio_buttons') && this.options.settings.get('use_radio_buttons') == '1') ? true : false,
        placeholder_text: (this.options.settings.get('placeholder_text')) ?  this.options.settings.get('placeholder_text') : "Select from Below"
      };
    },

    initialize: function(options) {
      var relatedTable;
      // @todo display warning on UI & gracefully fail if the next value is undefined
      if(this.columnSchema.relationship) {
        relatedTable = this.columnSchema.relationship.get('table_related');
      } else {
        console.error("Column is misconfigured in directus_columns! : " + this.name);
      }
      var value = this.model.get(this.name);
      this.canEdit = this.model.canEdit(this.name);
      this.collection = value.collection.getNewInstance({omit: ['preferences']});

      var active = 1;
      if(this.options.settings.get('visible_status_ids')) {
        active = this.options.settings.get('visible_status_ids');
      }
      var data = {'columns_visible[]': []};
      data[app.statusMapping.status_name] = active;

      var columns_visible =[];
      if(this.options.settings.get('visible_column')) {
        columns_visible = this.options.settings.get('visible_column').split(',');
      }

      columns_visible.forEach(function(column) {
        data['columns_visible[]'].push(column);
      });

      // FILTER HERE!
      this.collection.fetch({includeFilters: false, data: data});
      //this.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    }
  });

  var Component = UIComponent.extend({
    id: 'many_to_one',
    dataTypes: ['INT'],
    variables: [
      {id: 'readonly', ui: 'checkbox'},
      {id: 'visible_column', ui: 'textinput', char_length: 64, required: true, comment: "Enter Visible Column Name"},
      {id: 'visible_column_template', ui: 'textinput', char_length: 64, required: true, comment: "Enter Twig Template String"},
      {id: 'visible_status_ids', ui: 'textinput', char_length: 64, required: true, def: 1, comment: "Enter the visible status ids"},
      {id: 'placeholder_text', ui: 'textinput', char_length: 255, required: false, comment: "Enter Placeholder Text"},
      {id: 'filter_type', ui: 'select', options: {options: {'dropdown':'Dropdown','textinput':'Text Input'} }},
      {id: 'filter_column', ui: 'textinput', char_length: 255, comment: "Enter Column thats value is used for filter search"}
    ],
    Input: Input,
    validate: function(value, options) {
      if (!options.schema.isNullable() || options.schema.get('required')) {
        // a numer is ok
        if (!_.isNaN(parseInt(value,10))) {
          return;
        }
        //empty is not ok
        if (_.isEmpty(value)) {
          return 'The field cannot be empty';
        }

        // model value without proper id is not ok
        if (value instanceof Backbone.Model && (_.isNaN(value.get('id')) || value.get('id') === undefined)) {
          return 'The field cannot be empty';
        }
      }
    },
    list: function(options) {
      if (options.value === undefined) return '';

      if(options.settings.get('visible_column_template') !== undefined) {
        var displayTemplate = Handlebars.compile(options.settings.get('visible_column_template'));
        if (options.value instanceof Backbone.Model) {
          return displayTemplate(options.value.attributes);
        } else if(options.value instanceof Object) {
          return displayTemplate(options.value);
        }
      }

      if (options.value instanceof Backbone.Model) {
        return options.value.get(options.settings.get('visible_column'));
      }  else if(options.value instanceof Object) {
        return options.value[options.settings.get('visible_column')];
      }

      return options.value;
    }
  });

  return new Component();
});
