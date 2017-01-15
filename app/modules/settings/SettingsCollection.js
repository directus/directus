define([
    'app',
    'backbone',
    'underscore',
    'helpers/file',
    'core/collection'
  ],
  function (app, Backbone, _, FileHelper, Collection) {

    'use strict';

    var Settings = Collection.extend({

      model: Backbone.Model.extend({
        getStructure: function () {
          return this.structure;
        }
      }),

      getMerged: function() {
        var data = {};
        this.each(function(model) {
          data = _.extend(data, model.toJSON());
        });

        return new this.model(data, {collection: this, structure: this.structure});
      },

      isFileAllowed: function (file) {
        var allowed_types = this.get('allowed_filetypes') || '';
        var file_type = file.type || '';
        var allowed = allowed_types.split('|').some(function (item) {
          return file_type.indexOf(item) > -1;
        });

        // this should not be here
        // but, we will let it slide for now.
        if (!allowed) {
          app.router.openModal({type: 'alert', text: 'This type of file is not allowed'});
        }

        return allowed;
      },

      getMaxFileSize: function() {
        var maxBytes = this.get('global').get('max_file_size');

        return FileHelper.humanBytesInfo(maxBytes).size;
      },

      getMaxFileSizeUnit: function() {
        var maxBytes = this.get('global').get('max_file_size');

        return FileHelper.humanBytesInfo(maxBytes).unit;
      },

      initialize: function(models, options) {
        this.structure = options.structure;
      },

      isMaxFileSizeExceeded: function(file) {
        var fileSize = (file && file.size) ? file.size : 0;
        var maxFileSizeInBytes = this.get('global').get('max_file_size');
        var exceeded = false;

        if (fileSize > maxFileSizeInBytes) {
          exceeded = true;
        }

        return exceeded;
      }
    });

    return Settings;
  });
