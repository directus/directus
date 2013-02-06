define([
  "app",
  "backbone",
  "core/collection"
],

function(app, Backbone, BaseCollection) {

  var Entries = {};

  var NestedCollection = BaseCollection.extend({

    isNested: true,

    model: Backbone.Model.extend({

      isNested: true,

      parse: function(result) {
        result.data = new Backbone.Model(result.data);
        this.collection.nestedCollection.add(result.data);
        return result;
      },

      //DRY this up please and move it to BB's protoype
      toJSON: function(options) {
        attributes = {};
        attributes.id = this.id;
        attributes.data = this.get('data').toJSON();
        return attributes;
      }

    }),

    trash: [],

    remove: function(model, options) {
      if (!model.isNew()) {
        this.trash.push(model);
      }
      this.constructor.__super__.remove.apply(this, arguments);
    },

    getNew: function(toJSON) {
      var models = this.filter(function(model) { return model.isNew(); });
      if (toJSON) {
        models = _.map(models, function(model) { return model.toJSON(); });
      }
      return models;
    },

    getTrash: function(toJSON) {
      var models = this.trash;
      if (toJSON) {
        models = _.map(models, function(model) { return model.toJSON(); });
      }
      return models;
    },

    getChanged: function(toJSON) {
      var models = this.filter(function(model) { return model.hasChanged(); });
      if (toJSON) {
        models = _.map(models, function(model) { return model.toJSON(); });
      }
      return models;
    },

    parse: function(response) {
      return response.rows;
    },

    initialize: function(models, options) {
      this.structure = options.structure;
      this.table = options.table;
      this.preferences = options.preferences;
      this.nestedCollection = new Entries.Collection({}, options);
      this.nestedCollection.on('change', function() {
        this.trigger('change');
      }, this);
    }

  });

  //The equivalent of a MySQL row.
  Entries.Model =  Backbone.Model.extend({

    parse: function(result) {
      return this.parseRelational(result);
    },

    parseRelational: function(attributes) {
      var type;
      var structure = this.collection.structure;
      var value;
      var id;
      var options;

      structure.each(function(column) {
        type = column.get('type');
        id = column.id;

        if (type === 'ONETOMANY' || type === 'MANYTOMANY') {

          options = {
            table: app. tables.get(column.get('table_related')),
            structure: app.columns[column.get('table_related')],
            preferences: app.preferences[column.get('table_related')],
            parse:true
          };

          value = attributes[id] || [];

          switch (type) {
            case 'ONETOMANY':
              attributes[id] = new Collection(value, options);
              break;
            case 'MANYTOMANY':
              attributes[id] = new NestedCollection(value, options);
              break;
          }
        }

        if (type === 'datetime') {
          attributes[id] = new Date(attributes[id]);
        }

      }, this);

      return attributes;
    },

    toJSON: function(options) {
      var attributes = _.clone(this.attributes);

      _.each(attributes, function(value, key) {
        if (_.isObject(value)) {
          if (typeof value.toJSON === 'function') {
            attributes[key] = value.toJSON();
          } else {
            delete attributes[key];
          }
        }
      });

      // Pick selected columns, useful for collection "save"
      if (options && options.columns) {
        attributes = _.pick(this.attributes, options.columns);
      }

      return attributes;
    },

    //save: function(attributes, options) {
    //  this.constructor.__super__.save.apply(this, [attributes, options]);
    //},

    //This should probably override the regular save function.
    saveRelational: function(attributes, options) {

      var references = [];

      _.each(this.collection.references, function(collection, tableName) {
        references.push({tableName: tableName, remove: collection.getTrash(true), add: collection.getNew(true), update: collection.getChanged(true)});
      }, this);

      if (references.length) {
        attributes.__references = references;
      }

      this.save(attributes, options);
    }

  });

  // This is a super mega core directus collection. Deals with everything from the DB.
  //
  Entries.Collection = BaseCollection.extend({

    model: Entries.Model,

    initialize: function(models, options) {
      this.structure = options.structure;
      this.table = options.table;
      this.url = this.table.get('url') + '/rows';
      this.filters = options.filters || { currentPage: 0, perPage: 500, orderDirection: 'ASC', orderBy: 'id', active: '1,2' };
      if (options.preferences) this.preferences = options.preferences;
    },

    parse: function(response) {
      this.total = response.total;
      return response.rows;
    }

  });

  return Entries;
});




