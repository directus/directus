define(function(require, exports, module) {

  'use strict';

  var app               = require('app'),
      Backbone          = require('backbone'),
      _                 = require('underscore'),
      Collection        = require('core/collection'),
      EntriesManager    = require('core/EntriesManager');

  var junctionOptions = ['structure', 'table', 'preferences', 'filters', 'junctionStructure'];

  //@todo: Try merging this with entries.collection.js
  var NestedCollection = module.exports = Collection.extend({

    isNested: true,

    model: Backbone.Model.extend({

      isNested: true,

      parse: function (result) {
        var EntriesModel = require('core/entries/EntriesModel');

        result.data = new EntriesModel(result.data, {collection: this.collection.nestedCollection});
        this.collection.nestedCollection.add(result.data);

        return result;
      },

      //DRY this up please and move it to BB's protoype
      toJSON: function (options) {
        var attributes = _.clone(this.attributes);

        attributes.data = this.get('data').toJSON(options);
        if (_.isEmpty(attributes.data)) {
          attributes.data.id = this.get('data').id;
        }

        return attributes;
      }
    }),

    trash: [],

    create: function () {
      return this.nestedCollection.create(arguments);
    },

    remove: function (model, options) {
      if (!model.isNew()) {
        this.trash.push(model);
      }

      this.constructor.__super__.remove.apply(this, arguments);
    },

    //If getNested is set to true, the this will point to the nested element
    get: function (id, getNested) {
      var model = NestedCollection.__super__.get.call(this, id);

      if (getNested) {
        model = model.get('data');
      }

      return model;
    },

    add: function (models, options) {
      if (options && options.nest) {
        if (!_.isArray(models)) {
          models = [models];
        }

        models = _.map(models, function(model) {
          var obj = {};

          obj.data = model;

          return obj;
        });
      }

      return NestedCollection.__super__.add.apply(this, [models, options]);
    },

    getModels: function () {
      return this.filter(function (model) {
        var statusColumnName = this.table.getStatusColumnName();

        return !(model.has(statusColumnName) && model.get(statusColumnName) === app.statusMapping.deleted_num);
      }, this);
    },

    getColumns: function () {
      return this.nestedCollection.getColumns();
    },

    parse: function (response) {
      return (response.rows === undefined) ? response : response.rows;
    },

    reset: function (models, options) {
      models = Collection.__super__.reset.call(this, models, options);

      return models;
    },

    hasColumn: function (columnName) {
      return this.structure.get(columnName) !== undefined;
    },

    initialize: function (models, options) {
      var EntriesCollection = require('core/entries/EntriesCollection');

      _.extend(this, _.pick(options, junctionOptions));

      if (this.table.id === 'directus_files') {
        this.droppable = true;
        options.url = app.API_URL + 'files';
        this.nestedCollection = new EntriesManager.FilesCollection({}, options);
      } else {
        this.nestedCollection = new EntriesCollection({}, options);
      }


      this.nestedCollection.on('change', function() {
        this.trigger('change');
      }, this);
    },

    constructor: function EntriesJunctionCollection (data, options) {
      NestedCollection.__super__.constructor.call(this, data, options);
    }
  });
});
