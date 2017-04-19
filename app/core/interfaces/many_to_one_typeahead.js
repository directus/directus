//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone', 'handlebars', 'core/UIComponent', 'core/UIView', 'utils', 'core/t'], function(app, Backbone, Handlebars, UIComponent, UIView, Utils, __t) {

  'use strict';

  var template = '<input type="text" value="" class="for_display_only {{size}}{{#if disabled}} disabled{{/if}}" placeholder="{{t "m2o_typeahead_placeholder"}}" {{#if readonly}}readonly{{/if}}/> \
                  {{#if disabled}}<div class="disabled-input"></div><em>There is not visible columns selected</em></div>{{/if}}\
                  {{#if hasSelectedItem}}\
                  <div class="selected-item"> \
                    <span id="selectedValue">{{selectedValue}}</span>\
                    <i class="material-icons clear" title="{{t "m2o_typeahead_clear"}}">clear</i> \
                  </div> \
                  {{/if}}\
                  <style> \
                    .disabled-input {\
                      padding: 5px 0;\
                    }\
                    .for_display_only.disabled {\
                      border-color: #F75D59\
                    } \
                    #selectedValue { \
                      border-radius: 4px; \
                      padding: 8px 10px; \
                      background-color: rgba(76,166,222, 0.2); \
                      cursor: pointer; \
                      line-height: 36px; \
                    } \
                    .selected-item { \
                      margin-top: 10px; \
                      color: #4ca6de; \
                      font-weight: 500; \
                    } \
                    .selected-item:hover { \
                    } \
                    .selected-item .clear { \
                      margin-left: 5px; \
                      vertical-align: middle; \
                      color: #666666; \
                      margin-top: -2px; \
                      cursor: pointer; \
                    } \
                    .selected-item .clear:hover { \
                      color: #c1272d; \
                    } \
                    .tt-hint {padding:14px;} \
                    #edit_field_{{name}} .twitter-typeahead {\
                      width:100%;\
                    }\
                    #edit_field_{{name}} .tt-dropdown-menu { \
                      padding: 3px 0; \
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); \
                      -webkit-border-radius: 2px; \
                      -moz-border-radius: 2px; \
                      border-radius: 2px; \
                      background-color: #fff; \
                  } \
                  #edit_field_{{name}} .tt-suggestions { \
                    margin-right: 0 !important; \
                  } \
                  \
                  #edit_field_{{name}} .tt-suggestion { \
                    display: block; \
                    padding: 0px 20px; \
                    clear: both; \
                    font-weight: normal; \
                    white-space: nowrap; \
                    font-size: 12px; \
                    margin-right: 0 !important; \
                } \
                \
                #edit_field_{{name}} .tt-is-under-cursor { \
                    color: white; \
                    background-color: black; \
                }\
                </style>';

  // @TODO: this should be a great feature on Models
  function get_multiple_attr(model, attributes) {
    if (attributes && attributes.length > 0) {
      var columns = attributes.split(',');
      var values = [];
      _.each(columns, function (column) {
        values.push(model.get(column));
      });

      return values.join(' ');
    }
  }

  var Input = UIView.extend({
    events: {
      'click .clear': function() {
        this.model.get(this.name).clear();
        this.render();
      }
    },

    templateSource: template,

    serialize: function() {
      var relatedModel = this.model.get(this.name);

      return {
        name: this.options.name,
        size: this.columnSchema.options.get('size'),
        readonly: false,
        disabled: this.visibleColumn ? false : true,
        selectedItem: relatedModel,
        hasSelectedItem: !relatedModel.isNew(),
        comment: this.options.schema.get('comment'),
        selectedValue: this.getSelectedValue(),
      };
    },

    afterRender: function () {
      var template = this.columnSchema.options.get('template');
      var self = this;
      var url = app.API_URL + 'tables/' + this.collection.table.id + '/typeahead/';
      var model = this.model.get(this.name);
      var params = {};

      if(this.visibleColumn) {
        params['columns'] = this.visibleColumn;
      }

      var status = 1;
      if(this.options.settings.get('visible_status_ids')) {
        status = this.options.settings.get('visible_status_ids');
      }

      if (model.table.hasStatusColumn()) {
        params[model.table.getStatusColumnName()] = status;
      }

      var urlParams = Utils.encodeQueryParams(params);
      if(urlParams) {
        url += '?' + urlParams;
      }

      var fetchItems = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: {
          url: url,
          ttl: 0
        },
        remote: Utils.addParam(url, 'q', '%QUERY', true, false),
        dupDetector: function(remoteMatch, localMatch) {
          return remoteMatch.value === localMatch.value;
        }
      });

      if (this.visibleColumn) {
        fetchItems.initialize();
        // fetchItems.clearPrefetchCache();
        // engine.clearRemoteCache();
        this.$(".for_display_only").typeahead({
          minLength: 1,
          items: 5,
        }, {
          source: fetchItems.ttAdapter()
        });
      }

      this.$('.for_display_only').on('typeahead:selected', function(e, datum) {
        var model = self.model.get(self.name);
        var selectedId = parseInt(datum.id,10);

        model.clear();
        model.set({id: selectedId});
        model.fetch({success:  function() {
          self.updateSelectedValue();
          self.render();
          // clear after fetch
          model.clear();
          model.set({id: selectedId});
        }});
      });
    },

    getSelectedValue: function() {
      var relatedModel = this.model.get(this.name);
      var templateSource = this.columnSchema.options.get('template');
      var selectedValue = this.visibleColumn ? get_multiple_attr(relatedModel, this.visibleColumn) : '';

      if (templateSource && !relatedModel.isNew()) {
        var template = Handlebars.compile(templateSource);
        selectedValue = template(relatedModel.toJSON());
      }

      return selectedValue;
    },

    updateSelectedValue: function() {
      this.$el.find('#selectedValue').html(this.getSelectedValue());
    },

    initialize: function(options) {
      this.visibleColumn = this.columnSchema.options.get('visible_column').split(',').map(function(column) {
        return column.trim();
      }).join(',');
      this.includeInactives = this.columnSchema.options.get('include_inactive');
      var value = this.model.get(this.name);
      this.collection = value.collection.getNewInstance({omit: ['preferences']});
    }
  });

  var Component = UIComponent.extend({
    id: 'many_to_one_typeahead',
    dataTypes: ['INT'],
    variables: [
      {id: 'visible_column', type: 'String', default_value: '', ui: 'textinput', comment: __t('m2o_typeahead_visible_column_comment'), char_length: 64, required: true},
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {'large':__t('size_large'),'medium':__t('size_medium'),'small':__t('size_small')} }, comment: __t('m2o_typeahead_size_comment')},
      {id: 'template', type: 'String', default_value: '', ui: 'textinput', comment: __t('m2o_typeahead_template_comment')},
      {id: 'visible_status_ids', type: 'String', ui: 'textinput', char_length: 64, required: true, default_value: 1, comment: __t('m2o_visible_status_ids_comment')}
    ],
    Input: Input,
    list: function(options) {
      if (options.value === undefined || options.value.isNew()) {
        return '';
      }

      if (options.value instanceof Backbone.Model) {
        if (options.settings.get('template')) {
          return this.compileView(options.settings.get('template'), options.value.toJSON());
        } else {
          return get_multiple_attr(options.value, options.settings.get('visible_column'));
        }
      }

      return options.value;
    }
  });

  return Component;
});
