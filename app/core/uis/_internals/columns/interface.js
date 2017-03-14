//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'underscore', 'core/UIComponent', 'core/UIView', 'core/table/table.view', 'core/overlays/overlays', 'core/notification', 'core/doubleConfirmation', 'core/t', 'sortable'], function(app, _, UIComponent, UIView, TableView, Overlays, Notification, DoubleConfirmation, __t, Sortable) {

  'use strict';

  var Input = UIView.extend({

    template: '_internals/columns/interface',

    events: {
      'click .js-sort-toggle': 'toggleSortable',
      'click .js-row': 'editRow',
      'click .js-cell': 'editCell',
      'click .js-remove': 'verifyDestroyColumn',
      'click .js-button-add': 'addRow',
      'click .js-required': 'toggleRequired',
      'click .js-visible': 'toggleVisibility'
    },

    editCell: function (event) {
      event.stopPropagation();

      var $cell = $(event.currentTarget);
      var id = $cell.closest('.js-row').data('id');
      var viewName = $cell.data('section');
      var focusTo = $cell.data('field');

      this.editRow(id, viewName, focusTo);
    },

    editRow: function(id, viewName, focusTo) {
      if (!this.canEdit) {
        return;
      }

      if (id.currentTarget) {
        id = $(id.currentTarget).data('id');
      }

      var collection = app.schemaManager.getTable(this.model.id).columns;
      var columnModel = collection.get(id, true);

      if (!columnModel) {
        Notification.warning(__t('column_x_not_found', {
          column_name: id
        }));
        return;
      }

      var EditColumnView = require('modules/settings/views/EditColumnView');
      var optionsModel = columnModel.options;
      optionsModel.set({id: columnModel.get('ui')});

      var schema = app.schemaManager.getColumns('ui', optionsModel.id);
      optionsModel.structure = schema;

      switch (viewName) {
        case 'column':
          viewName = EditColumnView.VIEW_COLUMN;
          break;
        default:
        case 'interface':
          viewName = EditColumnView.VIEW_INTERFACE;
          break;
      }

      var view = new EditColumnView({
        model: optionsModel,
        schema: schema,
        currentView: viewName || EditColumnView.VIEW_INTERFACE,
        focusTo: focusTo
      });

      app.router.openViewInModal(view);
    },

    addRow: function() {
      var ColumnModalView = require('modules/settings/views/ColumnModalView');
      var ColumnModel = require('schema/ColumnModel');
      var collection = app.schemaManager.getColumns('tables', this.model.id);

      var model = new ColumnModel({'data_type':'ALIAS','ui':{}}, {collection: collection});
      var view = new ColumnModalView({
        model: model,
        collection: collection
      });

      var columns = this.model.get(this.name);
      this.listenTo(model, 'sync', function (model) {
        columns.add(model);
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

    toggleAttr: function (id, attr) {
      var column = this.columns.get(id);
      var options, attrs, originalUrl;

      if (column) {
        attrs = {};
        attrs[attr] = !column.get(attr);
        options = {patch: true};

        // hotfix:
        originalUrl = column.url;
        column.url = function () {
          return app.API_URL + 'tables/' + column.get('table_name') + '/columns/' + column.get('column_name');
        };

        var self = this;
        options.success = function () {
          column.url = originalUrl;
          self.render();
        };

        column.save(attrs, options);
      }
    },

    // @TODO: Create Base model with an toggle method for boolean values
    // model.toggle('required');
    toggleRequired: function (event) {
      event.stopPropagation();

      var $row = $(event.currentTarget).closest('tr');

      this.toggleAttr($row.data('id'), 'required');
    },

    toggleVisibility: function (event) {
      event.stopPropagation();

      var $row = $(event.currentTarget).closest('tr');

      this.toggleAttr($row.data('id'), 'hidden_input');
    },

    serialize: function() {
      var columns = this.columns.map(function (column) {
        var data = column.toJSON();

        if (!data.relationship_type) {
          data.relationship_type = __t('relationship_none');
        }

        if (!data.comment) {
          data.comment = __t('add_comment');
        }

        return data;
      });

      return {
        columns: columns,
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function () {
      this.enableSort();
    },

    toggleSortable: function() {
      if (this.sortable.options.sort) {
        this.disableSortable();
        Notification.info(__t('table_sort_disabled'), '<i>'+__t('table_sort_disabled_message')+'</i>', {timeout: 3000});
      } else {
        this.enableSortable();
        Notification.info(__t('table_sort_enabled'), '<i>'+__t('table_sort_enabled_message')+'</i>', {timeout: 3000});
      }
    },

    enableSortable: function() {
      this.$('table').removeClass('disable-sorting');
      this.sortable.options.sort = true;
    },

    disableSortable: function() {
      this.$('table').addClass('disable-sorting');
      this.sortable.options.sort = false;
    },

    drop: function () {
      var collection = this.columns;

      this.$('table tbody tr').each(function (i) {
        // Use data-id instead of data-cid
        // As collection models will be synced from the server its cid will be generated again
        // But the dom element will be still pointing to the older cid
        collection.get($(this).data('id')).set({sort: i}, {silent: true});
      });

      var self = this;
      var originalUrl = collection.url;
      var table = this.model.id;
      collection.url = app.API_URL + 'tables/' + table + '/columns';

      collection.save(null, {wait: true, patch: true, success: function () {
        collection = originalUrl;
        self.collection.setOrder('sort', 'ASC', {silent: false});
      }});
    },

    enableSort: function () {
      var container = this.$('table tbody').get(0);

      this.sortable = new Sortable(container, {
        animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
        handle: '.js-sort', // Restricts sort start click/touch to the specified element
        draggable: 'tr', // Specifies which items inside the element should be sortable
        ghostClass: 'sortable-ghost',
        sort: false,
        onStart: function () {
          var tbody = $(container);

          tbody.addClass('remove-hover-state');
          tbody.removeClass('disable-transform');
        },
        onEnd: function () {
          var tbody = $(container);

          tbody.removeClass('remove-hover-state');
          tbody.addClass('disable-transform');
        },
        onUpdate: _.bind(this.drop, this)
      });
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

        if (this.columnSchema.options.get('result_limit') !== undefined) {
          filters.perPage = this.columnSchema.options.get('result_limit');
        }

        relatedCollection.fetch({includeFilters: false, data: filters});
      }

      this.columns = columns;

      if (columns.structure.get('sort')) {
        columns.setOrder('sort','ASC',{silent: true});
      }

      this.listenTo(columns, 'add change remove', this.render);

      this.relatedCollection = columns;
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_columns',
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
