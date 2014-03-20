//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core/table/table.view', 'schema/SchemaManager', 'core/UIView'], function(app, Backbone, TableView, SchemaManager, UIView) {

  "use strict";

  var Module = {};

  Module.id = 'one_to_many';
  Module.dataTypes = ['ONETOMANY'];

  Module.variables = [
    {id: 'visible_columns', ui: 'textinput', char_length: 255, required: true},
    {id: 'add_button', ui: 'checkbox'},
    {id: 'remove_button', ui: 'checkbox'}
  ];

  var template = '<div class="related-table"></div> \
                  <div class="btn-row">{{#if showAddButton}}<button class="btn btn-small btn-primary" data-action="add" type="button">Add New {{{capitalize tableTitle}}} Item</button>{{/if}} \
                  {{#if manyToMany}}{{#if canEdit}}<button class="btn btn-small btn-primary" data-action="insert" type="button">Choose Existing {{{capitalize tableTitle}}} Item</button>{{/if}}{{/if}}</div>';

  Module.Input = UIView.extend({

    tagName: 'div',
    template: Handlebars.compile(template),
    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click button[data-action=add]': 'addRow',
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

      model.set(relatedColumnName, '');
    },

    addRow: function() {
      var collection = this.relatedCollection;
      this.addModel(new collection.model({}, {collection: collection, parse: true, structure: collection.structure, table: collection.table, privileges: collection.privileges}));
    },

    editModel: function(model) {
      var EditView = require("core/edit");
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var view = new EditView({model: model, hiddenFields: [columnName], inModal: true});
      var modal = app.router.openModal(view, {stretch: true, title: 'Edit'});

      modal.save = function() {
        model.set(model.diff(view.data()));
        console.log(model);
        modal.close();
      };

      // Fetch first time to get the nested tables
      if (!model.hasChanged() && !model.isNew()) {
        model.fetch();
      } else {
        view.render();
      }
    },

    addModel: function(model) {
      var EditView = require("core/edit");
      var collection = this.relatedCollection;

      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var id = this.model.id;

      var view = new EditView({
        model: model,
        collectionAdd: true,
        inModal: true,
        parentField: {
          name: columnName,
          value: id
        }
      });

      var modal = app.router.openModal(view, {stretch: true, title: 'Add'});

      modal.save = function() {
        var data = view.data();
        data[columnName] = id;
        model.set(data);
        if (model.isValid()) {
          collection.add(model, {nest: true});
          modal.close();
        }
      };

      view.render();
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
      console.log('after render');
      this.setView('.related-table', this.nestedTableView).render();
    },

    validateRelationship: function() {
    },

    initialize: function (options) {

      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
           'ONETOMANY' !== this.columnSchema.relationship.get('type')) {
        throw "The column " + this.columnSchema.id + " need to have a relationship of the type ONETOMANY inorder to use the one_to_many ui";
      }

      this.canEdit = !(options.inModal || false);

      var relatedCollection = this.model.get(this.name);
      var joinColumn = this.columnSchema.relationship.get('junction_key_right');

      this.showRemoveButton = this.columnSchema.options.get('remove_button') === "1";
      this.showAddButton = this.columnSchema.options.get('add_button') === "1";

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        toolbar: false,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: false,
        deleteColumn: (relatedCollection.structure.get(joinColumn).get('is_nullable') === "YES") && this.canEdit && this.showRemoveButton,
        hideEmptyMessage: true,
        filters: {
          booleanOperator: '&&',
          expressions: [
            //@todo, make sure that this can also nest
            {column: joinColumn, operator: '===', value: this.model.id}
          ]
        }
      });

      this.listenTo(relatedCollection, 'change add remove', this.nestedTableView.render, this);

      this.relatedCollection = relatedCollection;

      //console.log(options);
/*
      //var schema = options.schema | console.log(options.model);
      this.related = {};
      this.related.table = app.schemaManager.getTable(options.schema.relationship.get('table_related'));
      this.related.schema = app.schemaManager.getColumns('tables', options.schema.relationship.get('table_related'));
      this.related.entries = options.value;

      this.related.tableOptions = {
        collection: this.related.entries,
        toolbar: false,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: false,
        deleteColumn: true,
        hideEmptyMessage: true
      };

      // Since this initialize function can be used for both many-many
      // and one-many relationships we need some extra stuff for one-many deletes
      if (this.options.settings.id === "one_to_many") {
        var columnName = this.options.schema.relationship.get('junction_key_right');
        this.related.tableOptions.deleteColumn = (this.related.schema.get(columnName).get('is_nullable') === "YES");

        this.related.tableOptions.filters = {
          booleanOperator: '&&',
          expressions: [
            {column: columnName, operator: '===', value: this.model.id}
          ]
        };
      }

      this.table = TableView.extend({});

      this.view = new this.table(this.related.tableOptions);

      this.related.entries.on('change add remove', function() {
        this.view.render();
      }, this);
    */
    }

  });

  Module.list = function() {
    return 'x';
  };

  return Module;
});