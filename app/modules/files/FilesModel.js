define([
  'app',
  'underscore',
  'backbone',
  'core/entries/EntriesModel',
  'core/notification',
  'core/t',
  'utils',
  'helpers/file'
],

function(app, _, Backbone, EntriesModel, Notification, __t, Utils, File) {
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

      // TODO: avoid omitting url and html at some point
      // rewrite this so we omit these values when we really want it to be omitted.
      return _.omit(atts, 'thumbnailData', 'url', 'file_url', 'file_thumb_url', 'thumbnail_url', 'html');
    },

    formatTitle: function(name) {
      var extension = name.split('.').pop().toLowerCase();
      var name = name.slice(0, name.indexOf('.' + extension));
      name = name.replace(/[_-]/g, ' ');
      return name;
    },

    setFile: function(file, allowedMimeTypes, fn) {
      if (!this.isMimeTypeAllowed(file.type, allowedMimeTypes)) {
        return false;
      }

      if (app.settings.isMaxFileSizeExceeded(file)) {
        Notification.error(__t('max_file_size_exceeded_x_x', {
          size: app.settings.getMaxFileSize(),
          unit: app.settings.getMaxFileSizeUnit()
        }));

        return false;
      }

      var model = this;
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
    setData: function(item, allowedMimeTypes) {
      var model = this;

      if (!this.isMimeTypeAllowed(item.type, allowedMimeTypes)) {
        return false;
      }

      File.resizeFromData(item.data, 200, 200, function(thumbnailData) {
        item.thumbnailData = thumbnailData;
        model.set(item);
        model.trigger('sync');
      });
    },

    setLink: function(url, allowedMimeTypes) {
      var model = this;
      app.sendLink(url, function(data) {
        var item = data[0];
        item[app.statusMapping.status_name] = app.statusMapping.active_num;
        // Unset the model ID so that a new file record is created
        // (and the old file record isn't replaced w/ this data)
        item.id = undefined;
        item.user = model.userId;

        model.setData(item, allowedMimeTypes);
      });
    },

    isFileAllowed: function(allowedMimeTypes) {
      return this.isMimeTypeAllowed(this.get('type'), allowedMimeTypes);
    },

    isMimeTypeAllowed: function(fileType, allowedMimeTypes) {
      // if there's not fileType but allowedMimeTypes provided
      // by default the file is not allowed
      var allowed = (!fileType && allowedMimeTypes) ? false : true;

      if (fileType && allowedMimeTypes) {
        var self = this;
        allowed = allowedMimeTypes.split(',').some(function (allowedType) {
          return self.isMimeType(fileType, allowedType);
        });
      }

      // this should not be here
      // but, we will let it slide for now.
      if (!allowed) {
        app.router.openModal({type: 'alert', text: 'This type of file is not allowed'});
      }

      return allowed;
    },

    isMimeType: function(mimeType, allowedMimeType) {
      mimeType = mimeType || this.type;
      if (!_.isString(mimeType)) {
        return false;
      }

      if (allowedMimeType.endsWith('/*')) {
        return allowedMimeType.split('/')[0] === mimeType.split('/')[0];
      }

      return allowedMimeType === mimeType;
    },

    constructor: function FilesModel(data, options) {
      FilesModel.__super__.constructor.call(this, data, options);
    }

  });

  return FilesModel;

});
