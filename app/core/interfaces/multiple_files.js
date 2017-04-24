//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'app',
  'underscore',
  'backbone',
  'helpers/file',
  'handlebars',
  'sortable',
  'mixins/status',
  'mixins/save-item',
  'core/UIComponent',
  'core/UIView',
  'core/overlays/overlays',
  'core/t'
], function(app, _, Backbone, FileHelper, Handlebars, Sortable, StatusMixin, SaveItemMixin, UIComponent, UIView, Overlays, __t) {

  'use strict';

  var Input = UIView.extend({
    template: 'multiple_files',

    events: {
      'click .js-button': 'onClickButton',
      'click .js-remove': 'removeItem',
      'click .js-image': 'editItem'
    },

    onClickButton: function (event) {
      var action = $(event.currentTarget).data('action');

      event.preventDefault();

      switch (action) {
        case 'choose':
          this.chooseItem();
          break;
        case 'add':
          this.addItem();
          break;
      }
    },

    addItem: function() {
      if (this.showAddButton && this.canEdit) {
        this.addModel(new this.relatedCollection.nestedCollection.model({}, {
          collection: this.relatedCollection.nestedCollection,
          parse: true
        }));
      }
    },

    removeItem: function (event) {
      var cid = $(event.target).closest('.js-file').data('cid');
      var model = this.relatedCollection.get(cid);
      var name = {};

      event.stopPropagation();

      if (model.isNew()) {
        this.relatedCollection.remove(model);
      } else {
        name[model.table.getStatusColumnName()] = model.getTableStatuses().getDeleteValue();
        model.set(name);
      }
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

    chooseItem: function() {
      var collection = app.files;
      var view = new Overlays.ListSelect({collection: collection});
      var me = this;

      app.router.overlayPage(view);

      view.save = function() {
        _.each(view.table.selection(), function(id) {
          var data = _.clone(collection.get(id).attributes);
          me.relatedCollection.add(data, {parse: true, silent: true, nest: true});
        }, this);

        me.relatedCollection.trigger('add');
        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    editItem: function (event) {
      var cid = $(event.currentTarget).data('cid');
      var model = this.relatedCollection.get(cid, true);

      if (!this.canEdit) {
        return;
      }

      this.editModel(model);
    },

    editModel: function(model) {
      var EditView = require("modules/tables/views/EditView");
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var view = new EditView({
        model: model,
        hiddenFields: [columnName],
        skipFetch: (model.isNew() || model.unsavedAttributes())
      });

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
        model.set(model.diff(view.editView.data()));
        app.router.removeOverlayPage(this);
      };

      // Fetch first time to get the nested tables
      // Only fetch if it's not a new entry
      if(!model.isNew() && !model.unsavedAttributes()) {
        model.fetch();
      }
    },

    drop: function() {
      var relatedCollection = this.model.get(this.name);

      this.$('.js-file').each(function (i) {
        relatedCollection.get($(this).data('cid')).set({sort: i}, {silent: true});
      });

      relatedCollection.setOrder('sort', 'ASC', {silent: true});
    },

    serialize: function() {
      var models = this.relatedCollection.models;
      var rows = [];
      var that = this;

      _.each(models, function (model) {
        if (!model.isDeleted()) {
          var cid = model.cid;
          var url, data;

          model = new app.files.model(model.get('data').attributes, {
            collection: that.relatedCollection
          });

          url = model.getThumbnailUrl();
          data = model.toJSON();
          data.size = model.isEmbed() ? app.seconds_convert(data.size) : FileHelper.humanReadableSize(data.size);
          data.thumbnailUrl = url;
          data.type = FileHelper.friendlySubtype(data.type);
          data.cid = cid;
          data.id = model.id;

          rows.push(data);
        }
      });

      var relatedCollection = this.model.get(this.name);
      var junctionStructure = relatedCollection.junctionStructure;
      var sortable = (junctionStructure.get('sort') !== undefined);

      return {
        rows: rows,
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton && this.canEdit,
        showAddButton: this.showAddButton && this.canEdit,
        showRemoveButton: this.showRemoveButton && this.canEdit,
        sortable: sortable
      };
    },

    afterRender: function() {
      var $dropzone = this.$el;
      var self = this;
      var relatedCollection = this.model.get(this.name);
      var junctionStructure = relatedCollection.junctionStructure;

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      $dropzone[0].ondrop = function(e) {
        e.stopPropagation();
        e.preventDefault();

        if(self.sort && self.sort.isDragging) {
          self.sort.isDragging = false;
          return;
        }
        var FilesModel = require('modules/files/FilesModel');
        _.each(e.dataTransfer.files, function(file) {
          // force a fileModel object
          var fileModel = new FilesModel({}, {collection:{}});
          fileModel.setFile(file, null, function (item) {
            // Unset the model ID so that a new file record is created
            // (and the old file record isn't replaced w/ this data)
            item.id = undefined;
            item.user = self.userId;
            var model = new self.relatedCollection.nestedCollection.model(item, {
              collection: self.relatedCollection.nestedCollection,
              parse: true
            });
            // TODO: extend from a Directus Base Model
            // with status mixins
            model = new Backbone.Model({data: model}, {
              collection: self.relatedCollection
            });

            model.table = self.relatedCollection.table;
            model.getTable = function () {
              return this.table;
            };

            _.extend(model, StatusMixin.Model);
            _.extend(model, SaveItemMixin);

            self.relatedCollection.add(model);
          });
        });
      };

      if (junctionStructure.get('sort') !== undefined) {
        // Drag and drop reordering
        var container = this.$el.find('.attachments').get(0);
        var that = this;
        this.sort = new Sortable(container, {
          animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
          draggable: '.js-file', // Specifies which items inside the element should be sortable
          ghostClass: 'sortable-file-ghost',
          onStart: function (evt) {
            //var dragItem = jQuery(evt.item);
            var jContainer = jQuery(container);
            jContainer.addClass('remove-hover-state');
          },
          onEnd: function (evt) {
            //var dragItem = jQuery(evt.item);
            var jContainer = jQuery(container);
            jContainer.removeClass('remove-hover-state');
          },
          onUpdate: function (evt){
            that.drop();
          }
        });
      }

      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    },

    initialize: function(options) {
      if (!this.columnSchema.relationship ||
           'MANYTOMANY' !== this.columnSchema.relationship.get('type')) {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'MANYTOMANY',
          ui: Component.id
        });
      }

      var relatedCollection = this.model.get(this.name);
      var relatedSchema = relatedCollection.structure;
      var junctionStructure = relatedCollection.junctionStructure;
      var sortable = false;

      relatedCollection.each(function(model) {
        return model.startTracking();
      });

      if(junctionStructure.get('sort') !== undefined) {
        sortable = true;
        relatedCollection.setOrder('sort','ASC');
      }

      this.canEdit = !(options.inModal || false);
      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.sortable = sortable;

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', function() {
        this.render();
      }, this);

      this.listenTo(relatedCollection.nestedCollection, 'sync', function() {
      }, this);
    }
  });

  var Component = UIComponent.extend({
    id: 'multiple_files',
    dataTypes: ['MANYTOMANY'],
    variables: [
      // Toggles an "Add" button for adding new files directly into the UI
      {id: 'add_button', type: 'Boolean', default_value: true, ui: 'checkbox'},
      // Toggles a "Choose" button that opens a modal with all existing Directus files to choose from
      {id: 'choose_button', type: 'Boolean', default_value: true, ui: 'checkbox'},
      // Toggles "Remove" buttons for each file that let's you delete the file
      {id: 'remove_button', type: 'Boolean', default_value: true, ui: 'checkbox'},
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && value.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function() {
      return 'x';
    }
  });

  return Component;
});
