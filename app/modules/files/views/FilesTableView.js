define([
  'app',
  'underscore',
  'moment',
  'backbone',
  'core/Modal',
  'core/edit',
  'core/t',
  'core/notification',
  'core/BasePageView',
  'core/table/table.view',
  'core/widgets/widgets',
  'modules/files/views/EditFilesView',
  'modules/files/views/FilesCardView'
],

function(app, _, moment, Backbone, DirectusModal, DirectusEdit, __t, Notification, BasePageView, DirectusTable, Widgets, EditFilesView, FilesCardView) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('files')
      }
    },

    attributes: {
      class: 'page-container'
    },

    leftToolbar: function() {
      var canUploadFiles = app.user.canUploadFiles();
      return [
        new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'cloud_upload',
            buttonClass: canUploadFiles ? 'primary' : 'disabled',
            buttonText: __t('file_upload')
          },
          onClick: function(event) {
            if (canUploadFiles) {
              app.router.go('#files', 'new');
            }
          }
        }),
        new Widgets.InfoButtonWidget({enable: false}),
        new Widgets.FilterButtonWidget()
      ];
    },

    rightToolbar: function () {
      return [
        new Widgets.FilterWidget({
          collection: this.collection,
          basePage: this
        })
      ];
    },

    leftSecondaryToolbar: function() {
      if(!this.widgets.filterWidget) {
        this.widgets.filterWidget = new Widgets.FilterWidget({collection: this.collection, basePage: this});
      }

      if(!this.widgets.visibilityWidget) {
        this.widgets.visibilityWidget = new Widgets.VisibilityWidget({collection: this.collection, basePage: this});
      }

      return [this.widgets.visibilityWidget, this.widgets.filterWidget];
    },

    rightSecondaryToolbar: function() {
      return [
        new Widgets.PaginationCountWidget({collection: this.collection})
      ];
    },

    events: {
      'click #gridBtn': function() {
        if(this.viewList) {
          this.viewList = false;
          $('#listBtn').parent().removeClass('active');
          $('#gridBtn').parent().addClass('active');
          this.table = new FilesCardView({collection:this.collection});
          this.render();
        }
      },
      'click #listBtn': function() {
        if(!this.viewList) {
          this.viewList = true;
          $('#listBtn').parent().addClass('active');
          $('#gridBtn').parent().removeClass('active');
          this.table = new DirectusTable({collection:this.collection, selectable: true, droppable: true, deleteOnly: true, hideColumnPreferences: true, blacklist: ['storage_adapter']});
          this.render();
        }
      }
    },

    afterRender: function() {
      var self = this;
      var dropzone = document.getElementById('content');

      this.setView('#page-content', this.table);
      // Ignore the filters to avoid preferences visible columns
      this.collection.fetch({includeFilters: false});

      this.dragoverListener = function (event) {
        $(dropzone).addClass('dragover');
      };

      this.dragleaveListener = function (event) {
        if (event.target != dropzone) {
          return;
        }

        $(dropzone).removeClass('dragover');
      };

      this.dropListener = function (event) {
        $(dropzone).removeClass('dragover');
        self.processDroppedImages(event);
      };

      dropzone.addEventListener('dragenter', this.dragoverListener, false);
      dropzone.addEventListener('dragleave', this.dragleaveListener, false);
      dropzone.addEventListener('drop', this.dropListener, false);
    },

    remove: function () {
      var dropzone = document.getElementById('content');

      dropzone.removeEventListener('drop', this.dropListener, false);
      dropzone.removeEventListener('dragleave', this.dragleaveListener, false);
      dropzone.removeEventListener('dragenter', this.dragoverListener, false);

      $(document).off('ajaxStart.directus');
      $(document).on('ajaxStart.directus', function() {
        app.trigger('progress');
      });
    },

    processDroppedImages: function (event) {
      if (!this.uploadFiles) {
        this.uploadFiles = [];
      }

      var self = this;
      _.each(event.dataTransfer.files, function (file)  {
        var name = {
          title: file.name,
          size: file.size,
          type: file.type
        };

        var statusColumnName = self.collection.table.getStatusColumnName();
        // name[app.statusMapping.status_name] = app.statusMapping.active_num;
        name[statusColumnName] = self.collection.table.getStatusDefaultValue();

        // All files should be sort by date
        // Setting a temporary date will make this uploading file first on the list.
        name['date_uploaded'] = moment().format();
        var  model = new self.collection.model(name, {
          collection: self.collection,
          parse: true
        });
        self.collection.add(model);
        self.uploadFiles.push({model: model, fileInfo: file});
      });

      this.collection.trigger('sync');
      if (! this.uploadInProgress) {
        this.uploadInProgress = true;
        this.uploadNextImage();
      }
    },

    uploadNextImage: function() {
      if (this.uploadFiles.length <= 0) {
        this.uploadInProgress = false;

        return;
      }

      var that = this;
      var fileInfo = this.uploadFiles.shift();
      if (app.settings.isMaxFileSizeExceeded(fileInfo.fileInfo)) {
        this.uploadInProgress = false;
        Notification.error(__t('max_file_size_exceeded_x_x', {
          size: app.settings.getMaxFileSize(),
          unit: app.settings.getMaxFileSizeUnit()
        }));

        this.collection.remove(fileInfo.model);
        this.collection.trigger('sync');

        that.uploadNextImage();

        return false;
      }


      $(document).off('ajaxStart.directus');

      app.sendFiles([fileInfo.fileInfo], function(data) {
        if (data && typeof(data[0]) === 'object') {
          var attributes = data[0];
          attributes['type'] = fileInfo.fileInfo.type;
          fileInfo.model.save(attributes, {
            success: function() {
              that.collection.sort();
              $(document).on('ajaxStart.directus', function() {
                app.trigger('progress');
              });
            },
            error: function() {
              $(document).on('ajaxStart.directus', function() {
                app.trigger('progress');
              });

              that.collection.remove(fileInfo.model);
              that.collection.trigger('sync');
            },
            wait: true,
            patch: true,
            validate: false
          });
          that.collection.trigger('sync');
          that.uploadNextImage();
        } else {
          $(document).on('ajaxStart.directus', function() {
            app.trigger('progress');
          });
          that.collection.remove(fileInfo.model);
          that.collection.trigger('sync');
          that.uploadNextImage();
        }
      }, function(e) {
        $('li[data-cid=' + fileInfo.model.cid + ']').find('.files-card-progress').show();
        $('li[data-cid=' + fileInfo.model.cid + ']').find('.default-loading > .icon').removeClass('icon-three-dots');
        $('li[data-cid=' + fileInfo.model.cid + ']').find('.default-loading > .icon').addClass('icon-upload-cloud');
        $('li[data-cid=' + fileInfo.model.cid + ']').find('.files-card-progress').width(((e.loaded / e.total) * 100) + "%");
      });
    },

    initialize: function() {
      this.viewList = false;
      this.table = new FilesCardView({collection:this.collection});
      this.widgets = [];
    }
  });

});
