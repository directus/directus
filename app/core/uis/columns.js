//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'underscore', 'core/UIComponent', 'core/UIView', 'core/table/table.view', 'core/overlays/overlays', 'core/notification', 'core/doubleConfirmation', 'core/t'], function(app, _, UIComponent, UIView, TableView, Overlays, Notification, DoubleConfirmation, __t) {

  'use strict';

  var template = '<div class="related-table table-container"></div> \
                  <div class="button-group"> \
                    <div class="button js-button">\
                      <i class="material-icons">add</i> Add New Column\
                    </div> \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,
    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click .js-remove': 'verifyDestroyColumn',
      'click .js-button': 'addRow'
    },

    editRow: function(e) {
      if (!this.canEdit) {
        return;
      }

      var id = $(e.target).closest('tr').data('id');
      var collection = app.schemaManager.getTable(this.model.id).columns;
      var columnModel = collection.get(id, true);
      var EditColumnView = require('modules/settings/views/EditColumnView');
      var optionsModel = columnModel.options;
      optionsModel.set({id: columnModel.get('ui')});

      var schema = app.schemaManager.getColumns('ui', optionsModel.id);
      optionsModel.structure = schema;
      var view = new EditColumnView({
        model: optionsModel,
        schema: schema
      });

      app.router.openViewInModal(view);
    },

    addRow: function() {
      var NewColumnView = require('modules/settings/views/NewColumnView');
      var ColumnModel = require('schema/ColumnModel');
      var collection = app.schemaManager.getColumns('tables', this.model.id);

      var model = new ColumnModel({'data_type':'ALIAS','ui':{}}, {collection: collection});
      var view = new NewColumnView({
        model: model,
        collection: collection
      });

      var columns = this.model.get(this.name);
      this.listenTo(model, 'sync', function(result) {
        model.set(result);
        columns.add(model);
        collection.add(model);
      });

      app.router.openViewInModal(view);
    },

    destroyColumn: function(columnName) {
      var collection = app.schemaManager.getColumns('tables', this.model.id);
      var columns = this.model.get(this.name);
      var originalColumnModel = collection.get(columnName);

      if (!originalColumnModel) {
        return;
      }

      var columnModel = originalColumnModel.clone();
      // url can be a function or a string
      // getting the result directly from the original model will prevent issue calling the function
      // calling the url() on the cloned model will throw an error because it doesn't have a collection object
      columnModel.url = _.result(originalColumnModel, 'url');

      if (!columnModel) {
        Notification.error('Error', 'Column '+columnName+' not found.');
        return;
      }

      var self = this;
      var onSuccess = function(model, response) {
        if (!response.success) {
          Notification.error('Column not removed', response.message);
        } else {
          self.collection.remove(originalColumnModel);
          collection.remove(originalColumnModel);
          columns.remove(originalColumnModel);
          self.$el.find('[data-id=' + model.get('id') + ']').remove();
          Notification.success('Column removed', '<b>' + columnName + '</b> was removed.');
        }
      };

      var onError = function(model, resp, options) {
        Notification.error('Column not removed', resp.responseJSON.message);
      };

      columnModel.destroy({success: onSuccess, error: onError, wait: true});
    },

    verifyDestroyColumn: function(event) {
      event.stopPropagation();

      var self = this;
      var columnName = $(event.target).closest('tr').attr('data-id');
      var destroyColumn = function() {
        self.destroyColumn(columnName);
      };

      DoubleConfirmation({
        value: columnName,
        emptyValueMessage: __t('invalid_column'),

        firstQuestion: __t('question_delete_this_column'),
        secondQuestion: __t('question_delete_this_column_confirm', {column_name: columnName}),
        notMatchMessage: __t('column_name_did_not_match'),
        callback: destroyColumn
      }, this);
    },

    serialize: function() {
      return {
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function() {
      this.setView('.related-table', this.nestedTableView).render();
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

      var columns = this.model.get(this.name);
      var relatedCollection = columns.structure;
      var joinColumn = this.columnSchema.relationship.get('junction_key_right');
      var ids = relatedCollection.pluck('id');

      if (ids.length > 0) {
        // Make sure column we are joining on is respected
        var filters = columns.filters || {};
        if (filters.columns_visible.length === 0) {
          filters.columns_visible = relatedCollection.structure.at(0).get('id');
        }

        //Pass this filter to select only where column = val
        filters.related_table_filter = {column: joinColumn, val: this.model.id};

        if(this.columnSchema.options.get('result_limit') !== undefined) {
          filters.perPage = this.columnSchema.options.get('result_limit');
        }

        relatedCollection.fetch({includeFilters: false, data: filters});
      }

      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;

      this.nestedTableView = new TableView({
        collection: columns,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: true,
        deleteColumn: this.canEdit && this.showRemoveButton,
        hideColumnPreferences: true,
        hideEmptyMessage: true,
        tableHead: false,
        fixedHead: false,
        showRemoveButton: true,
        filters: {
          booleanOperator: '&&',
          expressions: [
            //@todo, make sure that this can also nest
            {column: joinColumn, operator: '===', value: this.model.id}
          ]
        }
      });

      if (columns.structure.get('sort')) {
        columns.setOrder('sort','ASC',{silent: true});
      }

      this.listenTo(columns, 'add change remove', function() {
        this.nestedTableView.render();
      }, this);

      this.relatedCollection = columns;
    }
  });

  var Component = UIComponent.extend({
    id: 'columns',
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
