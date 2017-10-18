/* global $ */
define([
  'core/interfaces/one_to_many/component',
  'underscore',
  'app',
  'utils',
  'core/notification',
  'core/UIView',
  'core/table/table.view',
  'core/overlays/overlays',
  'core/t'
], function (Component, _, app, Utils, Notification, UIView, TableView, Overlays, __t) {
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
      event.stopPropagation();

      switch (action) {
        case 'insert':
          this.insertRow();
          break;
        case 'add':
          this.addRow();
          break;
        default:
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

    deleteRow: function (event) {
      var cid = $(event.currentTarget).closest('tr').data('cid');
      var model = this.relatedCollection.get(cid);
      var relatedColumnName = this.columnSchema.relationship.get('junction_key_right');

      event.preventDefault();
      event.stopPropagation();

      if (model.isNew()) {
        return this.relatedCollection.remove(model);
      }

      // FIXME: Make a method to encapsulate all this functionality
      // duplicated across all the relational interfaces
      var attributes = {};
      var relatedTable = this.relatedCollection.structure.table;
      var statusColumnName = relatedTable.getStatusColumnName();
      var statusValue = model.getTableStatuses().getDeleteValue();

      if (statusColumnName) {
        attributes[statusColumnName] = statusValue;
      }

      attributes[relatedColumnName] = null;
      model.set(attributes);
    },

    addRow: function () {
      var collection = this.relatedCollection;

      this.addModel(new collection.model({}, { // eslint-disable-line new-cap
        collection: collection,
        parse: true,
        structure: collection.structure,
        table: collection.table,
        privileges: collection.privileges
      }));
    },

    editModel: function (model) {
      var self = this;
      var OverlayEditView = require('modules/tables/views/OverlayEditView'); // eslint-disable-line import/no-unresolved
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var view = new OverlayEditView({
        model: model,
        hiddenFields: [columnName],
        skipFetch: (model.isNew() || model.hasUnsavedAttributes()),
        onSave: function () {
          // trigger changes on the related collection
          // to be visible on the listing table
          self.onCollectionChange();
          app.router.removeOverlayPage(this);
        }
      });

      app.router.overlayPage(view);
    },

    addModel: function (model) {
      var OverlayEditView = require('modules/tables/views/OverlayEditView'); // eslint-disable-line import/no-unresolved
      var collection = this.relatedCollection;
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var id = this.model.id;

      var view = new OverlayEditView({
        model: model,
        collectionAdd: true,
        hiddenFields: [columnName],
        parentField: {
          name: columnName,
          value: id
        },
        skipFetch: true,
        onSave: function () {
          model.set(columnName, id);

          if (model.isValid()) {
            app.router.removeOverlayPage(this);
            collection.add(model, {nest: true});
          }
        }
      });

      app.router.overlayPage(view);

    },

    insertRow: function () {
      var me = this;
      var onlyUnassigned = me.columnSchema.options.get('only_unassigned') === true;
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var collection = app.getEntries(this.relatedCollection.table.id);
      var isModelSelectable = function (model) {
        var selectable = true;

        if (onlyUnassigned && model.get(columnName, {flatten: true}) !== null) {
          selectable = false;
        }

        return selectable;
      };
      var view = new Overlays.ListSelect({
        collection: collection,
        isModelSelectable: isModelSelectable
      });

      app.router.overlayPage(view);
      view.save = function () {
        _.each(view.table.selection(), function (id) {
          var existingModel = me.relatedCollection.get(id);
          var model = collection.get(id);
          var newModel = model.clone();
          var reAdd = existingModel && existingModel.getStatusValue() === existingModel.getTableStatuses().getDeleteValue();

          if (!reAdd && model.get(columnName, {flatten: true}) !== null && onlyUnassigned) {
            Notification.warning(__t('o2m_warning_item_already_assigned'));
            return;
          }

          if (existingModel && reAdd) {
            var attributes = {};

            attributes[existingModel.table.getStatusColumnName()] = Number(existingModel.table.getStatusDefaultValue());
            attributes[columnName] = me.model.id;
            if (!existingModel._isTracking) {
              existingModel.startTracking();
            }

            existingModel.set(attributes);
          } else {
            if (!newModel._isTracking) {
              newModel.startTracking();
            }

            newModel.set(columnName, me.model.id);
            me.relatedCollection.add(newModel, {nest: true});
          }
        }, this);

        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    serialize: function () {
      var relatedTablePrivilege = app.schemaManager.getPrivileges(this.columnSchema.getRelatedTableName());

      return {
        name: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton,
        showAddButton: this.showAddButton && relatedTablePrivilege.canAdd()
      };
    },

    afterRender: function () {
      this.setView('#related_table_' + this.name, this.nestedTableView).render();
    },

    triggerModelChange: function () {
      var value = this.model.get(this.name);

      // NOTE: setting the value again to mark the changes
      this.model.set(this.name, value);
    },

    onCollectionSorted: function () {
      this.triggerModelChange();
    },

    onCollectionChange: function () {
      this.triggerModelChange();
      this.nestedTableView.tableHead = this.relatedCollection.visibleCount() > 0;
      this.nestedTableView.render();
    },

    getWhitelistedColumnsName: function () {
      var whitelist = [];
      var relatedCollection = this.model.get(this.name);
      var columns = relatedCollection.structure.pluck('id');
      var visibleColumns = Utils.parseCSV(this.columnSchema.options.get('visible_columns'));

      columns.forEach(function (column) {
        if (visibleColumns.indexOf(column) >= 0) {
          whitelist.push(column);
        }
      }, this);

      return whitelist;
    },

    getBlacklistedColumnsName: function () {
      var blacklist = [];
      var relatedCollection = this.model.get(this.name);
      var columns = relatedCollection.structure.pluck('id');
      var visibleColumns = Utils.parseCSV(this.columnSchema.options.get('visible_columns'));

      columns.forEach(function (column) {
        if (visibleColumns.indexOf(column) === -1) {
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
        relatedCollection.fetch({includeFilters: false, silent: true, data: filters, success: function (collection) {
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
      this.listenTo(relatedCollection, 'sort', this.onCollectionSorted);

      this.relatedCollection = relatedCollection;
    }
  });
});
