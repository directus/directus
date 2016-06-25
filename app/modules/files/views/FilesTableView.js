define([
  'app',
  'backbone',
  'core/modal',
  'core/edit',
  'core/t',
  'core/BasePageView',
  'core/table/table.view',
  'core/widgets/widgets',
  'modules/files/views/EditFilesView',
  'modules/files/views/FilesCardView'
],

function(app, Backbone, DirectusModal, DirectusEdit, __t, BasePageView, DirectusTable, Widgets, EditFilesView, FilesCardView) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('files')
      }
    },
    leftToolbar: function() {
      return [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "add", buttonClass: "", buttonText: __t('new_file')}})
      ];
    },
    rightToolbar: function() {
      return [
        new Widgets.PaginatorWidget({collection: this.collection})
        //new Widgets.SearchWidget(),
        //new Widgets.ButtonWidget({widgetOptions: {active: this.viewList, buttonId: "listBtn", iconClass: "icon-list"}}),
        //new Widgets.ButtonWidget({widgetOptions: {active: !this.viewList, buttonId: "gridBtn", iconClass: "icon-layout"}})
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
      'click #addBtn': function() {
        app.router.go('#files','new');
      },
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
      this.setView('#page-content', this.table);
      this.collection.fetch();
      if (window.File && window.FileList && window.FileReader) {
        //this.initFileDrop();
      }

      var that = this;

      this.dragoverListener = function(e) {
        that.$el.find('.external-drop-indicator').show();;
      }

      window.addEventListener('dragover', this.dragoverListener, false);

      this.dragleaveListener = function() {
        that.$el.find('.external-drop-indicator').hide();;
      }

      window.addEventListener('dragleave', this.dragleaveListener, false);

      this.dropListener = function(e) {
        that.$el.find('.external-drop-indicator').fadeOut(500);
        console.log('drop');
        that.processDroppedImages(e)
      };

      window.addEventListener('drop', this.dropListener, false);
    },
    remove: function() {
      window.removeEventListener('drop', this.dropListener, false);
      window.removeEventListener('dragleave', this.dragleaveListener, false);
      window.removeEventListener('dragover', this.dragoverListener, false);

      $(document).off('ajaxStart.directus');
      $(document).on('ajaxStart.directus', function() {
        app.trigger('progress');
      });
    },
    processDroppedImages: function(e) {
      if(!this.uploadFiles) {
        this.uploadFiles = [];
      }

      var that = this;
      _.each(e.dataTransfer.files, function(file) {
      var name = app.statusMapping.status_name;
        var name = {title: file.name, size: file.size, type: file.type};
        name[app.statusMapping.status_name] = app.statusMapping.active_num;
        // All files should be sort by date
        // Setting a temporary date will make this uploading file first on the list.
        name['date_uploaded'] = moment().utc().format('YYYY-MM-DD YYYY, hh:mm:ss') + ' UTC';
        var  model = new that.collection.model(name, {collection: that.collection, parse: true});
        that.collection.add(model);
        that.uploadFiles.push({model: model, fileInfo: file});
      });
      this.collection.trigger('sync');
      if(! this.uploadInProgress) {
        this.uploadInProgress = true;
        this.uploadNextImage();
      }
    },
    uploadNextImage: function() {
      if(this.uploadFiles.length <= 0) {
        this.uploadInProgress = false;
        return;
      }

      var that = this;
      var fileInfo = this.uploadFiles[0];

      $(document).off('ajaxStart.directus');

      app.sendFiles([fileInfo.fileInfo], function(data) {
        if(typeof(data[0]) == 'object') {
          fileInfo.model.save(data[0], {
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
            includeRelationships: true
          });
          that.collection.trigger('sync');
          that.uploadFiles.shift();
          that.uploadNextImage();
        } else {
          $(document).on('ajaxStart.directus', function() {
            app.trigger('progress');
          });
          that.collection.remove(fileInfo.model);
          that.collection.trigger('sync');
          that.uploadFiles.shift();
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
