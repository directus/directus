//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core-ui/one_to_many', 'core/directus'], function(app, Backbone, Onetomany, Directus) {

  var Module = {};

  Module.id = 'many_to_many';
  Module.dataTypes = ['MANYTOMANY'];

  Module.variables = [
    {id: 'visible_columns', ui: 'textinput', char_length: 255, required: true}
  ];

  Module.Input = Onetomany.Input.extend({

    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click button[data-action=add]': 'addRow',
      'click button[data-action=insert]': 'insertRow',
      'click td.delete': 'deleteRow'
    },

    template: Handlebars.compile(
      '<label>{{{capitalize title}}}</label>' +
      '<div class="related-table"></div>' +
      '<div class="btn-row"><button class="btn btn-small btn-primary" data-action="add" type="button">Add New {{{capitalize tableTitle}}} Item</button>' +
      '<button class="btn btn-small btn-primary" data-action="insert" type="button">Choose Existing {{{capitalize tableTitle}}} Item</button></div>'),

		addRow: function() {
      this.addModel(new this.related.entries.nestedCollection.model({}, {collection: this.related.entries.nestedCollection, parse: true}));
    },

    deleteRow: function(e) {
      var cid = $(e.target).closest('tr').attr('data-cid');
      var model = this.related.entries.get(cid);

      if (model.isNew()) return this.related.entries.remove(model);

      model.set({active: 0});
    },

    addModel: function(model) {
      var modal;
      var collection = this.related.entries;
      var view = new Directus.EditView({model: model});

      modal = app.router.openModal(view, {stretch: true, title: 'Add'});

      modal.save = function() {
        model.set(view.data());
        collection.add(model,{nest: true});
        this.close();
      };

      view.render();
    },

    insertRow: function() {
      var collection = app.entries[this.related.table.id];
      var view = new this.modalTable({collection: collection, selectable: true, footer: false});
      var modal = app.router.openModal(view, {stretch: true, title: 'Insert Item'});

      //please proxy this instead
      var me = this;

      modal.save = function() {
        _.each(view.selection(), function(id) {
          var data = collection.get(id).toJSON();
          me.related.entries.add(data, {parse: true, silent: true, nest: true});
        }, this);
        me.related.entries.trigger('add');
        modal.close();
      };

      collection.fetch();
    },

    initialize: function(options) {
      Module.Input.__super__.initialize.call(this, options);
      this.junctionStructure = this.related.entries.junctionStructure;
      this.hasSort = this.junctionStructure.get('sort') !== undefined;
      this.related.tableOptions.deleteColumn = true;
      this.related.tableOptions.saveAfterDrop = false;
      this.related.tableOptions.sort = this.hasSort;


      this.view = new this.table(this.related.tableOptions);
      this.modalTable = Directus.Table.extend({
        events: {
          'click tbody td': function(e) {
            $target = $(e.target);
            if ($target.is("input")) return;
            var $checkbox = $target.closest('tr').find('td.check > input');
            $checkbox.attr('checked', $checkbox.attr('checked') === undefined);
          }
        }
      });
    }

  });

  Module.list = function() {
    return 'x';
  };

  return Module;
});