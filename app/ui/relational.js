//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core/modal', 'core/edit', 'core/table', 'core/collection.entries'], function(app, Backbone, Modal, Edit, Table) {

  var Module = {};

  Module.id = 'relational';
  Module.dataTypes = ['ONETOMANY', 'MANYTOMANY'];

  Module.variables = [
    {id: 'happy', ui: 'textinput', char_length: 255},
    {id: 'hacking', ui: 'textinput', char_length: 255},
    {id: 'keyboard', ui: 'textinput', char_length: 255}
  ];

  //Loading the template externally is causing trouble. Why?
/*  var template =  '<div class="modal-container"></div>' +
                  '<label>{{{capitalize title}}}</label>' +
                  '{{#if data}}' +
                  '<table class="table table-striped">' +
                  '<tbody>' +
                  '{{#data}}' +
                  '<tr data-id="{{id}}" data-junction-id="{{junctionId}}" data-cid="{{cid}}">' +
                  ' <td class="title" data-action="edit">{{data}}</td>' +
                  ' <td style="width:20px;" class="remove" data-action="remove"><span class="glyphicon-remove"></span></td>'+
                  '</tr>' +
                  '{{/data}}' +
                  '</tbody>' +
                  '</table>' +
                  '{{else}}' +
                  '<div class="no-items">No {{tableTitle}} items</div>' +
                  '{{/if}}' +
                  '<button class="btn btn-small" data-action="add">Add new</button>' +
                  '<button class="btn btn-small" data-action="insert">Insert {{tableTitle}} items</button>';*/

    var template = '<label>{{{capitalize title}}}</label>' +
                   '<div class="related-table"></div>' +
                   '<div class="btn-row"><button class="btn btn-small btn-primary" data-action="add" type="button">Add New {{{capitalize tableTitle}}} Item</button>' +
                   '{{#if manyToMany}}<button class="btn btn-small btn-primary" data-action="insert" type="button">Choose Existing {{{capitalize tableTitle}}} Item</button>{{/if}}</div>';


    // Input view
    Module.Input = Backbone.Layout.extend({

      template: Handlebars.compile(template),

      tagName: 'fieldset',

      events: {
        'click button[data-action=add]': 'addRow',
        'click div.related-table > div td': 'editRow',
        'click button[data-action=insert]': 'insertRow'
      },

      addRow: function(e) {
        var model;
        var modal;
        var collection = this.collection;

        if (collection.isNested) {
          model = new collection.nestedCollection.model({}, {collection: collection.nestedCollection, parse: true});
        } else {
          model = new collection.model({}, {collection: collection, parse: true});
        }

        console.log('new model', model);

        var view = new Edit({model: model});

        modal = app.router.openModal(view, {stretch: true, title: 'Add'});

        modal.save = function() {
          model.set(view.data());

          if (collection.isNested) {
            collection.add({data: model});
          } else {
            collection.add(model);
          }

          this.close();
        };

        view.render();

      },

      editRow: function(e) {
        var cid = $(e.target).closest('tr').attr('data-cid');
        var model = this.collection.get(cid);
        var view;
        var modal;

        if (this.collection.isNested) {
          model = model.get('data');
        }

        view = new Edit({model: model});

        modal = app.router.openModal(view, {stretch: true, title: 'Edit'});

        //please proxy this instead
        var me = this;

        modal.save = function() {
          view.save({}, function(send, response) {
            modal.close();
          });
        };

        view.render();
      },

      insertRow: function() {
        var collection = app.router.entries[this.collection.table.id];
        var view = new Table({collection: collection, selectable: true});
        var modal = app.router.openModal(view, {stretch: true, title: 'Edit'});

        //please proxy this instead
        var me = this;

        modal.save = function() {
          _.each(view.selection(), function(id) {
            var data = collection.get(id).toJSON();
            me.collection.add({data: data}, {parse: true, silent: true});
          }, this);
          me.collection.trigger('add');
          modal.close();
        };

        collection.fetch();
      },

      serialize: function() {
        return {title: this.options.name, manyToMany: this.manyToMany, tableTitle: this.options.schema.get('table_related')};
      },

      afterRender: function() {
        var view;
        var options = {collection: this.collection, toolbar:false, selectable: false, sortable: false};

        view = new Table(options);

        this.setView('.related-table', view).render();

        view.render();
      },

      initialize: function() {
        this.collection = this.options.value;
        this.manyToMany = (this.options.schema.get('type') === 'MANYTOMANY');
        this.oneToMany = (this.options.schema.get('type') === 'ONETOMANY');
      }

    });

    // List view
    Module.list = function() {
      return 'x';
    };

    return Module;

});