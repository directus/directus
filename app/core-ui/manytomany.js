//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core-ui/onetomany', 'core/directus'], function(app, Backbone, Onetomany, Directus) {

  var Module = {};

  Module.id = 'manytomany';
  Module.dataTypes = ['MANYTOMANY'];

  Module.variables = [
    {id: 'visible_columns', ui: 'textinput', char_length: 255}
  ];

  Module.Input = Onetomany.Input.extend({

    template: Handlebars.compile(
      '<label>{{{capitalize title}}}</label>' +
      '<div class="related-table"></div>' +
      '<div class="btn-row"><button class="btn btn-small btn-primary" data-action="add" type="button">Add New {{{capitalize tableTitle}}} Item</button>' +
      '<button class="btn btn-small btn-primary" data-action="insert" type="button">Choose Existing {{{capitalize tableTitle}}} Item</button></div>'),

		addRow: function() {
      this.addModel(new this.related.entries.nestedCollection.model({}, {collection: this.related.entries.nestedCollection, parse: true}));
    },

    insertRow: function() {
      var collection = app.entries[this.related.table.id];
      var view = new Directus.Table({collection: collection, selectable: true, footer: false});
      var modal = app.router.openModal(view, {stretch: true, title: 'Edit'});

      //please proxy this instead
      var me = this;

      modal.save = function() {
        _.each(view.selection(), function(id) {
          var data = collection.get(id).toJSON();
          me.collection.add(data, {parse: true, silent: true, nest: true});
        }, this);
        me.collection.trigger('add');
        modal.close();
      };

      collection.fetch();
    },

  });

  Module.list = function() {
  	return 'x';
  }

  return Module;
});