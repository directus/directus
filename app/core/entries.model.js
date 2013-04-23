define([
  "require",
  "app",
  "backbone",
  "core/entries.nestedcollection",
],

function(require, app, Backbone, EntriesNestedCollection) {

  var Model =  Backbone.Model.extend({

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
      var EntriesCollection = this.collection.constructor;


      console.log('attributes', attributes);
      console.log('structure', this.collection.structure.pluck('id'));


      structure.each(function(column) {
        type = column.get('type');
        id = column.id;
        ui = structure.get(column).options;
        uiType = column.get('ui');

        // THIS SHOULD NOT BE HARDCORDED
        // THE TABLE MIGHT NOT EXIST YET (CASE USERS) RESOLVE THIS
        if (uiType === 'many_to_one' || uiType === 'single_media') {

          var relatedTableName = (uiType === 'single_media') ? 'directus_media' : ui.get('related_table');

          // Make sure the id is always wrapped in an object!
          var data = _.isObject(attributes[id]) ? attributes[id] : {id: attributes[id]};

          attributes[id] = new Model(data, {collection: app.entries[relatedTableName]});

          attributes[id].parent = this;

        }

        if (type === 'ONETOMANY' || type === 'MANYTOMANY') {

          columns = ui.get('visible_columns') || '';

          options = {
            table: app. tables.get(column.get('table_related')),
            structure: app.columns[column.get('table_related')],
            //preferences: app.preferences[column.get('table_related')],
            //parse:true,
            filters: {columns: columns.split(',')}
          };

          value = attributes[id] || [];

          switch (type) {
            case 'ONETOMANY':
              attributes[id] = new EntriesCollection(value, options);
              break;
            case 'MANYTOMANY':
              attributes[id] = new EntriesNestedCollection(value, options);
              break;
          }

          attributes[id].parent = this;
        }

        if (type === 'datetime') {
          attributes[id] = new Date(attributes[id]);
        }

      }, this);

      return attributes;
    },

    diff: function(key, val, options) {
      var attrs, changedAttrs = {};
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      _.each(attrs, function(val, key) {
        if (this.get(key) != val) changedAttrs[key] = val;
      },this);

      //Always pass id
      changedAttrs['id'] = this.id;

      return changedAttrs;
    },

    sync: function(method, model, options) {
      var isModelOrCollection;
      if (method === 'patch') {
        _.each(this.attributes, function(value, key) {
          isModelOrCollection = _.isObject(value) && (typeof value.toJSON === 'function');
          if (isModelOrCollection) {
            // Add foreign data to patch. Only add changed attributes
            value = value.toJSON({changed: true});
            if (!_.isEmpty(value)) {
              options.attrs[key] = value;
            }
          }
        });
      }

      return Backbone.sync.apply(this, [method, model, options]);
    },

    toJSON: function(options, noNest) {
      var attributes = _.clone(this.attributes),
          isModelOrCollection,
          options = options || {};

      if (options.changed) {
        attributes = this.changed;
        if (!_.isEmpty(attributes) && this.id) {
          attributes.id = this.id;
        }
      }

      // expand relations
      _.each(this.attributes, function(value, key) {
        isModelOrCollection = _.isObject(value) && (typeof value.toJSON === 'function');

        if (isModelOrCollection) {
          value = value.toJSON(options);
          if (_.isEmpty(value)) return;
          attributes[key] = value;
        }

      });

      // Pick selected columns, useful for collection "save"
      if (options && options.columns) {
        attributes = _.pick(attributes, options.columns);
      }

      return attributes;
    }

  });

  return Model;

});