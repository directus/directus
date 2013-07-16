define([
  "require",
  "app",
  "backbone",
  "core/entries/entries.nestedcollection",
  "core/entries/entries.collection"
],

function(require, app, Backbone, EntriesNestedCollection, EntriesCollection) {

  var nestedTypes = ['many_to_one', 'single_media'];

  var EntriesModel = Backbone.Model.extend({

    parse: function(result) {
      this._lastFetchedResult = result;
      return this.parseRelational(result);
    },

    // The flatten option flattens many-one relationships so the id is returned
    // instead of the object
    get: function(attr, options) {
      var uiType, value;
      options = options || {};

      value = Backbone.Model.prototype.get.call(this, attr);

      if (options.flatten) {
        uiType = this.collection.structure.get(attr).get('ui');
        if (nestedTypes.indexOf(uiType) > -1 && _.isObject(value) ) {
          value = value.get('id');
        }
      }

      return value;
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


    //@todo: this whole shebang should be cached in the collection
    parseRelational: function(attributes) {
      var type;
      var structure = this.collection.structure;
      var value;
      var id;
      var options;
      var ui;
      var columns;

      EntriesCollection = EntriesCollection || require("core/entries/entries.collection");

      structure.each(function(column) {
        type = column.get('type');
        id = column.id;
        ui = structure.get(column).options;
        uiType = column.get('ui');

        // THIS SHOULD NOT BE HARDCORDED
        // THE TABLE MIGHT NOT EXIST YET (CASE USERS) RESOLVE THIS
        if (uiType === 'many_to_one' || uiType === 'single_media') {

          var relatedTableName = (uiType === 'single_media') ? 'directus_media' : ui.get('table_related');
          var data = {};

          // If an id is avalible, make sure it is always wrapped in an object!
          if (attributes[id] !== undefined) {
            data = _.isObject(attributes[id]) ? attributes[id] : {id: attributes[id]};
          }

          attributes[id] = new EntriesModel(data, {collection: app.entries[relatedTableName]});

          attributes[id].parent = this;

        }

        if (type === 'ONETOMANY' || type === 'MANYTOMANY') {

          columns = ui.get('visible_columns') ? ui.get('visible_columns').split(',') : [];

          options = {
            table: app. tables.get(column.get('table_related')),
            structure: app.columns[column.get('table_related')],
            //preferences: app.preferences[column.get('table_related')],
            parse:true,
            filters: {columns: columns}
          };

          if (options.table === undefined) {
              throw "Directus Error! The related table '" + column.get('table_related') + "' does not exist! Check your UI settings for the field '" + id + "' in the table '"+this.collection.table.id+"'";
          }

          var diff = _.difference(columns, options.structure.pluck('column_name'));
          if (diff.length > 0) {
            throw "Directus Error! The column(s) '" + diff.join(',') + "' does not exist in related table '" + options.table.id + "'. Check your UI settings";
          }

          value = attributes[id] || [];

          switch (type) {
            case 'ONETOMANY':
              attributes[id] = new EntriesCollection(value, options);
              break;
            case 'MANYTOMANY':
              options.junctionStructure = app.columns[column.get('junction_table')];
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
      changedAttrs.id = this.id;

      return changedAttrs;
    },

    sync: function(method, model, options) {
      var isModel,
          isCollection;

      if (method === 'patch') {
        _.each(this.attributes, function(value, key) {
          isModel = (value instanceof Backbone.Model);
          isCollection = (value instanceof Backbone.Collection);

          if (isModel || isCollection) {
            // Add foreign data to patch. Only add changed attributes
            value = value.toJSON({changed: true});

            if (!_.isEmpty(value)) {
              options.attrs[key] = value;
            }
          }

        });
      }

      //return;

      return Backbone.sync.apply(this, [method, model, options]);
    },

    // returns true or false
    isMine: function() {
      var myId = parseInt(app.getCurrentUser().id,10),
          magicOwnerColumn = this.collection.table.get('magic_owner_column'),
          magicOwnerId = this.get(magicOwnerColumn);

      return myId === magicOwnerId;
    },

    // bigedit trumps write black list
    // bigedit = edit others
    // edit = edit your own
    canEdit: function(attribute) {
      var iAmTheOwner         = this.isMine(),
          privileges          = this.collection.privileges,
          bigeditPermission   = this.collection.hasPermission('bigedit'),
          editPermission      = this.collection.hasPermission('edit'),
          columnIsBlacklisted = !_.isEmpty(attribute) && this.collection.isWriteBlacklisted(attribute);

      return (!iAmTheOwner && bigeditPermission && !columnIsBlacklisted) || (iAmTheOwner && editPermission && !columnIsBlacklisted);
    },

    canDelete: function() {
      var iAmTheOwner = this.isMine(),
          canDelete = this.collection.hasPermission('delete'),
          canBigdelete = this.collection.hasPermission('bigdelete');

      return (!iAmTheOwner && canBigdelete) || (iAmTheOwner && canDelete);
    },

    toJSON: function(options, noNest) {
      var attributes = _.clone(this.attributes),
          isModel,
          isCollection;

      options = options || {};

      if (options.changed && !this.isNew()) {
        attributes = this.changed;
        if (!_.isEmpty(attributes) && this.id) {
          attributes.id = this.id;
        }
      }

      // expand relations
      _.each(this.attributes, function(value, key) {
        isModel = (value instanceof Backbone.Model);
        isCollection = (value instanceof Backbone.Collection);

        if (isModel || isCollection) {
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
    },

    initialize: function() {
      if (this.collection !== undefined) this.structure = this.collection.structure;
    }
  });

  return EntriesModel;

});