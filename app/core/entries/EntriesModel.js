define(function(require, exports, module) {

  "use strict";

  var app                     = require("app"),
      Backbone                = require("backbone"),
      ModelHelper             = require('helpers/model'),
      EntriesJunctionCollection = require("core/entries/EntriesJunctionCollection"),
      UIManager               = require("core/UIManager"),
      SchemaManager           = require("schema/SchemaManager");

  var nestedTypes = ['many_to_one', 'single_file'];

  var EntriesModel = module.exports = Backbone.Model.extend({

    inputs: {},

    addInput: function(attr, input) {
      this.inputs[attr] = input;
    },

    getInput: function(attr) {
      return this.inputs[attr];
    },

    parse: function(result) {

      this._lastFetchedResult = result;

      result = this.parseRelational(result);
      //result = this.parseDate(result);

      return result;
    },

    // The flatten option flattens many-one relationships so the id is returned
    // instead of the object
    get: function(attr, options) {
      var uiType, value;
      options = options || {};

      value = Backbone.Model.prototype.get.call(this, attr);

      if (options.flatten) {
        uiType = this.getStructure().get(attr).get('ui');
        var relationshipType = this.getStructure().get(attr).getRelationshipType();
        if ('MANYTOONE' === relationshipType && _.isObject(value) ) {
          value = value.get('id');
        }
      }

      return value;
    },

    // @todo: Why is this one called so many times?
    // @note: Use HTML5 form validation when possible
    validate: function(attributes, options) {
      var errors = [];
      var structure = this.getStructure();
      var isNothing = function(value) {
        return value === undefined || value === null || value === '' || (!app.isNumber(value) && !_.isDate(value) && _.isEmpty(value));
      };

      //only validates attributes that are part of the schema
      attributes = _.pick(attributes, structure.pluck('column_name'));

      _.each(attributes, function(value, key, list) {
        //Column
        var column = structure.get(key);

        // Don't validate hidden fields
        // @todo should this be adjusted since these fields are now posting in some cases?
        if (column.get('hidden_input')) {
          return;
        }

        // Don't validate ID
        if (key === 'id') {
          return;
        }

        var nullDisallowed = column.get('is_nullable') === 'NO';
        var ui = UIManager._getUI(column.get('ui'));
        var forceUIValidation = ui.forceUIValidation === true;
        var isNull = isNothing(value);

        var uiSettings = UIManager.getSettings(column.get('ui'));

        var skipSerializationIfNull = uiSettings.skipSerializationIfNull;

        var mess = (!forceUIValidation && !skipSerializationIfNull && nullDisallowed && isNull) ?
          'The field cannot be empty'
          : UIManager.validate(this, key, value);

        if (mess !== undefined) {
          errors.push({attr: key, message: mess});
        }
      }, this);

      if (errors.length > 0) return errors;
    },

    rollBack: function() {
      var data = this.parse(this._lastFetchedResult);
      return this.set(data);
    },

    parseDate: function(attributes) {
      if(!attributes) {
        return;
      }
      _.each(this.getStructure().getColumnsByType('datetime'), function(column) {
        if (attributes[column.id] !== null) {
          attributes[column.id] = new Date(attributes[column.id]);
        }
      });
      return attributes;
    },

    //@todo: this whole shebang should be cached in the collection
    parseRelational: function(attributes) {
      var structure = this.getStructure();
      var relationalColumns = structure.getRelationalColumns();
      var EntriesCollection = require("core/entries/EntriesCollection");

      var EntriesManager = require("core/EntriesManager");

      _.each(relationalColumns, function(column) {
        var id = column.id;
        var tableRelated = column.getRelated();
        var relationshipType = column.getRelationshipType();
        //var value = attributes[id];
        var hasData = attributes[id] !== undefined;
        var ui = structure.get(column).options;

        switch (relationshipType) {
          case 'MANYTOMANY':
          case 'ONETOMANY':
            var columns = [];
            if (ui.get('visible_columns')) {
              // Clean whitespaces
              columns = ui.get('visible_columns').split(',').map(function(column) {
                return column.trim();
              });
            }
            var value = attributes[id] || [];
            var options = {
              table: SchemaManager.getTable(tableRelated),
              structure: SchemaManager.getColumns('tables', tableRelated),
              parse:true,
              filters: {columns_visible: columns},
              privileges: SchemaManager.getPrivileges(tableRelated)
              //preferences: app.preferences[column.get('related_table')],
            };


            // make sure that the table exists
            // @todo move this to column schema?
            if (options.table === undefined) {
              throw "Directus Error! The related table '" + tableRelated + "' does not exist! Check your UI settings for the field '" + id + "' in the table '" + this.collection.table.id + "'";
            }

            // make sure that the visible columns exists
            // todo move this to ??
            var diff = _.difference(columns, options.structure.pluck('column_name'));
            if (diff.length > 0) {
              throw "Directus Error! The column(s) '" + diff.join(',') + "' does not exist in related table '" + options.table.id + "'. Check your UI settings";
            }

            if (relationshipType === 'ONETOMANY') {
              // Provide model to prevent loading issues
              options.model = EntriesModel;
              attributes[id] = new EntriesCollection(value, options);
              break;
            }

            if (relationshipType === 'MANYTOMANY') {
              options.junctionStructure = SchemaManager.getColumns('tables', column.relationship.get('junction_table'));
              attributes[id] = new EntriesJunctionCollection(value, options);
            }

            break;

          case 'MANYTOONE':
            var data = {};

            if (attributes[id] !== undefined && attributes[id] !== null) {
              data = _.isObject(attributes[id]) ? attributes[id] : {id: attributes[id]};
            }

            var collectionRelated = EntriesManager.getInstance(tableRelated);
            var ModelRelated = collectionRelated.model;

            attributes[id] = new ModelRelated(data, {collection: collectionRelated});

            break;
        }

        attributes[id].parent = this;

      }, this);

      return attributes;
    },

    //@todo: This is maybe a hack. Can we make the patch better?
    diff: function(key, val, options) {
      var attrs, changedAttrs = {};
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      _.each(attrs, function(val, key) {
        if (this.get(key) !== val) changedAttrs[key] = val;
      },this);

      //Always pass id
      changedAttrs[this.idAttribute] = this.id;

      return changedAttrs;
    },

    sync: function(method, model, options) {

      var isModel,
          isCollection,
          attributes = this.attributes;

      if (method === 'patch' && options.includeRelationships) {

        var relationalColumns = this.getStructure().getRelationalColumns();
        //var relationalAttributes = _.pick(this.attributes, relationalKeys);

        _.each(relationalColumns, function(column) {
            var key = column.id;
            var value = attributes[key];

            // Some one-manys are not nested objects and will not need any special treatment
            if (!_.isObject(value)) return;

            // Check if it is a one-many and if it should be deleted!
            if ('MANYTOONE' === column.getRelationshipType() && _.isEmpty(value.attributes)) {
              options.attrs[key] = null;
              return;
            }

            // Add foreign data to patch. Only add changed attributes
            value = value.toJSON({changed: true});

            if (!_.isEmpty(value)) {
              options.attrs[key] = value;
            }

        }, this);
      }

      if (options.ignoreWriteFieldBlacklisted) {
        options.attrs = _.omit(options.attrs, this.getWriteFieldBlacklist());
      }

      return Backbone.sync.apply(this, [method, model, options]);
    },

    // returns true or false
    isMine: function() {
      var myId = parseInt(app.users.getCurrentUser().id,10),
          magicOwnerColumn = (this.collection !== null) ? this.collection.table.get('user_create_column') : null,
          magicOwnerId = this.get(magicOwnerColumn);

      //If magecownerid is model, grab the id instead
      if(magicOwnerId instanceof Backbone.Model) {
        magicOwnerId = magicOwnerId.get('id');
      }

      return myId === magicOwnerId;
    },

    // bigedit trumps write black list
    // bigedit = edit others
    // edit = edit your own
    canEdit: function(attribute) {
      //@TODO: Actually Fix this Issue
      if(!this.collection) {
        return false;
      }
      var iAmTheOwner         = this.isMine(),
          privileges          = this.collection.privileges,
          bigeditPermission   = this.collection.hasPermission('bigedit'),
          editPermission      = this.collection.hasPermission('edit'),
          columnIsBlacklisted = !_.isEmpty(attribute) && this.collection.isWriteBlacklisted(attribute),
          isNew               = !this.has('id');

      return (isNew && !columnIsBlacklisted) || (!iAmTheOwner && bigeditPermission && !columnIsBlacklisted) || (iAmTheOwner && editPermission && !columnIsBlacklisted);
    },

    getWriteFieldBlacklist: function() {
      return this.collection.getWriteFieldBlacklist();
    },

    getReadFieldBlacklist: function() {
      return this.collection.getWriteFieldBlacklist();
    },

    isWriteBlacklisted: function(attribute) {
      return this.collection.isWriteBlacklisted(attribute);
    },

    isReadBlacklisted: function(attribute) {
      return this.collection.isReadBlacklisted(attribute);
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
        attributes = this.unsavedAttributes() || this.changed;
        // always include id
        if (this.id) {
          attributes.id = this.id;
        }
      }

      // expand relations
      _.each(this.attributes, function(value, key) {
        isModel = (value instanceof Backbone.Model);
        isCollection = (value instanceof Backbone.Collection);

        if (isModel || isCollection) {
          value = value.toJSON(options);

          //@todo keep an eye on why this wasn't serialized before
          //if (_.isEmpty(value)) return;

          attributes[key] = value;
        }

      });

      // Pick selected columns, useful for collection "save"
      if (options && options.columns) {
        attributes = _.pick(attributes, options.columns);
      }

      return attributes;
    },

    getStructure: function() {
      return this.structure;
    },

    getNewInstance: function(options) {
      options = options || {};

      return new EntriesModel({}, _.extend({
        structure: this.structure,
        table: this.table,
        privileges: this.privileges
      }, options));

    },

    getTable: function() {
      return this.table;
    },

    initialize: function(data, options) {
      this.on('invalid', function(model, errors) {
        var details = _.map(errors, function(err) { return '<b>'+app.capitalize(err.attr)+':</b> '+err.message; }).join('</li><li>');
        var error_id = (this.id)? this.id : 'New';
        details = app.capitalize(this.getTable().id) + ' (' + error_id + ')' + '<hr><ul><li>' + details + '</li></ul>';
        app.trigger('alert:error', 'There seems to be a problem...', details);
      });

      this.listenTo(this, 'sync', ModelHelper.setIdAttribute);
    },

    clone: function() {
      return new this.constructor(this.attributes, {
        collection: this.collection,
        table: this.table
      });
    },

    // we need to do this because initialize is called AFTER parse.
    constructor: function EntriesModel(data, options) {
      // inherit structure and table from collection if it exists
      //@todo: it needs a fallback or throw an exception
      // when options (collection) is not defined.
      options || (options = {});
      this.structure = options.collection ? options.collection.structure : options.structure;
      this.table = options.collection ? options.collection.table : options.table;
      this.privileges = options.collection ? options.collection.privileges : options.privileges;

      EntriesModel.__super__.constructor.call(this, data, options);
    }

  });

});
