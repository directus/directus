define([
  'app',
  'backbone',
  'core/entries/EntriesModel',
  'core/notification',
  'core/t',
  'helpers/file'
],

function(app, Backbone, EntriesModel, Notification, __t, File) {
  var FilesModel = EntriesModel.extend({

    initialize: function() {
      EntriesModel.prototype.initialize.apply(this, arguments);
    },

    makeFileUrl: function(thumbnail) {
      var url;

      if (thumbnail) {
        url = this.get('thumbnail_url');
      } else {
        url = this.get('url');
      }

      return url;
    },

    toJSON: function() {
      var atts = FilesModel.__super__.toJSON.call(this);
      if (!atts) {
        atts = _.clone(this.attributes);
      }

      return _.omit(atts, 'thumbnailData', 'url', 'file_url', 'file_thumb_url', 'thumbnail_url', 'html');
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

      if (app.settings.isMaxFileSizeExceeded(file)) {
        Notification.error(__t('max_file_size_exceeded_x_x', {
          size: app.settings.getMaxFileSize(),
          unit: app.settings.getMaxFileSizeUnit()
        }));

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
