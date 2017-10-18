define(function(require, exports, module) {

  'use strict';

  var app               = require('app'),
      Backbone          = require('backbone'),
      _                 = require('underscore'),
      Collection        = require('core/collection'),
      EntriesModel      = require('core/entries/EntriesModel'),
      StatusMixin       = require('mixins/status'),
      SaveItemMixin     = require('mixins/save-item'),
      SaveCollectionMixin = require('mixins/save-collection'),
      EntriesManager    = require('core/EntriesManager');

  var junctionOptions = ['structure', 'table', 'preferences', 'filters', 'junctionStructure'];

  var EntriesJunctionModel = Backbone.Model.extend({

    isNested: true,

    getTable: function () {
      return this.table;
    },

    parse: function M(result, options) {
      var EntriesModel = require('core/entries/EntriesModel');
      var attributes = result.junction || {};
      var data = options.nest === true ? result : result.data;

      attributes.data = new EntriesModel(data, {collection: this.collection.nestedCollection});

      this.structure = this.collection.junctionStructure;
      this.table = this.structure.table;

      if (this._trackingChanges) {
        this.restartTracking();
      }

      return attributes;
    },

    // DRY this up please and move it to BB's prototype
    toJSON: function (options) {
      var attributes = _.clone(this.attributes);

      attributes.data = this.get('data').toJSON(options);
      if (_.isEmpty(attributes.data)) {
        attributes.data.id = this.get('data').id;
      }

      return attributes;
    },

    constructor: function EntriesJunctionModel() {
      return Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });

  _.extend(EntriesJunctionModel.prototype, StatusMixin.Model);
  _.extend(EntriesJunctionModel.prototype, SaveItemMixin);

  //@todo: Try merging this with entries.collection.js
  var NestedCollection = module.exports = Collection.extend({

    isNested: true,

    model: EntriesJunctionModel,

    create: function () {
      return this.nestedCollection.create(arguments);
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
      }

      return NestedCollection.__super__.add.apply(this, [models, options]);
    },

    getModels: function () {
      return this.filter(function (model) {
        var statusColumnName = this.table.getStatusColumnName();
        var statusDeleteValue = this.table.getTableStatuses().getDeleteValue();

        return !(model.has(statusColumnName) && model.get(statusColumnName) === statusDeleteValue);
      }, this);
    },

    getColumns: function () {
      return this.nestedCollection.getColumns();
    },

    parse: function C(response, options) {
      // when nest is set, the response is already "clear it out"
      // without junction, containing only the related data
      if (options.nest && !response.junction) {
        return response;
      }

      var result = [];
      var parent = this.parent || options.parent;
      var parentAttribute = this.parentAttribute || options.parentAttribute;

      var junction = response.junction ? response.junction : undefined;
      var junctionData = junction && junction.data ? junction.data : [];
      var relatedData = response.data ? response.data : response;

      var parentColumnModel = parent.structure.get(parentAttribute);
      var relatedColumnName = parentColumnModel.getRelatedColumn();
      var relatedPrimaryColumnName = this.structure.table.getPrimaryColumnName();
      var _byId = {};

      if (junctionData.length > 0) {
        result = [];

        // Set all relational data easy to reach by ids
        _.each(relatedData, function (data) {
          _byId[data[relatedPrimaryColumnName]] = data;
        });

        // Set each junction data with its related data
        _.each(junctionData, function (attributes) {
          result.push({
            junction: attributes,
            data: _byId[attributes[relatedColumnName]]
          })
        });
      }

      return result;
    },

    reset: function (models, options) {
      models = Collection.__super__.reset.call(this, models, options);

      return models;
    },

    hasColumn: function (columnName) {
      return this.structure.get(columnName) !== undefined;
    },

    clone: function () {
      var options = {
        table: this.table,
        structure: this.structure,
        privileges: this.privileges,
        preferences: this.preferences,
        url: this.url,
        rowsPerPage: this.rowsPerPage,
        model: this.model,
        comparator: this.comparator
      };

      return new this.constructor(this.models, options);
    },

    // listen to the related model and propagate to their parent collection
    _onAdd: function (model) {
      var relatedModel = model.get('data');

      if (relatedModel) {
        relatedModel.on('change', function (model, options) {
          this.trigger.call(this, 'change', relatedModel, options);
        }, this);
      }
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

      this.on('add', this._onAdd, this);

      this.nestedCollection.on('change', function() {
        this.trigger('change');
      }, this);
    },

    constructor: function EntriesJunctionCollection (data, options) {
      options.silent = false;
      NestedCollection.__super__.constructor.call(this, data, options);
    }
  });

  _.extend(NestedCollection.prototype, StatusMixin.Collection);
  _.extend(NestedCollection.prototype, SaveCollectionMixin);
});
