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
  'core/UIView',
  'core/overlays/overlays'
],
function(app, _, Backbone, FileHelper, UIView, Overlays) {

  'use strict';

  var EntriesManager = require('core/EntriesManager');

  return UIView.extend({
    template: 'multiple_files/simple',

    events: {
      'click .js-new': 'addItem',
      'click .js-add': 'chooseItem',
      'click .remove-slideshow-item': 'removeItem',
      'click .media-slideshow-item > img': function(event) {
        if (!this.canEdit) {
          return;
        }
        var cid = $(event.target).attr('data-file-cid');
        var model = this.relatedCollection.get(cid, true);
        this.editModel(model);
      }
    },

    addItem: function() {
      if (this.showAddButton && this.canEdit) {
        this.addModel(new this.relatedCollection.model({}, {
          collection: this.relatedCollection,
          parse: true
        }));
      }
    },

    removeItem: function(event) {
      var target_cid = $(event.target).closest('.media-slideshow-item').find('img').attr('data-file-cid');
      var model = this.relatedCollection.get(target_cid);

      this.relatedCollection.remove(model);
    },

    addModel: function(model) {
      var EditView = require("modules/tables/views/EditView");
      var collection = this.relatedCollection;
      var view = new EditView({
        model: model,
        inModal: true,
        onSuccess: function(model) {
          if (model.isValid()) {
            collection.add(model);
          }
        }
      });
      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function(event) {
          this.save(event);
        },
        'click #removeOverlay': function() {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      var originalSave = view.save;
      view.save = function() {
        originalSave.apply(this, arguments);
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
          me.relatedCollection.add(data, {silent: true});
        }, this);
        me.relatedCollection.trigger('add');
        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    editModel: function(model) {
      var EditView = require("modules/tables/views/EditView");
      var view = new EditView({model: model});

      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events = {
        'click .saved-success': function(event) {
          this.save(event);
        },
        'click #removeOverlay': function() {
          app.router.removeOverlayPage(this);
        }
      };

      app.router.overlayPage(view);

      var originalSave = view.save;
      view.save = function() {
        originalSave.apply(this, arguments);
        app.router.removeOverlayPage(this);
      };

      // Fetch first time to get the nested tables
      // Only fetch if it's not a new entry
      if(!model.isNew()) {
        model.fetch();
      }
    },

    drop: function() {
      var relatedCollection = this.model.get(this.name);

      this.$('.media-slideshow-item img').each(function(i) {
        relatedCollection.get($(this).attr('data-file-cid')).set({sort: i},{silent: true});
      });

      // There is no "saveAfterDrop" now, but we could use this for instant saving
      // if (this.options.saveAfterDrop) {
      //   relatedCollection.save({columns:['id','sort']});
      // }

      relatedCollection.setOrder('sort','ASC',{silent: true});
    },

    serialize: function() {
      var models = this.relatedCollection.models;
      var rows = [];
      var self = this;

      _.each(models, function(model) {
        if(model.get(app.statusMapping.status_name) !== app.statusMapping.deleted_num) {
          var cid = model.cid;
          var url, data = model.toJSON(true);

          model = new app.files.model(model.attributes, {collection: self.relatedCollection});
          if (model.isNew()) {
            url = model.get('thumbnailData') || model.get('url');
          } else {
            url = model.makeFileUrl(true)
          }

          data.url = url;
          data.cid = cid;

          rows.push(data);
        }
      });

      return {
        rows: rows,
        name: this.name,
        value: this.value,
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton && this.canEdit,
        showAddButton: this.showAddButton && this.canEdit,
        showRemoveButton: this.showRemoveButton && this.canEdit,
        sortable: false
      };
    },

    afterRender: function() {
      var $dropzone = this.$el;
      var self = this;

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      $dropzone[0].ondrop = function(event) {
        event.stopPropagation();
        event.preventDefault();

        self.uploadFiles(event.dataTransfer.files);
      };

      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    },

    uploadFiles: function(files) {
      _.each(files, function(file) {
        this.uploadOneFile(file);
      }, this);
    },

    uploadOneFile: function(file) {
      var self = this;
      app.sendFiles([file], function(data) {
        if (data && typeof(data[0]) === 'object') {
          var fileModel = new self.relatedCollection.model({}, {
            collection: self.relatedCollection,
            parse: true
          });

          fileModel.setFile(file, function(item) {
            fileModel.save(item, {
              success: function() {
                $(document).on('ajaxStart.directus', function() {
                  app.trigger('progress');
                });

                self.relatedCollection.add(fileModel);
              },
              error: function() {
                $(document).on('ajaxStart.directus', function() {
                  app.trigger('progress');
                });
              },
              wait: true
            });
          });
        }
      });
    },

    initialize: function(options) {
      this.value = this.model.get(this.name);
      this.canEdit = !(options.inModal || false);
      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;
      this.relatedTable = 'directus_files';
      this.relatedCollection = EntriesManager.getNewInstance(this.relatedTable);
      var csv = this.model.get(this.name);
      // NOTE: This will a collection method in the next version
      var hasUnsavedModels = _.some(this.relatedCollection.models, function(model) {
        return model.unsavedAttributes();
      });

      if (_.isString(csv) && !_.isEmpty(csv) && !hasUnsavedModels) {
        // Remove the leading and trailing commas
        var ids = csv.replace(/^,+|,+$/g, '');
        this.relatedCollection.setFilter('ids', ids);
        this.relatedCollection.fetch({success: function(collection) {
          _.each(collection.models, function (model) {
            return model.startTracking();
          });
        }});
      }

      this.listenTo(this.relatedCollection, 'add remove', function() {
        this.$input = this.$el.find('input');
        if (this.$input) {
          var ids = this.relatedCollection.pluck('id').join(',');
          this.value = ',' + ids + ',';
          this.$input.val(this.value);
        }

        this.render();
      }, this);
    }
  });
});
