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

    toJSON: function(all) {
      var atts = FilesModel.__super__.toJSON.call(this);

      if (!atts) {
        atts = _.clone(this.attributes);
      }

      // TODO: avoid omitting url and html at some point
      // rewrite this so we omit these values when we really want it to be omitted.
      if (all !== true) {
        atts = _.omit(atts, 'thumbnailData', 'url', 'file_url', 'file_thumb_url', 'thumbnail_url', 'html');
      }

      return atts;
    },

    formatTitle: function(name) {
      if (name.indexOf('.') >= 0) {
        var extension = name.split('.').pop();
        name = name.slice(0, name.indexOf('.' + extension));
      }

      name = name.replace(/[_-]/g, ' ');

      return name;
    },

    setFile: function(file, allowedTypes, fn) {
      if (!this.isFileAllowed(file, allowedTypes)) {
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
    setData: function(item, allowedTypes) {
      var model = this;

      if (!this.isFileAllowed(item, allowedTypes)) {
        return false;
      }

      File.resizeFromData(item.data, 200, 200, function(thumbnailData) {
        item.thumbnailData = thumbnailData;
        model.set(item);
        model.trigger('sync');
      });
    },

    setLink: function(url, allowedTypes) {
      var model = this;
      app.sendLink(url, function(data) {
        var item = data[0];
        item[app.statusMapping.status_name] = app.statusMapping.active_num;
        // Unset the model ID so that a new file record is created
        // (and the old file record isn't replaced w/ this data)
        item.id = undefined;
        item.user = model.userId;

        model.setData(item, allowedTypes);
      });
    },

    isFileAllowed: function(file, allowedTypes) {
      var allowed = this.isTypeAllowed(file.type, allowedTypes);

      if (!allowed && this.hasExtension(file.name)) {
        allowed = this.isExtensionAllowed(file.name, allowedTypes);
      }

      // this should not be here
      // but, we will let it slide for now.
      if (!allowed) {
        app.router.openModal({type: 'alert', text: 'This type of file is not allowed'});
      }

      return allowed;
    },

    isAllowed: function(allowedTypes) {
      return this.isFileAllowed(this.toJSON(), allowedTypes);
    },

    isTypeAllowed: function(fileType, allowedTypes) {
      // if there's not fileType but allowedMimeTypes provided
      // by default the file is not allowed
      var allowed = (!fileType && allowedTypes) ? false : true;

      if (fileType && allowedTypes) {
        var self = this;
        allowed = allowedTypes.split(',').some(function (allowedType) {
          return self.isMimeType(fileType, allowedType) || self.isType(fileType, allowedType);
        });
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

    hasExtension: function(name) {
      return (_.isString(name) && name.indexOf('.') >= 0);
    },

    getExtension: function(name) {
      return this.hasExtension(name) ? name.split('.').pop() : null;
    },

    isExtensionAllowed: function(name, allowedTypes) {
      return this.hasExtension(name) ? this.isType(this.getExtension(name), allowedTypes) : false;
    },

    getSubType: function(type) {
      if (type.indexOf('/') >= 0) {
        type  = type.split('/').pop();
      }

      return type;
    },

    isType: function(type, allowedType) {
      if (!_.isString(allowedType)) {
        return false;
      }

      allowedType = this.getSubType(allowedType);
      type = this.getSubType(type);

      return _.isString(type) && type.toLowerCase() === allowedType.toLowerCase();
    },

    constructor: function FilesModel(data, options) {
      FilesModel.__super__.constructor.call(this, data, options);
    }

  });

  return FilesModel;

});
