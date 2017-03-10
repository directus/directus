//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'app',
  'underscore',
  'core/UIComponent',
  'core/UIView',
  'core/table/table.view',
  'core/overlays/overlays',
  'core/uis/_internals/permissions/table',
  'core/t'
], function(app, _, UIComponent, UIView, TableView, Overlays, PermissionsTableView, __t) {

  'use strict';

  var Input = UIView.extend({

    template: '_internals/permissions/interface',

    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click button[data-action=add]': 'addRow',
      'click button[data-action=insert]': 'insertRow',
      'click td.delete': 'deleteRow'
    },

    serialize: function () {
      return {
        isAdmin: this.model.id === 1,
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton, //&& this.canEdit,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function () {
      if (this.model.id !== 1) {
        this.setView('.table-container', this.nestedTableView).render();
      }
    },

    initialize: function (options) {
      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
        'ONETOMANY' !== this.columnSchema.relationship.get('type')) {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'ONETOMANY',
          ui: Component.id
        });
      }

      this.canEdit = !(options.inModal || false);

      var relatedCollection = this.model.get(this.name);
      var joinColumn = this.columnSchema.relationship.get('junction_key_right');
      var ids = relatedCollection.pluck('id');
      // NOTE: This will a collection method in the next version
      var hasUnsavedModels = _.some(relatedCollection.models, function(model) {
        return model.unsavedAttributes();
      });

      if (!hasUnsavedModels && ids.length > 0) {
        //Make sure column we are joining on is respected
        var filters = relatedCollection.filters;
        if (filters.columns_visible.length === 0) {
          filters.columns_visible = relatedCollection.structure.at(0).get('id');
        }

        //Pass this filter to select only where column = val
        filters.related_table_filter = {column: joinColumn, val: this.model.id};

        if(this.columnSchema.options.get('result_limit') !== undefined) {
          filters.perPage = this.columnSchema.options.get('result_limit');
        }

        relatedCollection.fetch({includeFilters: false, data: filters, success: function(collection) {
          _.each(collection.models, function(model) {
            return model.startTracking();
          });
        }});
      }

      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;

      this.nestedTableView = new PermissionsTableView({
        collection: relatedCollection,
        // selectable: false,
        // sortable: false,
        // footer: false,
        // saveAfterDrop: true,
        // deleteColumn: this.canEdit && this.showRemoveButton,
        // hideColumnPreferences: true,
        // hideEmptyMessage: true,
        // tableHead: false,
        // filters: {
        //   booleanOperator: '&&',
        //   expressions: [
        //     //@todo, make sure that this can also nest
        //     {column: joinColumn, operator: '===', value: this.model.id}
        //   ]
        // }
      });

      relatedCollection.setOrder('table_name', 'ASC', {silent: true});

      this.relatedCollection = relatedCollection;
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_permissions',
    dataTypes: ['ONETOMANY'],
    variables: [
      {id: 'visible_columns', type: 'String', ui: 'textinput', char_length: 255, required: true},
      {id: 'result_limit', type: 'Number', ui: 'numeric', char_length: 10, default_value: 100, comment: __t('o2m_result_limit_comment')},
      {id: 'add_button', type: 'Boolean', ui: 'checkbox'},
      {id: 'choose_button', type: 'Boolean', ui: 'checkbox', default_value: true},
      {id: 'remove_button', type: 'Boolean', ui: 'checkbox'},
      {id: 'only_unassigned', type: 'Boolean', ui: 'checkbox', default_value: false}
    ],
    Input: Input,
    validate: function(collection, options) {
      if (options.schema.isRequired() && collection.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function() {
      return 'x';
    }
  });

  return Component;
});
