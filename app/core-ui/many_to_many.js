//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core-ui/one_to_many', 'core/table/table.view'], function(app, Backbone, Onetomany, TableView) {

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
      '<div class="btn-row">{{#if showAddButton}}<button class="btn btn-small btn-primary" data-action="add" type="button">Add New {{{capitalize tableTitle}}} Item</button>{{/if}}' +
      '{{#if showChooseButton}}<button class="btn btn-small btn-primary" data-action="insert" type="button">Choose Existing {{{capitalize tableTitle}}} Item</button>{{/if}}</div>'),

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
      var EditView = require("core/edit");
      var modal;
      var collection = this.relatedCollection;
      var view = new EditView({model: model, inModal: true});

      modal = app.router.openModal(view, {stretch: true, title: 'Add'});

      modal.save = function() {
        model.set(view.data());
        collection.add(model,{nest: true});
        this.close();
      };

      view.render();
    },

    insertRow: function() {
      var highLightIds = this.relatedCollection.map(function(model) {
        return model.get('data').id;
        //pluck('id');
      });
      var collection = app.getEntries(this.relatedCollection.table.id);
      var view = new this.modalTable({collection: collection, selectable: true, footer: false, highlight: highLightIds});
      var modal = app.router.openModal(view, {stretch: true, title: 'Insert Item'});

      //please proxy this instead
      var me = this;

      modal.save = function() {
        _.each(view.selection(), function(id) {
          var data = collection.get(id).toJSON();
          me.relatedCollection.add(data, {parse: true, silent: true, nest: true});
        }, this);
        me.relatedCollection.trigger('add');
        modal.close();
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

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        toolbar: false,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: false,
        deleteColumn: /*this.canEdit &&*/ this.showRemoveButton,
        hideEmptyMessage: true,
        hasSort: junctionStructure.get('sort') !== undefined
      });

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', this.nestedTableView.render, this);

      this.modalTable = TableView.extend({
        events: {
          'click tbody td': function(e) {
            var $target = $(e.target);
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