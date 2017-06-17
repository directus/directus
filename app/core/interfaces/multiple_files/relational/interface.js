define([
  'underscore',
  'core/UIView',
  'app',
  'core/overlays/overlays',
  'helpers/file',
  'mixins/status',
  'mixins/save-item',
  'sortable'
], function (_, UIView, app, Overlays, FileHelper, StatusMixin, SaveItemMixin, Sortable) {

  return UIView.extend({
    template: 'multiple_files/relational/input',

    events: {
      'click .js-button': 'onClickButton',
      'click .js-remove': 'removeItem',
      'click .js-file': 'editItem'
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

    addItem: function () {
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
        name[this.relatedCollection.table.getStatusColumnName()] = model.getTableStatuses().getDeleteValue();
        model.set(name);
      }
    },

    addModel: function (model) {
      var EditView = require('modules/tables/views/EditView');
      var collection = this.relatedCollection;
      var view = new EditView({model: model, inModal: true});
      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function () {
          this.save();
        },
        'click #removeOverlay': function () {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function () {
        var junctionModel = new collection.model({data: model});

        _.extend(junctionModel, {
          collection: collection,
          structure: collection.structure,
          table: collection.table
        });

        collection.add(junctionModel);
        app.router.removeOverlayPage(this);
      };
    },

    chooseItem: function () {
      var collection = app.files;
      var view = new Overlays.ListSelect({collection: collection});
      var me = this;

      app.router.overlayPage(view);

      view.save = function () {
        _.each(view.table.selection(), function (id) {
          var data = _.clone(collection.get(id).attributes);
          me.relatedCollection.add(data, {parse: true, silent: false, nest: true});
        }, this);

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

    editModel: function (model) {
      var EditView = require('modules/tables/views/EditView');
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
        'click .saved-success': function () {
          this.save();
        },
        'click #removeOverlay': function () {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      view.save = function () {
        model.set(model.diff(view.editView.data()));
        app.router.removeOverlayPage(this);
      };

      // Fetch first time to get the nested tables
      // Only fetch if it's not a new entry
      if (!model.isNew() && !model.unsavedAttributes()) {
        model.fetch();
      }
    },

    drop: function () {
      var relatedCollection = this.model.get(this.name);

      this.$('.js-file').each(function (i) {
        relatedCollection.get($(this).data('cid')).set({sort: i}, {silent: true});
      });

      relatedCollection.setOrder('sort', 'ASC', {silent: true});
    },

    serialize: function () {
      var models = this.relatedCollection.models;
      var rows = [];
      var that = this;

      _.each(models, function (model) {
        if (!model.isDeleted()) {
          var cid = model.cid;
          var url;
          var data;

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

    afterRender: function () {
      var $dropzone = this.$el;
      var self = this;
      var relatedCollection = this.model.get(this.name);
      var junctionStructure = relatedCollection.junctionStructure;

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      $dropzone[0].ondrop = function (e) {
        e.stopPropagation();
        e.preventDefault();

        if (self.sort && self.sort.isDragging) {
          self.sort.isDragging = false;
          return;
        }
        var FilesModel = require('modules/files/FilesModel');
        _.each(e.dataTransfer.files, function (file) {
          // Force a fileModel object
          var fileModel = new FilesModel({}, {collection: {}});
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
          animation: 150, // Ms, animation speed moving items when sorting, `0` — without animation
          draggable: '.js-file', // Specifies which items inside the element should be sortable
          ghostClass: 'sortable-file-ghost',
          onStart: function (evt) {
            // Var dragItem = jQuery(evt.item);
            var jContainer = jQuery(container);
            jContainer.addClass('remove-hover-state');
          },
          onEnd: function (evt) {
            // Var dragItem = jQuery(evt.item);
            var jContainer = jQuery(container);
            jContainer.removeClass('remove-hover-state');
          },
          onUpdate: function (evt) {
            that.drop();
          }
        });
      }

      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    },

    initialize: function (options) {
      if (!this.columnSchema.relationship ||
           this.columnSchema.relationship.get('type') !== 'MANYTOMANY') {
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

      relatedCollection.each(function (model) {
        return model.startTracking();
      });

      if (junctionStructure.get('sort') !== undefined) {
        sortable = true;
        relatedCollection.setOrder('sort', 'ASC');
      }

      this.canEdit = !(options.inModal || false);
      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.sortable = sortable;

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', function () {
        this.render();
      }, this);

      this.listenTo(relatedCollection.nestedCollection, 'sync', function () {
      }, this);
    }
  });
});
