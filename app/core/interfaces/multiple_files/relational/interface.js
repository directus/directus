/* global $ Backbone jQuery _ Component */
define([
  'core/UIView',
  'underscore',
  'app',
  'core/overlays/overlays',
  'helpers/file',
  'mixins/status',
  'mixins/save-item',
  'sortable',
  'core/t'
], function (UIView, _, app, Overlays, FileHelper, StatusMixin, SaveItemMixin, Sortable, __t) {
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
        default:
          break;
      }
    },

    addItem: function () {
      if (this.showAddButton && this.canEdit) {
        this.addModel(new this.relatedCollection.nestedCollection.model({}, { // eslint-disable-line new-cap
          collection: this.relatedCollection.nestedCollection,
          parse: true
        }));
      }
    },

    removeItem: function (event) {
      var cid = $(event.target).closest('.js-file').data('cid');
      var model = this.relatedCollection.get(cid);
      var attributes = {};

      event.stopPropagation();

      if (model.isNew()) {
        this.relatedCollection.remove(model);
      } else {
        // FIXME: Make a method to encapsulate all this functionality
        // duplicated across all the relational interfaces
        var junctionTable = this.relatedCollection.junctionStructure.table;
        var statusColumnName = junctionTable.getStatusColumnName();
        var statusValue = model.getTableStatuses().getDeleteValue();

        // NOTE: if there's not status column in the table
        // we gotta use the default status column name and delete value
        // so we flag the record as "to be deleted"
        if (!statusColumnName) {
          statusColumnName = app.statusMapping.get('*').get('status_name');
          statusValue = app.statusMapping.get('*').get('delete_value');
        }

        attributes[statusColumnName] = statusValue;
        model.set(attributes);
      }
    },

    addModel: function (model) {
      var OverlayEditView = require('modules/tables/views/OverlayEditView'); // eslint-disable-line import/no-unresolved
      var collection = this.relatedCollection;

      var view = new OverlayEditView({
        model: model,
        inModal: true,
        onSave: function () {
          var junctionModel = new collection.model({data: model}); // eslint-disable-line new-cap

          _.extend(junctionModel, {
            collection: collection,
            structure: collection.structure,
            table: collection.table
          });

          collection.add(junctionModel);
          app.router.removeOverlayPage(this);
        }
      });

      app.router.overlayPage(view);
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
      var OverlayEditView = require('modules/tables/views/OverlayEditView'); // eslint-disable-line import/no-unresolved
      var columnName = this.columnSchema.relationship.get('junction_key_right');

      var view = new OverlayEditView({
        model: model,
        hiddenFields: [columnName],
        skipFetch: (model.isNew() || model.unsavedAttributes()),
        onSave: function () {
          app.router.removeOverlayPage(this);
        }
      });

      app.router.overlayPage(view);

      // Fetch first time to get the nested tables
      // Only fetch if it's not a new entry
      if (!model.isNew() && !model.unsavedAttributes()) {
        model.fetch();
      }
    },

    drop: function () {
      var relatedCollection = this.model.get(this.name);
      var table = relatedCollection.junctionStructure.table;
      var sortColumnName = table.getSortColumnName();

      // just in case
      if (!sortColumnName) {
        return;
      }

      this.$('.js-file').each(function (i) {
        var cid = $(this).data('cid');
        var attrs = {};

        attrs[sortColumnName] = i;

        relatedCollection.get(cid).set(attrs, {silent: true});
      });

      relatedCollection.sort();

      this.model.set(this.name, relatedCollection);
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

          model = new app.files.model(model.get('data').attributes, { // eslint-disable-line new-cap
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
      var sortable = junctionStructure.table.hasSortColumn();

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
        var FilesModel = require('modules/files/FilesModel'); // eslint-disable-line import/no-unresolved
        _.each(e.dataTransfer.files, function (file) {
          // Force a fileModel object
          var fileModel = new FilesModel({}, {collection: {}});
          fileModel.setFile(file, null, function (item) {
            // Unset the model ID so that a new file record is created
            // (and the old file record isn't replaced w/ this data)
            item.id = undefined;
            item.user = self.userId;
            var model = new self.relatedCollection.nestedCollection.model(item, { // eslint-disable-line new-cap
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
          onStart: function () {
            // Var dragItem = jQuery(evt.item);
            var jContainer = jQuery(container);
            jContainer.addClass('remove-hover-state');
          },
          onEnd: function () {
            // Var dragItem = jQuery(evt.item);
            var jContainer = jQuery(container);
            jContainer.removeClass('remove-hover-state');
          },
          onUpdate: function () {
            that.drop();
          }
        });
      }

      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    },

    onCollectionChange: function () {
      var value = this.model.get(this.name);

      // NOTE: setting the value again to mark the changes
      this.model.set(this.name, value);
      this.render();
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
      var junctionStructure = relatedCollection.junctionStructure;
      var table = junctionStructure.table;
      var sortable = false;

      relatedCollection.each(function (model) {
        return model.startTracking();
      });

      if (table.hasSortColumn()) {
        sortable = true;
        relatedCollection.setOrder(table.getSortColumnName(), 'ASC');
      }

      this.canEdit = !(options.inModal || false);
      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.sortable = sortable;

      this.relatedCollection = relatedCollection;
      this.listenTo(relatedCollection, 'change add remove', this.onCollectionChange);
    }
  });
});
