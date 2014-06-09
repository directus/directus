//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone', 'core/UIView', 'core/overlays/overlays'], function(app, Backbone, UIView, Overlays) {

  "use strict";

  var Module = {};

  Module.id = 'media_slideshow';
  Module.dataTypes = ['MANYTOMANY'];

  Module.variables = [
    {id: 'add_button', ui: 'checkbox'},
    {id: 'choose_button', ui: 'checkbox'},
    {id: 'remove_button', ui: 'checkbox'},
  ];

  Module.Input = UIView.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    events: {
      'click button[data-action=add]': 'addItem',
      'click button[data-action=insert]': 'insertItem',
      'click .remove_slideshow_item': 'removeItem'
    },

    template: Handlebars.compile(
      '{{#rows}}<span class="media_slideshow_item"><img data-media-cid="{{cid}}" data-media-id="{{id}}" src={{url}}>{{#if showRemoveButton}}<div class="remove_slideshow_item icon icon-cross"></div>{{/if}}</span>{{/rows}}' +
      '<div class="related-table"></div>' +
      '<div class="btn-row">{{#if showAddButton}}<button class="btn btn-primary margin-right-small" data-action="add" type="button">Add New Media Item</button>{{/if}}' +
      '{{#if showChooseButton}}<button class="btn btn-primary" data-action="insert" type="button">Choose Existing Media Item</button>{{/if}}</div>'),

    addItem: function() {
      this.addModel(new this.relatedCollection.nestedCollection.model({}, {collection: this.relatedCollection.nestedCollection, parse: true}));
    },

    removeItem: function(e) {
      var target_cid = $(e.target).parent().find('img').attr('data-media-cid');
      var model = this.relatedCollection.get(target_cid);

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

    insertItem: function() {
      var collection = app.media;
      var view = new Overlays.ListSelect({collection: collection});
      app.router.overlayPage(view);

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

    serialize: function() {
      var models = this.relatedCollection.models;
      var rows = [];
      var that = this;
      _.each(models, function(model) {
        if(model.get('active') != 0) {
          var cid = model.cid;
          model = new app.media.model(model.get('data').attributes, {collection: that.relatedCollection});
          rows.push({id: model.id, url: model.makeMediaUrl(true), cid:cid});
        }
      });

      return {
        rows: rows,
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton && this.canEdit,
        showAddButton: this.showAddButton && this.canEdit,
        showRemoveButton: this.showRemoveButton && this.canEdit
      };
    },

    initialize: function(options) {
      if (!this.columnSchema.relationship ||
           'MANYTOMANY' !== this.columnSchema.relationship.get('type')) {
        throw "The column " + this.columnSchema.id + " need to have a relationship of the type MANYTOMANY inorder to use the media_slideshow ui";
      }

      this.canEdit = !(options.inModal || false);
      this.showRemoveButton = this.columnSchema.options.get('remove_button') === "1";
      this.showChooseButton = this.columnSchema.options.get('choose_button') === "1";
      this.showAddButton = this.columnSchema.options.get('add_button') === "1";

      var relatedCollection = this.model.get(this.name);
      var relatedSchema = relatedCollection.structure;
      var junctionStructure = relatedCollection.junctionStructure;

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', function() {
        this.render();
      }, this);

      this.listenTo(relatedCollection.nestedCollection, 'sync', function() {
      }, this);
    }
  });

  Module.list = function() {
    return 'x';
  };

  return Module;
});