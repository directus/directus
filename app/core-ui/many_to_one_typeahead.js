//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone', 'core/UIComponent', 'core/UIView', 'utils'], function(app, Backbone, UIComponent, UIView, Utils) {

  'use strict';

  var template = '<input type="text" value="{{value}}" class="for_display_only {{size}}" {{#if readonly}}readonly{{/if}}/> \
                  <style> \
                    .tt-hint {padding:10px;} \
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

  var Input = UIView.extend({
    events: {},
    templateSource: template,

    serialize: function() {
      var relatedModel = this.model.get(this.name);
      var value = '';
      // The item is not new, it has a value
      if (!relatedModel.isNew()) {
        value = relatedModel.get(this.visibleColumn);
      }

      return {
        name: this.options.name,
        size: this.columnSchema.options.get('size'),
        readonly: false,
        comment: this.options.schema.get('comment'),
        value: value
      };
    },

    afterRender: function () {
      var template = this.columnSchema.options.get('template');
      var self = this;
      var url = app.API_URL + 'tables/' + this.collection.table.id + '/typeahead/';
      var params = {};

      if(this.visibleColumn) {
        params['columns'] = this.visibleColumn;
      }

      if(1 === parseInt(this.includeInactives, 10)) {
        params['include_inactive'] = 1;
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
        remote: url + '&q=%QUERY',
        dupDetector: function(remoteMatch, localMatch) {
          return remoteMatch.value === localMatch.value;
        }
      });

      fetchItems.initialize();
      // fetchItems.clearPrefetchCache();
      // engine.clearRemoteCache();
      this.$(".for_display_only").typeahead({
        minLength: 1,
        items: 5,
        valueKey: this.visibleColumn,
        template: Handlebars.compile('<div>'+template+'</div>')
      },
      {
        name: 'related-items',
        displayKey: 'value',
        source: fetchItems.ttAdapter()
      });

      this.$('.for_display_only').on('typeahead:selected', function(e, datum) {
        var model = self.model.get(self.name);
        var selectedId = parseInt(datum.id,10);

        model.clear();
        model.set({id: selectedId});
      });
    },

    initialize: function(options) {
      this.visibleColumn = this.columnSchema.options.get('visible_column');
      this.includeInactives = this.columnSchema.options.get('include_inactive');
      var value = this.model.get(this.name);
      this.collection = value.collection.getNewInstance({omit: ['preferences']});
    }
  });

  var Component = UIComponent.extend({
    id: 'many_to_one_typeahead',
    dataTypes: ['INT'],
    variables: [
      {id: 'visible_column', ui: 'textinput', char_length: 64, required: true},
      {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }},
      {id: 'template', ui: 'textinput'},
      {id: 'include_inactive', ui: 'checkbox', def: '0', comment: 'Include Inactive Items', required: false}
    ],
    Input: Input,
    list: function(options) {
      if (options.value === undefined) return '';
      if (options.value instanceof Backbone.Model) return options.value.get(options.settings.get('visible_column'));

      return options.value;
    }
  });

  return Component;
});
