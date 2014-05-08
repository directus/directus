//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core-ui/one_to_many', 'core/table/table.view', 'core/overlays/overlays'], function(app, Backbone, Onetomany, TableView, Overlays) {

  "use strict";

  var Module = {};

  Module.id = 'many_to_many';
  Module.dataTypes = ['MANYTOMANY'];

  Module.variables = [
    {id: 'visible_columns', ui: 'textinput', char_length: 255, required: true},
    {id: 'add_button', ui: 'checkbox'},
    {id: 'choose_button', ui: 'checkbox'},
    {id: 'remove_button', ui: 'checkbox'}
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
      '<div class="btn-row">{{#if showAddButton}}<button class="btn btn-small btn-primary margin-top-small" data-action="add" type="button">Add New {{{capitalize tableTitle}}} Item</button>{{/if}}' +
      '{{#if showChooseButton}}<button class="btn btn-small btn-primary margin-top-small" data-action="insert" type="button">Choose Existing {{{capitalize tableTitle}}} Item</button>{{/if}}</div>'),

    addRow: function() {
      this.addModel(new this.relatedCollection.nestedCollection.model({}, {collection: this.relatedCollection.nestedCollection, parse: true}));
    },

    deleteRow: function(e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.relatedCollection.get(cid);

      if (model.isNew()) return this.relatedCollection.remove(model);

      model.set({active: 0});
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

      relatedCollection.each(function(model) {
        ids.push(model.get('data').id);
      });

      if(ids.length > 0) {
        //@TODO: Have this not fetch entire collection.
        //relatedCollection.nestedCollection.setFilter({ids: ids.join(',')});
        //relatedCollection.nestedCollection.fetch();
      }

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        toolbar: false,
        selectable: false,
        sortable: true,
        footer: false,
        tableHead: false,
        saveAfterDrop: true,
        deleteColumn: this.showRemoveButton,
        hideEmptyMessage: true,
        hideColumnPreferences: true,
        hasSort: junctionStructure.get('sort') !== undefined
      });
      if(this.columnSchema.has('sort')) {
        relatedCollection.setOrder('sort','ASC');
      }

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', function() {
        //Check if any rendered objects in collection to show or hide header
        if(this.relatedCollection.filter(function(d){return d.get('active') !== 0;}).length > 0) {
          this.nestedTableView.tableHead = true;
        } else {
          this.nestedTableView.tableHead = false;
        }
        this.nestedTableView.render();
      }, this);

      this.listenTo(relatedCollection.nestedCollection, 'sync', function() {
        var models = this.relatedCollection.nestedCollection.filter(function(model) {
          return ids.indexOf(model.id) != -1;
        });
        var  i = 0;
        this.relatedCollection.each(function(model) {
          if(i < models.length) {
            model.get('data').set(models[i].attributes);
          }
          i++;
        });

        this.nestedTableView.render();
      }, this);

      if(ids.length > 0) {
        this.listenTo(relatedCollection.nestedCollection, 'sort', function() {
          //this.relatedCollection.nestedCollection.fetch({includeFilters: false, data: {adv_where: 'id IN (' + ids.join(',') + ')'}, reset:true});
        });
      }
    }

  });

  Module.list = function() {
    return 'x';
  };

  return Module;
});