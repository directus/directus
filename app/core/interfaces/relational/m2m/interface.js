/* global $ */
define([
  'app',
  'underscore',
  'core/interfaces/one_to_many/component',
  'core/table/table.view',
  'core/overlays/overlays',
  'core/t'
], function (app, _, Onetomany, TableView, Overlays, __t) {
  'use strict';

  return Onetomany.prototype.Input.extend({

    events: {
      'click div.related-table td:not(.relational-remove)': 'editRow',
      'click .js-button': 'onClickButton',
      'click .js-remove': 'deleteRow'
    },

    template: 'relational/table',

    addRow: function () {
      this.addModel(new this.relatedCollection.nestedCollection.model({}, {collection: this.relatedCollection.nestedCollection, parse: true})); // eslint-disable-line new-cap
    },

    deleteRow: function (event) {
      var cid = $(event.currentTarget).closest('tr').data('cid');
      var model = this.relatedCollection.get(cid);
      var attributes = {};

      if (model.isNew()) {
        this.relatedCollection.remove(model);
      } else {
        // FIXME: Make a method to encapsulate all this functionality
        // duplicated across all the relational interfaces
        var junctionTable = this.relatedCollection.junctionStructure.table;
        var statusColumnName = junctionTable.getStatusColumnName();
        var statusValue = model.getTableStatuses().getDeleteValue();

        if (!statusColumnName) {
          statusColumnName = app.statusMapping.get('*').get('status_name');
          statusValue = app.statusMapping.get('*').get('delete_value');
        }

        attributes[statusColumnName] = statusValue;
        model.set(attributes);
      }
    },

    addModel: function (model) {
      var OverlayEditView = require('modules/tables/views/OverlayEditView'); // eslint-disable-line import/no-unresolved
      var collection = this.relatedCollection;

      var view = new OverlayEditView({
        model: model,
        inModal: true,
        onSave: function () {
          var newModel = new collection.model({}, { // eslint-disable-line new-cap
            parse: true,
            collection: collection,
            structure: collection.structure,
            table: collection.table
          });

          newModel.set('data', model);
          collection.add(newModel);
          app.router.removeOverlayPage(this);
        }
      });
      app.router.overlayPage(view);
    },

    insertRow: function () {
      var collection = app.getEntries(this.relatedCollection.table.id);
      var view = new Overlays.ListSelect({collection: collection});
      app.router.overlayPage(view);

      // please proxy this instead
      var me = this;

      view.save = function () {
        _.each(view.table.selection(), function (id) {
          var data = collection.get(id).toJSON();
          // prevent duplicate
          if (me.columnSchema.options.get('no_duplicates') === true) {
            var duplicated = false;
            me.relatedCollection.each(function (model) {
              if (model.get('data').id === id) {
                duplicated = true;
              }
            });

            if (duplicated) {
              return false;
            }
          }
          me.relatedCollection.add(data, {parse: true, silent: false, nest: true});
        }, this);

        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    initialize: function (options) {
      if (!this.columnSchema.relationship ||
        this.columnSchema.relationship.get('type') !== 'MANYTOMANY') {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'MANYTOMANY',
          ui: 'many_to_many'
        });
      }

      this.canEdit = !(options.inModal || false);
      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;

      var relatedCollection = this.model.get(this.name);
      var junctionStructure = relatedCollection.junctionStructure;

      var ids = [];

      // Remove inactive items from collection
      for (var i = 0; i < relatedCollection.size(); i++) {
        var model = relatedCollection.at(i);
        if (model.get('data').isDeleted()) {
          relatedCollection.remove(model, {silent: true});
          i--;
        } else {
          ids.push(model.get('data').id);
        }
      }

      if (ids.length === 0) {
        relatedCollection.nestedCollection.setFilter({
          ids: ids.slice(0, relatedCollection.nestedCollection.filters.perPage).join(',')
        });
        relatedCollection.nestedCollection.fetch();
      }

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        toolbar: false,
        system: false,
        selectable: false,
        sortable: true,
        footer: false,
        tableHead: false,
        saveAfterDrop: false,
        showRemoveButton: this.showRemoveButton,
        hideEmptyMessage: true,
        hideColumnPreferences: true,
        sort: junctionStructure.get('sort') !== undefined,
        blacklist: this.getBlacklistedColumnsName()
      });

      if (junctionStructure.get('sort') !== undefined) {
        relatedCollection.setOrder('sort', 'ASC');
      }

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', this.onCollectionChange);
      this.listenTo(relatedCollection.nestedCollection, 'sync', this.onCollectionChange);
      this.listenTo(relatedCollection, 'sort', this.onCollectionSorted);
    }
  });
});
