//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core-ui/one_to_many', 'core/table/table.view', 'core/overlays/overlays'], function(app, Onetomany, TableView, Overlays) {

  'use strict';

  var Module = {};

  Module.id = 'many_to_many';
  Module.dataTypes = ['MANYTOMANY'];

  Module.variables = [
    {id: 'visible_columns', ui: 'textinput', char_length: 255, required: true},
    {id: 'add_button', ui: 'checkbox', def: '1'},
    {id: 'choose_button', ui: 'checkbox', def: '1'},
    {id: 'remove_button', ui: 'checkbox', def: '1'},
    {id: 'filter_type', ui: 'select', options: {options: {'dropdown':'Dropdown','textinput':'Text Input'} }},
    {id: 'filter_column', ui: 'textinput', char_length: 255, comment: "Enter Column thats value is used for filter search"},
    {id: 'visible_column_template', ui: 'textinput', char_length: 255, comment: "Enter Template For filter dropdown display"},
    {id: 'min_entries', ui: 'numeric', char_length: 11, default_value:0, comment: "Minimum Allowed related Entries"},
    {id: 'no_duplicates', ui: 'checkbox', def: '0', comment: "No Duplicates"}
  ];

  Module.Input = Onetomany.Input.extend({

    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click button[data-action=add]': 'addRow',
      'click button[data-action=insert]': 'insertRow',
      'click td.delete': 'deleteRow'
    },

    template: Handlebars.compile(
      '<div class="related-table"></div>' +
      '<div class="btn-row">{{#if showAddButton}}<button class="btn btn-primary margin-right-small" data-action="add" type="button">Add New</button>{{/if}}' +
      '{{#if showChooseButton}}<button class="btn btn-primary" data-action="insert" type="button">Choose Existing</button>{{/if}}</div>'),

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
          if (me.columnSchema.options.get('no_duplicates')==1) {
            var duplicated = false;
            me.relatedCollection.each(function(model) {
              if (model.get('data').id == id) {
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
        throw "The column " + this.columnSchema.id + " need to have a relationship of the type MANYTOMANY inorder to use the one_to_many ui";
      }

      this.canEdit = !(options.inModal || false);
      this.showRemoveButton = this.columnSchema.options.get('remove_button') === "1";
      this.showChooseButton = this.columnSchema.options.get('choose_button') === "1";
      this.showAddButton = this.columnSchema.options.get('add_button') === "1";

      var relatedCollection = this.model.get(this.name);
      var relatedSchema = relatedCollection.structure;
      var junctionStructure = relatedCollection.junctionStructure;

      var ids = [];

      //Remove inactive items from collection
      for(var i=0; i<relatedCollection.size(); i++) {
        var model = relatedCollection.at(i);
        if(model.get('data').get(app.statusMapping.status_name) !== app.statusMapping.deleted_num) {
          ids.push(model.get('data').id);
        } else {
          relatedCollection.remove(model, {silent: true});
          i--;
        }
      }

      if(ids.length > 0) {
        relatedCollection.nestedCollection.setFilter({ids: ids.slice(0,relatedCollection.nestedCollection.filters.perPage).join(',')});
        relatedCollection.nestedCollection.fetch();
      }

      var blacklist = [];
      var that = this;
      relatedCollection.getColumns().forEach(function(column) {
        if(that.columnSchema.options.get('visible_columns').split(',').indexOf(column) == -1) {
          blacklist.push(column);
        }
      });

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        toolbar: false,
        selectable: false,
        sortable: true,
        footer: false,
        tableHead: false,
        saveAfterDrop: false,
        deleteColumn: this.showRemoveButton,
        hideEmptyMessage: true,
        hideColumnPreferences: true,
        sort: junctionStructure.get('sort') !== undefined,
        blacklist: blacklist
      });

      if(junctionStructure.get('sort') !== undefined) {
        relatedCollection.setOrder('sort','ASC');
      }

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', function() {
        //Check if any rendered objects in collection to show or hide header
        if(this.relatedCollection.filter(function(d){return d.get(app.statusMapping.status_name) !== app.statusMapping.deleted_num;}).length > 0) {
          this.nestedTableView.tableHead = true;
        } else {
          this.nestedTableView.tableHead = false;
        }
        this.nestedTableView.render();
      }, this);

      this.listenTo(relatedCollection.nestedCollection, 'sync', function() {
        this.nestedTableView.render();
      }, this);

      if(ids.length > 0) {
        this.listenTo(relatedCollection.nestedCollection, 'sort', function() {
          //this.relatedCollection.nestedCollection.fetch({includeFilters: false, data: {adv_where: 'id IN (' + ids.join(',') + ')'}, reset:true});
        });
      }
    }
  });

  Module.validate = function(value, options) {
    var minEntries = parseInt(options.settings.get('min_entries'));

    if(value.length < minEntries) {
      return 'This field requires at least ' + minEntries + ' entries.';
    }

    // @TODO: Does not currently consider newly deleted items
    if (options.schema.isRequired() && value.length == 0) {
      return 'This field is required';
    }
  };

  Module.list = function() {
    return 'x';
  };

  return Module;
});
