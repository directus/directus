//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core/table/table.view'], function(app, Backbone, TableView) {

  "use strict";

  var Module = {};

  Module.id = 'one_to_many';
  Module.dataTypes = ['ONETOMANY'];

  Module.variables = [
    {id: 'visible_columns', ui: 'textinput', char_length: 255, required: true}
  ];

  var template = '<label>{{{capitalize title}}}</label> \
      <div class="related-table"></div> \
      <div class="btn-row"><button class="btn btn-small btn-primary" data-action="add" type="button">Add New {{{capitalize tableTitle}}} Item</button> \
      {{#if manyToMany}}<button class="btn btn-small btn-primary" data-action="insert" type="button">Choose Existing {{{capitalize tableTitle}}} Item</button>{{/if}}</div>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',
    template: Handlebars.compile(template),
    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click button[data-action=add]': 'addRow',
      'click td.delete': 'deleteRow'
    },

    editRow: function(e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.related.entries.get(cid, true);
      this.editModel(model);
    },

    deleteRow: function(e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.related.entries.get(cid);
      var relatedColumnName = this.options.schema.get('junction_key_right');

      if (model.isNew()) return this.related.entries.remove(model);

      model.set(relatedColumnName, '');

    },

    addRow: function() {
      this.addModel(new this.related.entries.model({}, {collection: this.related.entries, parse: true}));
    },

    editModel: function(model) {
      var EditView = require("core/edit");
      var columnName = this.options.schema.get('junction_key_right');
      var view = new EditView({model: model, hiddenFields: [columnName]});
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
      var modal;
      var collection = this.related.entries;
      var columnName = this.options.schema.get('junction_key_right');
      var id = this.model.id;

      var view = new EditView({
        model: model,
        collectionAdd: true,
        parentField: {
          name: columnName,
          value: id
        }
      });

      modal = app.router.openModal(view, {stretch: true, title: 'Add'});

      modal.save = function() {
        var data = view.data();
        data[columnName] = id;
        model.set(data);
        collection.add(model, {nest: true});
        this.close();
      };

      view.render();
    },

    serialize: function() {
      return {title: this.options.name, tableTitle: this.related.table.get('table_name')};
    },

    afterRender: function() {
      this.setView('.related-table', this.view).render();
    },

    //NOTE: OVERRIDE THIS IN MANY-MANY INSTEAD OF USING CONDITIONALS
    initialize: function (options) {
      this.related = {};
      this.related.table = app.schemaManager.getTable(options.schema.get('table_related'));
      this.related.schema = app.schemaManager.getColumns('tables', options.schema.get('table_related'));
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
        var columnName = this.options.schema.get('junction_key_right');
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
    }

  });

  Module.list = function() {
    return 'x';
  };

  return Module;
});