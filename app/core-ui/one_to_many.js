//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core/directus'], function(app, Backbone, Directus) {

  var Module = {};

  Module.id = 'one_to_many';
  Module.dataTypes = ['ONETOMANY'];

  Module.variables = [
    {id: 'visible_columns', ui: 'textinput', char_length: 255}
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
      'click button[data-action=add]': 'addRow'
    },

    editRow: function(e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.related.entries.get(cid, true);
      this.editModel(model);
    },

    addRow: function() {
      this.addModel(new this.related.entries.model({}, {collection: this.related.entries, parse: true}));
    },

    editModel: function(model) {
      var view = new Directus.EditView({model: model});
      var modal = app.router.openModal(view, {stretch: true, title: 'Edit'});

      modal.save = function() {
        model.set(view.data());
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
      var modal;
      var collection = this.related.entries;

      console.log('new model', model);

      var view = new Directus.EditView({model: model});

      modal = app.router.openModal(view, {stretch: true, title: 'Add'});

      modal.save = function() {
        model.set(view.data());
        collection.add(model,{nest: true});
        this.close();
      };

      view.render();
    },

    serialize: function() {
      return {title: this.options.name, tableTitle: this.related.table.get('table_name')};
    },

    afterRender: function() {
      var view = new this.table(this.related.tableOptions);
      this.setView('.related-table', view).render();
      //view.render();
    },

    initialize: function (options) {
      this.related = {};
      this.related.table = app.tables.get(options.schema.get('table_related'));
      this.related.schema = app.columns[options.schema.get('table_related')];
      this.related.entries = options.value;
      this.related.tableOptions = {collection: this.related.entries, toolbar:false, selectable: false, sortable: false, footer: false, saveAfterDrop: false};
      this.table = Directus.Table.extend({});
    }

  });

  Module.list = function() {
    return 'x';
  };

  return Module;
});