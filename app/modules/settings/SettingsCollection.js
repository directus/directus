define([
  'app',
  'backbone',
  'underscore',
  'helpers/file',
  'core/entries/EntriesModel',
  'core/EntriesManager',
  'core/entries/EntriesCollection',
  'core/collection'
],
function (app, Backbone, _, FileHelper, EntriesModel, EntriesManager, EntriesCollection, Collection) {

  'use strict';

  return Collection.extend({

    model: Backbone.Model.extend({
      getStructure: function () {
        return this.structure;
      }
    }),

    updateRowsPerPage: function () {
      EntriesManager.updateRowsLimit(this.get('rows_per_page'));
    },

    initialize: function () {
      this.on('add change reset', this.updateRowsPerPage, this);
    },

    parse: function (data, options) {
      var resp = [];
      data = data.data ? data.data : data;

      if (options.grouped === true) {
        _.each(data, function (attrs, collection) {
          _.each(attrs, function (value, name) {
            resp.push({
              name: name,
              value: value,
              collection: collection
            });
          });
        });

        data = resp;
      }

      return data;
    },

    asModel: function() {
      var settings = {};
      var model;

      this.each(function(model) {
        if (!settings[model.get('collection')]) {
          settings[model.get('collection')] = {};
        }

        settings[model.get('collection')][model.get('name')] = model.get('value');
      });

      model = new this.model(settings, {
        structure: this.structure,
        privileges: this.privileges,
        table: this.table,
        url: this.url
      });

      model.diff = function (data) {
        var self = this;
        var changedAttrs = {};

        _.each(data, function (dataAttrs, collection) {
          var collectionAttrs = self.get(collection);
          var changed = {};

          _.each(dataAttrs, function (value, attr) {
            if (collectionAttrs[attr] != value && attr != 'max_file_size') {
              changed[attr] = value;
            }
          });

          if (_.keys(changed).length) {
            changedAttrs[collection] = changed;
          }
        });

        return changedAttrs;
      };

      return model;
    },

    get: function(attr) {
      var original = Collection.prototype.get;

      // if attr is global or files it's looking for a setting collection
      // which will be deprecated, so return the collection itself
      // so chaining operation will try to get a setting in a given collection
      if (attr == 'global' || attr == 'files') {
        return this;
      }

      // support the old collection
      // if a string is given as attr it means it's looking for an setting name
      var value;
      if (!_.isNaN(Number(attr)) || attr instanceof Backbone.Model) {
        value = original.apply(this, arguments);
      } else {
        var model = this.findWhere({name: attr});

        if (model) {
          value = model.get('value');
        }
      }

      return value;
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
