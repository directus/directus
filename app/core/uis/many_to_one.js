//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone', 'handlebars', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, Backbone, Handlebars, UIComponent, UIView, __t) {

  'use strict';

  var template = '<div class="select-container"> \
                    <select name="{{name}}" {{#unless canEdit}}disabled{{/unless}}> \
                    {{#if allowNull}}<option value="">{{placeholder_text}}</option>{{/if}} \
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
      var optionTemplate = Handlebars.compile(this.options.settings.get('visible_column_template'));

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
        use_radio_buttons: this.options.settings.get('use_radio_buttons') === true,
        allowNull: this.options.settings.get('allow_null') === true,
        placeholder_text: (this.options.settings.get('placeholder_text')) ?  this.options.settings.get('placeholder_text') : __t('select_from_below')
      };
    },

    initialize: function(options) {
      var relatedTable;
      // @todo display warning on UI & gracefully fail if the next value is undefined
      if(this.columnSchema.relationship) {
        relatedTable = this.columnSchema.relationship.get('related_table');
      } else {
        console.error(__t('column_misconfigured_in_directus_columns', {
          column: this.name
        }));
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
      {id: 'readonly', type: 'Boolean', def: false, ui: 'checkbox'},
      {id: 'visible_column', type: 'String', def: '', ui: 'textinput', char_length: 64, required: true, comment: __t('m2o_visible_column_comment')},
      {id: 'visible_column_template', type: 'String', def: '', def:'', ui: 'textinput', char_length: 64, required: true, comment: __t('m2o_visible_column_template_comment')},
      {id: 'visible_status_ids', type: 'String', def: '', ui: 'textinput', char_length: 64, required: true, def: '1', comment: __t('m2o_visible_status_ids_comment')},
      {id: 'placeholder_text', type: 'String', def: '', ui: 'textinput', char_length: 255, required: false, comment: __t('m2o_placeholder_text_comment')},
      {id: 'allow_null', type: 'Boolean', def: false, ui: 'checkbox'},
      {id: 'filter_type', def: 'dropdown', required: true, ui: 'select', options: {options: {'dropdown':__t('dropdown'),'textinput':__t('text_input')} }},
      {id: 'filter_column', type: 'String', def: '', ui: 'textinput', char_length: 255, comment: __t('m2o_filter_column_comment')}
    ],
    Input: Input,
    forceUIValidation: true,
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

  return Component;
});
