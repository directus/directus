define([
    'app',
    'backbone',
    'underscore',
    'helpers/file',
    'core/entries/EntriesModel',
    'core/entries/EntriesCollection',
    'core/collection'
  ],
  function (app, Backbone, _, FileHelper, EntriesModel, EntriesCollection, Collection) {

    'use strict';

    return EntriesCollection.extend({

      asModel: function() {
        var settings = {};

        this.each(function(model) {
          settings[model.get('name')] = model.get('value');
        });

        var model = this.at(0).clone();
        model.set(settings);

        return model;
      },

      get: function(attr) {
        var original = Collection.prototype.get;

        if (attr == 'global' || attr == 'files') {
          return this;
        }

        return original.apply(this, arguments);
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
  });
