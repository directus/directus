//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'core/table/table.view', 'core/overlays/overlays', 'core/t'], function(app, UIComponent, UIView, TableView, Overlays, __t) {

  'use strict';

  var template = '<div class="related-table"></div> \
                  <div class="btn-row">\
                  {{#if showAddButton}}\
                    <button class="btn btn-primary" data-action="add" type="button">{{tVarCapitalize "add_new_x_item" table=tableTitle}}</button>\
                  {{/if}}\
                  {{#if showChooseButton}}\
                    <button class="btn btn-primary" data-action="insert" type="button">{{t "choose_existing"}}</button>\
                  {{/if}}\
                  </div>';

  var Input = UIView.extend({
    templateSource: template,
    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click button[data-action=add]': 'addRow',
      'click button[data-action=insert]': 'insertRow',
      'click td.delete': 'deleteRow'
    },

    editRow: function(e) {
      if (!this.canEdit) {
        return;
      }

      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.relatedCollection.get(cid, true);
      this.editModel(model);
    },

    deleteRow: function(e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.relatedCollection.get(cid);
      var relatedColumnName = this.columnSchema.relationship.get('junction_key_right');

      if (model.isNew()) return this.relatedCollection.remove(model);

      var attributes = {};
      attributes[app.statusMapping.status_name] = app.statusMapping.deleted_num;
      attributes[relatedColumnName] = null;
      model.set(attributes);
    },

    addRow: function() {
      var collection = this.relatedCollection;
      this.addModel(new collection.model({}, {collection: collection, parse: true, structure: collection.structure, table: collection.table, privileges: collection.privileges}));
    },

    editModel: function(model) {
      var EditView = require("modules/tables/views/EditView");
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
        'click .saved-success': function() {
          this.save();
        },
        'click #removeOverlay': function() {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function() {
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
        'click .saved-success': function() {
          this.save();
        },
        'click #removeOverlay': function() {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function() {
        var data = view.editView.data();
        data[columnName] = id;
        model.set(data);

        if (model.isValid()) {
          app.router.removeOverlayPage(this);
          collection.add(model, {nest: true});
        }
      };
    },

    insertRow: function() {
      var me = this;
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var collection = app.getEntries(this.relatedCollection.table.id);
      var view = new Overlays.ListSelect({collection: collection});

      app.router.overlayPage(view);
      view.save = function() {
        _.each(view.table.selection(), function(id) {
          var data = collection.get(id).toJSON();
          if (me.columnSchema.options.get('only_unassigned') === true) {
            var orphan = false;

            collection.each(function(model) {
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

    serialize: function() {
      return {
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton, //&& this.canEdit,
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

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: true,
        deleteColumn: this.canEdit && this.showRemoveButton,
        hideColumnPreferences: true,
        hideEmptyMessage: true,
        tableHead: false,
        filters: {
          booleanOperator: '&&',
          expressions: [
            //@todo, make sure that this can also nest
            {column: joinColumn, operator: '===', value: this.model.id}
          ]
        }
      });

      if (relatedCollection.structure.get('sort')) {
        relatedCollection.setOrder('sort','ASC',{silent: true});
      }

      this.listenTo(relatedCollection, 'add change', function() {
        //Check if any rendered objects in collection to show or hide header
        if(this.relatedCollection.filter(function(d){return d.get(app.statusMapping.status_name) !== app.statusMapping.deleted_num;}).length > 0) {
          this.nestedTableView.tableHead = true;
        } else {
          this.nestedTableView.tableHead = false;
        }
        this.nestedTableView.render();
      }, this);

      this.listenTo(relatedCollection, 'remove', function() {
        this.nestedTableView.render();
      }, this);

      this.relatedCollection = relatedCollection;
    }
  });

  var Component = UIComponent.extend({
    id: 'one_to_many',
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
