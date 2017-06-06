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
  'core/interfaces/one_to_many/component',
  'core/table/table.view',
  'core/overlays/overlays',
  'core/t'
], function (app, _, Onetomany, TableView, Overlays, __t) {

  'use strict';

  return Onetomany.prototype.Input.extend({

    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click .js-button': 'onClickButton',
      'click td.delete': 'deleteRow'
    },

    template: 'relational/table',

    addRow: function() {
      this.addModel(new this.relatedCollection.nestedCollection.model({}, {collection: this.relatedCollection.nestedCollection, parse: true}));
    },

    deleteRow: function(e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.relatedCollection.get(cid);

      if (model.isNew()) return this.relatedCollection.remove(model);
      var name = {};
      name[app.statusMapping.status_name] = app.statusMapping.deleted_num;
      model.set(name);
    },

    addModel: function(model) {
      var EditView = require("modules/tables/views/EditView");
      var collection = this.relatedCollection;
      var view = new EditView({model: model, inModal: true});
      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function() {
          this.save();
        },
        'click #removeOverlay': function() {
          app.router.removeOverlayPage(this);
        }
      };


      app.router.overlayPage(view);

      view.save = function() {
        model.set(view.editView.data());
        collection.add(model,{nest: true});
        app.router.removeOverlayPage(this);
      };
    },

    insertRow: function() {
      var highLightIds = this.relatedCollection.map(function(model) {
        return model.get('data').id;
        //pluck('id');
      });
      var collection = app.getEntries(this.relatedCollection.table.id);
      var view = new Overlays.ListSelect({collection: collection});
      app.router.overlayPage(view);

      //please proxy this instead
      var me = this;

      view.save = function() {
        _.each(view.table.selection(), function(id) {
          var data = collection.get(id).toJSON();
          // prevent duplicate
          if (me.columnSchema.options.get('no_duplicates') === true) {
            var duplicated = false;
            me.relatedCollection.each(function(model) {
              if (model.get('data').id === id) {
                duplicated = true;
              }
            });
            if (duplicated) {
              return false;
            }
          }
          me.relatedCollection.add(data, {parse: true, silent: true, nest: true});
        }, this);
        me.relatedCollection.trigger('add');
        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    initialize: function(options) {
      if (!this.columnSchema.relationship ||
        'MANYTOMANY' !== this.columnSchema.relationship.get('type')) {
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
      var relatedSchema = relatedCollection.structure;
      var junctionStructure = relatedCollection.junctionStructure;

      var ids = [];

      //Remove inactive items from collection
      for (var i=0; i<relatedCollection.size(); i++) {
        var model = relatedCollection.at(i);
        if (!model.get('data').isDeleted()) {
          ids.push(model.get('data').id);
        } else {
          relatedCollection.remove(model, {silent: true});
          i--;
        }
      }

      if (ids.length === 0) {
        relatedCollection.nestedCollection.setFilter({
          ids: ids.slice(0,relatedCollection.nestedCollection.filters.perPage).join(',')
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
        deleteColumn: this.showRemoveButton,
        hideEmptyMessage: true,
        hideColumnPreferences: true,
        sort: junctionStructure.get('sort') !== undefined,
        blacklist: this.getBlacklistedColumnsName()
      });

      if (junctionStructure.get('sort') !== undefined) {
        relatedCollection.setOrder('sort','ASC');
      }

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', this.onCollectionChange);
      this.listenTo(relatedCollection.nestedCollection, 'sync', this.onCollectionChange);
    }
  });
});
