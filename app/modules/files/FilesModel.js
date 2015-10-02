define([
  'app',
  'backbone',
  'core/entries/EntriesModel',
  'helpers/file'
],

function(app, Backbone, EntriesModel, File) {
  var FilesModel = EntriesModel.extend({

    initialize: function() {
      EntriesModel.prototype.initialize.apply(this, arguments);
    },

    makeFileUrl: function(thumbnail) {
      var storageAdapters = app.storageAdapters;
      var adapterId = this.get('storage_adapter');
      var storageAdapter;
      var url;

      if (!storageAdapters.hasOwnProperty(adapterId)) {
        throw new Error("Files record's storage_adapter FK value maps to an undefined directus_storage_adapters record: " + adapterId);
      }

      storageAdapter = storageAdapters[adapterId];

      if (thumbnail) {
        if(this.get('name')) {
          if($.inArray(this.get('name').split('.').pop(),['tif', 'tiff', 'psd', 'pdf']) > -1) {
            url = storageAdapter.root_thumb_url + '/' + this.get('id') + ".jpg";
          } else {
            url = storageAdapter.root_thumb_url + '/' + this.get('id') + "." + this.get('name').split('.').pop();
          }
        }
      } else {
        url = storageAdapter.root_url + '/' + this.get('name');
      }

      return url;
    },

    toJSON: function() {
      var atts = FilesModel.__super__.toJSON.call(this);
      if (!atts) {
        atts = _.clone(this.attributes);
      }

      return _.omit(atts, 'thumbnailData', 'file_url', 'file_thumb_url');
    },

    formatTitle: function(name) {
      var extension = name.split('.').pop().toLowerCase();
      var name = name.slice(0, name.indexOf('.' + extension));
      name = name.replace(/[_-]/g, ' ');
      return name;
    },

    setFile: function(file, fn) {
      var model = this;

      if (!app.settings.isFileAllowed(file)) {
        return false;
      }

      File.getDataFromInput(file, function(fileData, details, file) {
        File.isImage(fileData, function(isImage) {
          var modelData = {
            id: undefined,
            name: file.name,
            title: model.formatTitle(file.name),
            size: file.size,
            type: file.type,
            charset: 'binary',
            data: fileData
          };

          if (isImage) {
            File.resizeFromData(fileData, 200, 200, function(thumbnailData) {
              model.set(_.extend(modelData, {
                thumbnailData: thumbnailData,
                width: details.width,
                height: details.height
              }));
              if (_.isFunction(fn)) {
                fn(_.clone(model.attributes));
              }
              model.trigger('sync');
            });
          } else {
            model.set(_.extend(modelData, {
              url: fileData
            }));
            if (_.isFunction(fn)) {
              fn(_.clone(model.toJSON()));
            }
            model.trigger('sync');
          }
        });
      });
    },

    // setData will try to get thumbnail from a base64
    // this is used by retrieve links
    setData: function(item) {
      var model = this;

      if (!app.settings.isFileAllowed(item)) {
        return false;
      }

      File.resizeFromData(item.data, 200, 200, function(thumbnailData) {
        item.thumbnailData = thumbnailData;
        model.set(item);
        model.trigger('sync');
      });
    },

    setLink: function(url) {
      var model = this;
      app.sendLink(url, function(data) {
        var item = data[0];
        item[app.statusMapping.status_name] = app.statusMapping.active_num;
        // Unset the model ID so that a new file record is created
        // (and the old file record isn't replaced w/ this data)
        item.id = undefined;
        item.user = self.userId;

        model.setData(item);
      });
    },

    constructor: function FilesModel(data, options) {
      FilesModel.__super__.constructor.call(this, data, options);
    }

  });

  return FilesModel;

});