define([
  "app",
  "backbone",
  "core/collection"
],

function(app, Backbone, BaseCollection) {

  var Entries = {};

  Entries.NestedCollection = BaseCollection.extend({

    isNested: true,

    model: Backbone.Model.extend({

      isNested: true,

      parse: function(result) {
        result.data = new this.collection.nestedCollection.model(result.data, {collection: this.collection.nestedCollection});
        this.collection.nestedCollection.add(result.data);
        return result;
      },

      //DRY this up please and move it to BB's protoype
      toJSON: function(options) {
        var attributes = _.clone(this.attributes);
        attributes.data = this.get('data').toJSON();
        return attributes;
      }
    }),

    trash: [],

    create: function() {
      return this.nestedCollection.create(arguments);
    },

    remove: function(model, options) {
      if (!model.isNew()) {
        this.trash.push(model);
      }
      this.constructor.__super__.remove.apply(this, arguments);
    },

    //If getNested is set to true, the this will point to the nested element
    get: function(id, getNested) {
      var model = Entries.NestedCollection.__super__.get.call(this, id);
      if (getNested) model = model.get('data');
      return model;
    },

    add: function(models, options) {
      if (options && options.nest) {        
        if (!_.isArray(models)) { models = [models]; }
        models = _.map(models, function(model) { 
          var obj = {};
          obj.data = model;
          return obj; 
        });
      }
      Entries.NestedCollection.__super__.add.apply(this, [models, options]);
    },

    /*

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

    */

    getModels: function() {
      return this.filter(function(model) {
        return !(model.has('active') && model.get('active') === 0);
      });
    },

    getColumns: function() {
      return this.nestedCollection.getColumns();
    },

    parse: function(response) {
      return (response.rows === undefined) ? response : response.rows;
    },

    initialize: function(models, options) {
      this.structure = options.structure;
      this.table = options.table;
      this.preferences = options.preferences;
      this.filters = options.filters;
      if (this.table.id === 'directus_media') {
        this.droppable = true;
        options.url = app.API_URL + 'media';
        this.nestedCollection = new Entries.MediaCollection({}, options);
      } else {
        this.nestedCollection = new Entries.Collection({}, options);
      }
      this.nestedCollection.on('change', function() {
        this.trigger('change');
      }, this);
    }

  });

  //The equivalent of a MySQL row.
  Entries.Model =  Backbone.Model.extend({

    parse: function(result) {
      this._lastFetchedResult = result;
      return this.parseRelational(result);
    },

    validate: function(attributes, options) {
      var errors = [];

      //only validates attributes that are part of the schema
      attributes = _.pick(attributes, this.collection.structure.pluck('column_name'));

      _.each(attributes, function(value, key, list) {
        var mess = ui.validate(this, key, value);
        if (mess !== undefined) {
          errors.push({attr: key, message: ui.validate(this, key, value)});
        }
      }, this);
      if (errors.length > 0) return errors;
    },

    rollBack: function() {
      var data = this.parse(this._lastFetchedResult);
      return this.set(data);
    },

    parseRelational: function(attributes) {
      var type;
      var structure = this.collection.structure;
      var value;
      var id;
      var options;
      var ui;
      var columns;

      structure.each(function(column) {
        type = column.get('type');
        id = column.id;
        ui = structure.get(column).options;
        uiType = column.get('ui');

        // THIS SHOULD NOT BE HARDCORDED
        // THE TABLE MIGHT NOT EXIST YET (CASE USERS) RESOLVE THIS
        if (uiType === 'many_to_one' || uiType === 'single_media') {
          var relatedTableName = (uiType === 'single_media') ? 'directus_media' : ui.get('related_table');

          attributes[id] = new Entries.Model(attributes[id], {collection: app.entries[relatedTableName]});
        }

        if (type === 'ONETOMANY' || type === 'MANYTOMANY') {

          columns = ui.get('visible_columns') || '';

          options = {
            table: app. tables.get(column.get('table_related')),
            structure: app.columns[column.get('table_related')],
            //preferences: app.preferences[column.get('table_related')],
            parse:true,
            filters: {columns: columns.split(',')}
          };

          value = attributes[id] || [];

          switch (type) {
            case 'ONETOMANY':
              attributes[id] = new Entries.Collection(value, options);
              break;
            case 'MANYTOMANY':
              attributes[id] = new Entries.NestedCollection(value, options);
              break;
          }
        }

        if (type === 'datetime') {
          attributes[id] = new Date(attributes[id]);
        }

      }, this);

      return attributes;
    },

    toJSON: function(options, noNest) {
      var attributes = {};

      // clone all attributes. expand relations
      _.each(this.attributes, function(value, key) {
        if (_.isObject(value) && (typeof value.toJSON === 'function')) {
          value = value.toJSON();  
        }
        attributes[key] = value;
      }, this);

      // Pick selected columns, useful for collection "save"
      if (options && options.columns) {
        attributes = _.pick(attributes, options.columns);
      }

      return attributes;
    }

  });

  // This is a super mega core directus collection. Deals with everything from the DB.
  //
  Entries.Collection = BaseCollection.extend({

    model: Entries.Model,

    getColumns: function() {
      return (this.filters.columns !== undefined) ? this.filters.columns : _.intersection(this.structure.pluck('id'), this.preferences.get('columns_visible').split(','));
    },

    getFilter: function(key) {
      return (this.preferences && this.preferences.has(key)) ? this.preferences.get(key) : this.filters[key];
    },

    getFilters: function() {
      return _.extend(this.filters, _.pick(this.preferences.toJSON(),'columns_visible','sort','sort_order','active'));
    },

    setFilter: function(key, value, options) {
      var attrs;
      if (key === null || typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = value;
      }
      _.each(attrs, function(value, key) {
        if (this.preferences.has(key)) {
          this.preferences.set(key, value, {silent: true});
        } else {
          this.filters[key] = value;
        }
      },this);
      this.preferences.save();
    },

    initialize: function(models, options) {
      this.structure = options.structure;
      this.table = options.table;
      this.active = this.table.get('active');
      this.url = options.url || this.table.get('url') + '/rows';
      this.filters = _.extend({ currentPage: 0, perPage: 500, sort: 'id', sort_order: 'ASC', active: '1,2' }, options.filters);
      if (options.preferences) {
        this.preferences = options.preferences;
        this.preferences.on('change', function() { this.trigger('change'); }, this);
      }
    },

    parse: function(response) {
      if (_.isEmpty(response)) return;
      
      if (response.total) {
        this.total = response.total;
        this.table.set('total', this.total, {silent: true});
      }

      if (response.active) {
        this.active = response.active;
        this.table.set('active', this.active, {silent: true});
      }

      if (response.inactive) {
        this.inactive = response.inactive;
        this.table.set('inactive', this.inactive, {silent: true});
      }

      if (response.trash) {
        this.trash = response.trash;
        this.table.set('trash', this.trash, {silent: true});
      }

      return response.rows;
    }

  });

  Entries.MediaModel = Entries.Model.extend({

    uploader: true
/*
    sync: function(method, model, options) {

      var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'patch':  'PATCH',
        'delete': 'DELETE',
        'read':   'GET'
      };

      var type = methodMap[method];

      var data = new FormData();
      _.each(this.attributes, function(value, key) {
        data.append(key, value);
      });

      options.data = data;
      options.cache = false;
      options.contentType = false;
      options.processData = false;
      options.type = 'POST';

      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
      };

      return Backbone.sync.apply(this, [method, model, options]);
    }
*/
  });

  Entries.MediaCollection = Entries.Collection.extend({
    droppable: true,
    model: Entries.MediaModel
  });

  return Entries;
});




