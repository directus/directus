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
    {id: 'visible_columns', ui: 'textinput', char_length: 255}
  ];

  Module.Input = Onetomany.Input.extend({

    events: {
      'click div.related-table > div td:not(.delete)': 'editRow',
      'click button[data-action=add]': 'addRow',
      'click button[data-action=insert]': 'insertRow',
      'click td.delete': 'deleteRow',
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

    insertRow: function() {
      var collection = app.entries[this.related.table.id];
      var view = new this.modalTable({collection: collection, selectable: true, footer: false});
      var modal = app.router.openModal(view, {stretch: true, title: 'Edit'});

      //please proxy this instead
      var me = this;

      modal.save = function() {
        _.each(view.selection(), function(id) {
          var data = collection.get(id).toJSON();
          me.related.entries.add(data, {parse: true, silent: true, nest: true});
          console.log(me.related.entries);
          return;
          console.log(me.related.entries.toJSON());
        }, this);
        me.related.entries.trigger('add');
        modal.close();
      };

      collection.fetch();
    },

    initialize: function(options) {
      Module.Input.__super__.initialize.call(this, options);
      this.related.tableOptions.deleteColumn = true;
      this.modalTable = Directus.Table.extend({
        events: {
          'click tbody td': function(e) {
            var $checkbox = $(e.target).closest('tr').find('td.check > input');
            $checkbox.attr('checked', $checkbox.attr('checked') === undefined);
          }
        }
      });
    }

  });

  Module.list = function() {
  	return 'x';
  }

  return Module;
});