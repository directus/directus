define([
  'app',
  'underscore',
  'backbone',
  'core/entries/EntriesModel',
  'core/notification',
  'core/t',
  'utils',
  'moment',
  'helpers/file'
], function(app, _, Backbone, EntriesModel, Notification, __t, Utils, moment, File) {

  'use strict';

  var FilesModel = EntriesModel.extend({

    makeFileUrl: function (thumbnail) {
      var url;

      if (thumbnail) {
        url = this.getThumbnailUrl();
      } else {
        url = this.get('url');

        if (!url && this.isNew()) {
          url = this.get('data');
        }
       }

      return url;
    },

    getThumbnailUrl: function () {
      var url;

      if (this.isNew()) {
        url = this.get('thumbnailData') || this.get('url');
      } else {
        url = this.get('thumbnail_url');
      }

      return url;
    },

    toJSON: function (all) {
      var atts = FilesModel.__super__.toJSON.call(this);

      if (!atts) {
        atts = _.clone(this.attributes);
      }

      // TODO: avoid omitting url and html at some point
      // rewrite this so we omit these values when we really want it to be omitted.
      if (all !== true) {
        atts = this.omitCustomAttrs(atts)
      }

      return atts;
    },

    omitCustomAttrs: function (attrs) {
      return _.omit(attrs, 'thumbnailData', 'url', 'file_url', 'file_thumb_url', 'old_thumbnail_url', 'thumbnail_url', 'html', 'embed_url')
    },

    formatTitle: function (name) {
      if (name.indexOf('.') >= 0) {
        var extension = name.split('.').pop();
        name = name.slice(0, name.indexOf('.' + extension));
      }

      name = name.replace(/[_-]/g, ' ');

      return name;
    },

    setFile: function (file, allowedTypes, fn) {
      var allowed = false;

      if (_.isFunction(allowedTypes)) {
        fn = allowedTypes;
        allowedTypes = null;
      }

      if (!this.isFileAllowed(file, allowedTypes)) {
        if (_.isFunction(fn)) {
          fn(allowed);
        }

        return allowed;
      }

      if (app.settings.isMaxFileSizeExceeded(file)) {
        Notification.error(__t('max_file_size_exceeded_x_x', {
          size: app.settings.getMaxFileSize(),
          unit: app.settings.getMaxFileSizeUnit()
        }));

        if (_.isFunction(fn)) {
          fn(allowed);
        }

        return allowed;
      }

      var model = this;
      allowed = true;
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
                fn(_.clone(model.attributes), allowed);
              }
            });
          } else {
            model.set(_.extend(modelData, {
              url: fileData
            }));
            if (_.isFunction(fn)) {
              fn(_.clone(model.toJSON()), allowed);
            }
          }
        });
      });
    },

    // setData will try to get thumbnail from a base64
    // this is used by retrieve links
    setData: function (item, allowedTypes, fn) {
      var model = this;

      if (_.isFunction(allowedTypes)) {
        fn = allowedTypes;
        allowedTypes = null;
      }

      if (allowedTypes && !this.isFileAllowed(item, allowedTypes)) {
        return false;
      }

      File.resizeFromData(item.data, 200, 200, function(thumbnailData) {
        item.thumbnailData = thumbnailData;
        model.set(item);

        if (_.isFunction(fn)) {
          fn();
        }
      });
    },

    setLink: function (url, allowedTypes) {
      var model = this;
      app.sendLink(url, function(data) {
        var item = data[0];
        item[model.table.getStatusColumnName()] = model.table.getStatusDefaultValue();
        // item[app.statusMapping.status_name] = app.statusMapping.active_num;
        // Unset the model ID so that a new file record is created
        // (and the old file record isn't replaced w/ this data)
        item.id = undefined;
        item.user = model.userId;

        model.setData(item, allowedTypes);
      });
    },

    isFileAllowed: function (file, allowedTypes) {
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

    isAllowed: function (allowedTypes) {
      return this.isFileAllowed(this.toJSON(), allowedTypes);
    },

    isTypeAllowed: function (fileType, allowedTypes) {
      // if there's not fileType but allowedMimeTypes provided
      // by default the file is not allowed
      var allowed = !(!fileType && allowedTypes);

      if (fileType && allowedTypes) {
        allowed = allowedTypes.split(',').some(function (allowedType) {
          allowedType = allowedType.trim();

          return this.isMimeType(fileType, allowedType) || this.isType(fileType, allowedType);
        }, this);
      }

      return allowed;
    },

    isMimeType: function (mimeType, allowedMimeType) {
      mimeType = mimeType || this.type;
      if (!_.isString(mimeType)) {
        return false;
      }

      if (allowedMimeType.endsWith('/*')) {
        return allowedMimeType.split('/')[0] === mimeType.split('/')[0];
      }

      return allowedMimeType === mimeType;
    },

    hasExtension: function (name) {
      return (_.isString(name) && name.indexOf('.') >= 0);
    },

    getExtension: function (name) {
      return this.hasExtension(name) ? name.split('.').pop() : null;
    },

    isExtensionAllowed: function (name, allowedTypes) {
      return this.hasExtension(name) ? this.isType(this.getExtension(name), allowedTypes) : false;
    },

    isEmbed: function () {
      return this.getMainType() === 'embed';
    },

    getMainType: function () {
      return (this.get('type') || '').split('/').shift();
    },

    getSubType: function (friendly) {
      var type, subtype;

      // TODO: This model should only use its own subtype
      if (_.isString(friendly)) {
        type  = friendly;
      } else {
        type = this.get('type');
      }

      subtype = (type || '').split('/').pop();
      if (friendly === true) {
        subtype = File.friendlySubtype(subtype);
      }

      return subtype;
    },

    isType: function (type, allowedType) {
      if (!_.isString(allowedType)) {
        return false;
      }

      allowedType = this.getSubType(allowedType);
      type = this.getSubType(type);

      return _.isString(type) && type.toLowerCase() === allowedType.toLowerCase();
    },

    // Do not track any column that doesn't belong to the files structure
    // NOTE: this can be fixed by not set non-structure attribute to attributes
    // TODO: Remove this method and do not add thumbnailData to attributes
    shouldBeTracked: function (attr) {
      return this.structure.get(attr) != null;
    },

    constructor: function FilesModel(data, options) {
      FilesModel.__super__.constructor.call(this, data, options);
    }
  });

  return FilesModel;
});
