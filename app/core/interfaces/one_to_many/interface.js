define([
  'core/interfaces/one_to_many/component',
  'underscore',
  'app',
  'core/UIView',
  'core/table/table.view',
  'core/overlays/overlays',
  'core/t'
], function (Component, _, app, UIView, TableView, Overlays, __t) {
  'use strict';

  return UIView.extend({
    template: 'relational/table',
    events: {
      'click div.related-table td:not(.relational-remove)': 'editRow',
      'click .js-button': 'onClickButton',
      'click .js-remove': 'deleteRow'
    },

    onClickButton: function (event) {
      var action = $(event.currentTarget).data('action');

      event.preventDefault();

      switch (action) {
        case 'insert':
          this.insertRow();
          break;
        case 'add':
          this.addRow();
          break;
      }
    },

    editRow: function (e) {
      if (!this.canEdit) {
        return;
      }

      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.relatedCollection.get(cid, true);
      this.editModel(model);
    },

    deleteRow: function (e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.relatedCollection.get(cid);
      var relatedColumnName = this.columnSchema.relationship.get('junction_key_right');

      if (model.isNew()) {
        return this.relatedCollection.remove(model);
      }

      var attributes = {};
      attributes[model.table.getStatusColumnName()] = model.getTableStatuses().getDeleteValue();
      attributes[relatedColumnName] = null;
      model.set(attributes);
    },

    addRow: function () {
      var collection = this.relatedCollection;

      this.addModel(new collection.model({}, {
        collection: collection,
        parse: true,
        structure: collection.structure,
        table: collection.table,
        privileges: collection.privileges
      }));
    },

    editModel: function (model) {
      var EditView = require('modules/tables/views/EditView');
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var view = new EditView({
        model: model,
        hiddenFields: [columnName],
        skipFetch: (model.isNew() || model.unsavedAttributes())
      });

      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function () {
          this.save();
        },
        'click #removeOverlay': function () {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function () {
        app.router.removeOverlayPage(this);
      };
    },

    addModel: function (model) {
      var EditView = require('modules/tables/views/EditView');
      var collection = this.relatedCollection;
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var id = this.model.id;

      var view = new EditView({
        model: model,
        collectionAdd: true,
        hiddenFields: [columnName],
        parentField: {
          name: columnName,
          value: id
        },
        skipFetch: true
      });

      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function () {
          this.save();
        },
        'click #removeOverlay': function () {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function () {
        var data = view.editView.data();
        data[columnName] = id;
        model.set(data);

        if (model.isValid()) {
          app.router.removeOverlayPage(this);
          collection.add(model, {nest: true});
        }
      };
    },

    insertRow: function () {
      var me = this;
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var collection = app.getEntries(this.relatedCollection.table.id);
      var view = new Overlays.ListSelect({collection: collection});

      app.router.overlayPage(view);
      view.save = function () {
        _.each(view.table.selection(), function (id) {
          var existingModel = me.relatedCollection.get(id);
          var model = collection.get(id);
          var data = model.toJSON();
          var reAdd = existingModel && existingModel.getStatusValue() === existingModel.getTableStatuses().getDeleteValue();
          var onlyUnassigned = me.columnSchema.options.get('only_unassigned') === true;

          if (!reAdd && model.get(columnName, {flatten: true}) != null && onlyUnassigned) {
            return
          }

          if (existingModel && reAdd) {
            var attributes = {};

            attributes[existingModel.table.getStatusColumnName()] = Number(existingModel.table.getStatusDefaultValue());
            attributes[columnName] = me.model.id;
            existingModel.set(attributes);
          } else {
            data[columnName] = me.model.id;
            me.relatedCollection.add(data, {nest: true});
          }
        }, this);

        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    serialize: function () {
      return {
        name: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton, // && this.canEdit,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function () {
      this.setView('#related_table_' + this.name, this.nestedTableView).render();
    },

    onCollectionChange: function () {
      this.nestedTableView.tableHead = this.relatedCollection.visibleCount() > 0;
      this.nestedTableView.render();
    },

    getBlacklistedColumnsName: function () {
      var blacklist = [];
      var relatedCollection = this.model.get(this.name);
      var columns = relatedCollection.structure.pluck('id');

      columns.forEach(function (column) {
        if (this.columnSchema.options.get('visible_columns').split(',').indexOf(column) === -1) {
          blacklist.push(column);
        }
      }, this);

      return blacklist;
    },

    initialize: function (options) {
      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
           this.columnSchema.relationship.get('type') !== 'ONETOMANY') {
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
      var hasUnsavedModels = _.some(relatedCollection.models, function (model) {
        return model.unsavedAttributes();
      });


      // NOTE: Do we really need to fetch this data when we already have it on the main/parent model?
      if (!hasUnsavedModels && ids.length > 0) {
        // Make sure column we are joining on is respected
        var filters = relatedCollection.filters;
        var visibleColumns = filters.columns_visible;
        var actualVisibleColumns = visibleColumns.slice(0);

        if (visibleColumns.length === 0) {
          visibleColumns = [relatedCollection.structure.at(0).get('id')];
          actualVisibleColumns = visibleColumns;
        }

        // TODO: Create helper to add column only if missing avoiding duplicate
        // when fetching relational data we need to make sure to fetch system columns
        // and the related column
        if (relatedCollection.table.hasPrimaryColumn() && visibleColumns.indexOf(relatedCollection.table.getPrimaryColumnName()) < 0) {
          visibleColumns.push(relatedCollection.table.getPrimaryColumnName());
        }

        if (visibleColumns.indexOf(joinColumn) < 0) {
          visibleColumns.push(joinColumn);
        }

        // Pass this filter to select only where column = val
        filters.related_table_filter = {column: joinColumn, val: this.model.id};

        filters.columns_visible = visibleColumns.join(',');
        if (this.columnSchema.options.get('result_limit') !== undefined) {
          filters.perPage = this.columnSchema.options.get('result_limit');
        }

        if (!filters.filters) {
          filters.filters = {};
        }

        // Get all entries
        filters.preview = true;

        // only fetch related items
        filters.filters[joinColumn] = this.model.id;

        // avoid fetching the relational value
        filters.depth = 1;
        relatedCollection.fetch({includeFilters: false, data: filters, success: function (collection) {
          var filters = collection.filters;

          filters.columns_visible = actualVisibleColumns;

          _.each(collection.models, function (model) {
            return model.startTracking();
          });
        }});
      }

      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: true,
        showRemoveButton: this.canEdit && this.showRemoveButton,
        hideColumnPreferences: true,
        hideEmptyMessage: true,
        tableHead: false,
        blacklist: this.getBlacklistedColumnsName(),
        filters: {
          booleanOperator: '&&',
          expressions: [
            // @todo, make sure that this can also nest
            {column: joinColumn, operator: '===', value: this.model.id}
          ]
        }
      });

      if (relatedCollection.structure.get('sort')) {
        relatedCollection.setOrder('sort', 'ASC', {silent: true});
      }

      this.listenTo(relatedCollection, 'add change remove', this.onCollectionChange);

      this.relatedCollection = relatedCollection;
    }
  });
});
