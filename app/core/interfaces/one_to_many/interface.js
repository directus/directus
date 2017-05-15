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
      'click div.related-table > div td:not(.delete)': 'editRow',
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
      attributes[app.statusMapping.status_name] = app.statusMapping.deleted_num;
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
        model.set(model.diff(view.editView.data()));
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
          var data = collection.get(id).toJSON();
          if (me.columnSchema.options.get('only_unassigned') === true) {
            var orphan = false;

            collection.each(function (model) {
              if (model.get(columnName) == null) {
                orphan = true;
              }
            });

            if (orphan) {
              return false;
            }
          }

          data[columnName] = me.model.get('id');
          me.relatedCollection.add(data, {nest: true});
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

      this.listenTo(relatedCollection, 'add change remove', function () {
        this.nestedTableView.render();
      }, this);

      this.relatedCollection = relatedCollection;
    }
  });
});
