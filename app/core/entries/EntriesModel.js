define(function(require, exports, module) {

  'use strict';

  var app                     = require('app'),
      _                       = require('underscore'),
      Backbone                = require('backbone'),
      ModelHelper             = require('helpers/model'),
      EntriesJunctionCollection = require('core/entries/EntriesJunctionCollection'),
      UIManager               = require('core/UIManager'),
      Utils                   = require('utils'),
      StatusMixin             = require('mixins/status'),
      SaveItemMixin           = require('mixins/save-item'),
      SchemaHelper            = require('helpers/schema'),
      SchemaManager           = require('schema/SchemaManager');

  var EntriesModel = module.exports = Backbone.Model.extend({

    inputs: {},

    addInput: function (attr, input) {
      this.inputs[attr] = input;
    },

    getInput: function (attr) {
      return this.inputs[attr];
    },

    parse: function (result, options) {
      this._lastFetchedResult = result;
      //result = this.parseDate(result);
      this._resetTracking();

      // if collection exists in options it means this model is part of a collection
      // Which means the actual model attributes are not inside `data` attribute
      return this.parseRelational(options.collection ? result : result.data);
    },

    setId: function (id) {
      this.set(this.idAttribute, id);
    },

    // The flatten option flattens many-one relationships so the id is returned
    // instead of the object
    get: function (attr, options) {
      var value, column;

      options = options || {};

      value = Backbone.Model.prototype.get.call(this, attr);

      if (this.getStructure()) {
        column = this.getStructure().get(attr);
      }

      if (options.flatten) {
        var relationshipType = column.getRelationshipType();

        if ('MANYTOONE' === relationshipType && _.isObject(value) ) {
          value = value.get('id');

          if (value != null) {
            value = Number(value);
          }
        }
      } else if (column && !column.isRelational() && SchemaHelper.isNumericType(column.getType()) && value != null) {
        value = Number(value);
      }

      return value;
    },

    // @todo: Why is this one called so many times?
    // @note: Use HTML5 form validation when possible
    validate: function (attributes, options) {
      var structure = this.getStructure();
      var columnsName;
      var errors = [];

      options = options || {};

      if (options.validateAttributes === true) {
        columnsName = _.keys(attributes);
      } else {
        // Only validates visible columns
        columnsName = structure.getVisibleInputColumnsName();
      }

      _.each(columnsName, function (columnName) {
        var column = structure.get(columnName);

        // skip if the column name doesn't exists in the structure
        if (!column) {
          return;
        }

        var value = attributes[columnName];
        var allowNull = column.isNullable();
        var required = column.get('required');
        var defaultValue = column.get('default_value');
        var forceUIValidation = UIManager.shouldForceUIValidation(column.get('ui'));
        var isNull = Utils.isNothing(value);
        var uiSettings = UIManager.getSettings(column.get('ui'));
        var skipSerializationIfNull = uiSettings.skipSerializationIfNull;

        // Don't validate hidden fields
        // @todo should this be adjusted since these fields are now posting in some cases?
        if (column.get('hidden_input')) {
          return;
        }

        // Don't validate System Columns
        if (!column.shouldValidate()) {
          return;
        }

        if (isNull && allowNull && !required) {
          return;
        }

        // NOTE: Column with default value should not be required
        // if the value is null/nothing/empty
        if (isNull && !required && defaultValue !== undefined) {
          return;
        }

        var mess = (!forceUIValidation && !skipSerializationIfNull && !allowNull && isNull) ?
          'The field cannot be empty'
          : UIManager.validate(this, columnName, value);

        if (mess !== undefined) {
          errors.push({attr: columnName, message: mess});
        }
      }, this);

      if (errors.length > 0) {
        return errors;
      }
    },

    rollBack: function () {
      var data = this.parse(this._lastFetchedResult);

      return this.set(data);
    },

    parseDate: function (attributes) {
      if(!attributes) {
        return;
      }
      _.each(this.getStructure().getColumnsByType('datetime'), function (column) {
        if (attributes[column.id] !== null) {
          attributes[column.id] = new Date(attributes[column.id]);
        }
      });
      return attributes;
    },

    //@todo: this whole shebang should be cached in the collection
    parseRelational: function (attributes) {
      var structure = this.getStructure();
      var relationalColumns = structure.getRelationalColumns();
      var EntriesCollection = require('core/entries/EntriesCollection');

      var EntriesManager = require('core/EntriesManager');

      _.each(relationalColumns, function (column) {
        var id = column.id;
        var tableRelated = column.getRelated();
        var relationshipType = column.getRelationshipType();
        var ui = structure.get(column).options;

        switch (relationshipType) {
          case 'MANYTOMANY':
          case 'ONETOMANY':
            var columns = [];
            if (ui.get('visible_columns')) {
              // Clean whitespaces
              columns = Utils.parseCSV(ui.get('visible_columns'));
            }

            var value = attributes[id] || [];
            var models = value;
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
              throw "Error! The related table '" + tableRelated + "' does not exist! Check your UI settings for the field '" + id + "' in the table '" + this.collection.table.id + "'";
            }

            // make sure that the visible columns exists
            // todo move this to ??
            var diff = _.difference(columns, options.structure.pluck('column_name'));
            if (diff.length > 0) {
              throw "Error! The column(s) '" + diff.join(',') + "' does not exist in related table '" + options.table.id + "'. Check your UI settings";
            }

            // TODO: Update conditional logic
            if (relationshipType === 'ONETOMANY') {
              // Provide model to prevent loading issues
              options.model = EntriesModel;

              if (this.attributes[id] instanceof EntriesCollection) {
                this.attributes[id].set(value, {merge: true, parse: true});
                attributes[id] = this.attributes[id];
              } else if (value instanceof EntriesCollection) {
                attributes[id].set(value.models, {merge: true, parse: false});
              } else {
                options.parentAttribute = id;
                options.parent = this;
                attributes[id] = new EntriesCollection(value, options);
              }

              break;
            }

            if (relationshipType === 'MANYTOMANY') {
              options.junctionStructure = SchemaManager.getColumns('tables', column.relationship.get('junction_table'));

              if (this.attributes[id] instanceof EntriesJunctionCollection) {
                // If the junction has no items, do not set the data into the collection
                if (value.junction && value.junction.data.length > 0) {
                  this.attributes[id].set(value, {merge: true, parse: true});
                }

                attributes[id] = this.attributes[id];
              } else if (value instanceof EntriesJunctionCollection) {
                attributes[id].set(value.models, {merge: true, parse: false});
              } else {
                options.parentAttribute = id;
                options.parent = this;
                attributes[id] = new EntriesJunctionCollection(models, options);
              }
            }

            break;

          case 'MANYTOONE':
            var data = {};

            if (Utils.isSomething(attributes[id])) {
              if (!_.isObject(attributes[id])) {
                var idAttribute = 'id';
                var relatedTableName = this.structure.get(id).relationship.get('related_table');
                var relatedTable = app.schemaManager.getTable(relatedTableName);

                if (relatedTable) {
                  idAttribute = relatedTable.getPrimaryColumnName();
                }

                data[idAttribute] = attributes[id];
              } else {
                data = attributes[id].data;
              }
            }

            // Create a new model only when the value is not already a model
            if (!(attributes[id] instanceof Backbone.Model)) {
              var collectionRelated = EntriesManager.getInstance(tableRelated);
              var ModelRelated = collectionRelated.model;

              attributes[id] = new ModelRelated(data, {collection: collectionRelated});
            }

            break;
        }

        attributes[id].parent = this;
        if (relationshipType) {
          attributes[id].parentAttribute = id;
        }

      }, this);

      return attributes;
    },

    //@todo: This is maybe a hack. Can we make the patch better?
    diff: function (key, val, options) {
      var attrs, column, changedAttrs = {};
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      _.each(attrs, function (val, key) {
        // TODO: Add clean the get method to parse the value data type
        if (this.getStructure()) {
          column = this.getStructure().get(key);

          if (SchemaHelper.isNumericType(column.getType())) {
            val = Number(val);
          }
        }

        if (this.get(key, {flatten: true}) !== val) {
          changedAttrs[key] = val;
        }
      },this);

      //Always pass id
      changedAttrs[this.idAttribute] = this.id;

      return changedAttrs;
    },

    sync: function (method, model, options) {
      var attributes = this.attributes;

      options = options || {};

      if (options.includeRelationships && method === 'patch') {
        options.attrs = this.getChanges();
      }

      if (method === 'read') {
        options.data = options.data || {};

        if (!options.data.status) {
          options.data.preview = true;
          // Add "reqid" (request id) query param to all GET request
          // to prevent caching
          options.data.reqid = Date.now();
        }
      }

      if (method === 'patch' && options.includeRelationships) {
        var relationalColumns = this.getStructure().getRelationalColumns();

        _.each(relationalColumns, function (column) {
          var key = column.id;
          var value = attributes[key];

          if (!this.hasChanges(key)) {
            return false;
          }

          // omit if the user has not permission to edit the field
          if (!this.canEdit(key)) return;

          // Some one-manys are not nested objects and will not need any special treatment
          if (!_.isObject(value)) return;

          // Check if it is a one-many and if it should be deleted!
          // NOTE: MANYTOONE are passed as object (attributes)
          if (!column.isManyToOne()) {
            // Add foreign data to patch. Only add changed attributes
            value = value.toJSON({changed: true});
          } else if (_.isEmpty(value)) {
            value = null;
          }

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

    isNew: function () {
      var column = this.structure.get(this.idAttribute);

      // If this is an non-autoincrement primary key column
      // we check for the original value if it's null
      // NOTE: This not suitable for autoincrement because the field is disabled
      // so the user won't change the value and make it look like it's new or not.
      if (column && column.isPrimaryColumn() && !column.hasAutoIncrement() && this.isTracking()) {
        return this._originalAttributes[this.idAttribute] == null;
      }

      return this.id == null;
    },

    // returns true or false
    isMine: function () {
      var myId = app.user.id,
          magicOwnerColumn = (this.collection != null) ? this.collection.table.get('user_create_column') : null,
          magicOwnerId = this.get(magicOwnerColumn);

      // If magecownerid is model, grab the id instead
      if (magicOwnerId instanceof Backbone.Model) {
        magicOwnerId = magicOwnerId.get('id');
      }

      return myId === magicOwnerId;
    },

    // bigedit trumps write black list
    // bigedit = edit others
    // edit = edit your own
    canEdit: function (attribute) {
      //@TODO: Actually Fix this Issue
      if (!this.collection) {
        return true;
      }

      var iAmTheOwner         = this.isMine(),
          bigeditPermission   = this.collection.hasPermission('bigedit'),
          editPermission      = this.collection.hasPermission('edit'),
          columnIsBlacklisted = !_.isEmpty(attribute) && this.collection.isWriteBlacklisted(attribute),
          isNew               = this.isNew();

      // Can't edit primary key
      if (attribute === this.idAttribute) {
        return false;
      }

      return (isNew && !columnIsBlacklisted)
          || (!iAmTheOwner && bigeditPermission&& !columnIsBlacklisted)
          || (iAmTheOwner && editPermission && !columnIsBlacklisted);
    },

    getWriteFieldBlacklist: function () {
      return this.collection ? this.collection.getWriteFieldBlacklist() : [];
    },

    getReadFieldBlacklist: function () {
      return this.collection ? this.collection.getWriteFieldBlacklist() : [];
    },

    isWriteBlacklisted: function (attribute) {
      return this.collection ? this.collection.isWriteBlacklisted(attribute) : false;
    },

    isReadBlacklisted: function (attribute) {
      return this.collection ? this.collection.isReadBlacklisted(attribute) : false;
    },

    canDelete: function () {
      var iAmTheOwner = this.isMine(),
          canDelete = this.collection.hasPermission('delete'),
          canBigdelete = this.collection.hasPermission('bigdelete');

      return (!iAmTheOwner && canBigdelete) || (iAmTheOwner && canDelete);
    },

    toJSON: function (options, noNest) {
      var attributes = _.clone(this.attributes),
          isModel,
          isCollection;

      options = options || {};

      if (options.changed && !this.isNew()) {
        // NOTE: Use unsavedChanges instead of unsavedAttributes
        // Avoiding the empty object for related values
        attributes = this.unsavedChanges() || this.changed;
        // always include id
        if (this.id) {
          attributes[this.idAttribute] = this.id;
        }
      }

      // expand relations
      for (var key in this.attributes) {
        if (this.attributes.hasOwnProperty(key)) {
          var value = this.attributes[key];

          isModel = (value instanceof Backbone.Model);
          isCollection = (value instanceof Backbone.Collection);

          if (isModel || isCollection) {
            value = value.toJSON(options);

            //@todo keep an eye on why this wasn't serialized before
            //if (_.isEmpty(value)) return;

            attributes[key] = value;
          }
        }
      }

      // Pick selected columns, useful for collection "save"
      if (options && options.columns) {
        attributes = _.pick(attributes, options.columns);
      }

      return attributes;
    },

    getStructure: function () {
      return this.structure;
    },

    getNewInstance: function (options) {
      options = options || {};

      return new EntriesModel({}, _.extend({
        structure: this.structure,
        table: this.table,
        privileges: this.privileges
      }, options));

    },

    getTable: function () {
      return this.table;
    },

    // // gets the table status information, otherwise global information will be used
    // getTableStatuses: function () {
    //   var table = this.getTable();
    //   var tableName = table ? table.id : '*';
    //
    //   return app.statusMapping.get(tableName);
    // },
    //
    // getTableStatusMapping: function () {
    //   var tableStatus = this.getTableStatuses();
    //
    //   return tableStatus.get('mapping');
    // },
    //
    // // gets model status information
    // getStatus: function () {
    //   var statuses = this.getTableStatuses();
    //   var statusValue = this.getStatusValue();
    //
    //   return statuses.get('mapping').get(statusValue);
    // },
    //
    // // gets this model status value
    // getStatusValue: function () {
    //   return this.get(this.getTableStatuses().get('status_name'));
    // },
    //
    // // gets this model status name
    // getStatusName: function () {
    //   return this.getStatus().get('name');
    // },
    //
    // // gets this item status background color
    // getStatusBackgroundColor: function () {
    //   // var statuses = this.getTableStatuses();
    //   // var statusValue = this.getStatusValue();
    //   // var status = statuses.get('mapping').get(statusValue);
    //   var status = this.getStatus();
    //
    //   return status.get('background_color') || status.get('color');
    // },
    //
    // // gets this item status text color
    // getStatusTextColor: function () {
    //   // var statuses = this.getTableStatuses();
    //   // var statusValue = this.getStatusValue();
    //   //
    //   // return statuses.get('mapping').get(statusValue).get('text_color');
    //
    //   return this.getStatus().get('text_color');
    // },

    initialize: function (data, options) {
      this.on('invalid', function(model, errors) {
        var details = _.map(errors, function(err) { return '<b>'+app.capitalize(err.attr)+':</b> '+err.message; }).join('</li><li>');
        var error_id = (this.id)? this.id : 'New';
        details = app.capitalize(this.getTable().id) + ' (' + error_id + ')' + '<hr><ul><li>' + details + '</li></ul>';
        app.trigger('alert:error', 'There seems to be a problem...', details);
      });
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        collection: this.collection,
        table: this.table
      });
    },

    // original start/stop tracking
    _startTracking: Backbone.Model.prototype.startTracking,
    _stopTracking: Backbone.Model.prototype.stopTracking,

    _triggerUnsavedChanges: function () {
      Backbone.Model.prototype._triggerUnsavedChanges.apply(this, arguments);

      var parent = this.parent;
      var parentOriginalValue;

      if (parent && this.parentAttribute) {
        parentOriginalValue = parent._originalAttributes[this.parentAttribute];

        if (_.isEmpty(this._unsavedChanges) || _.isEqual(parentOriginalValue, this._unsavedChanges)) {
          delete parent._unsavedChanges[this.parentAttribute];
        } else {
          parent._unsavedChanges[this.parentAttribute] = this._unsavedChanges;
        }

        parent._triggerUnsavedChanges();
      }
    },

    _resetTracking: function () {
      this._originalAttributes = {};
      Backbone.Model.prototype._resetTracking.apply(this, arguments);

      for (var key in this._originalAttrs) {
        var value;

        if (!this._originalAttrs.hasOwnProperty(key)) {
          continue;
        }

        value = this._originalAttrs[key];

        if (value instanceof Backbone.Model || value instanceof Backbone.Collection) {
          value = value.toJSON();
        }

        this._originalAttributes[key] = value;
      }
    },

    _onTrackingSync: function () {
      this.restartTracking();
    },

    isTracking: function () {
      return this._trackingChanges;
    },

    hasChanges: function (attr) {
      var changes = this._unsavedChanges;
      var hasChanges = false;

      if (attr) {
        hasChanges = !!changes[attr];
      } else {
        hasChanges = !_.isEmpty(changes);
      }

      return hasChanges;
    },

    unsavedAttributes: function () {
      var attributes = Backbone.Model.prototype.unsavedAttributes.apply(this, arguments);
      var unsavedChanges = {};

      this.structure.each(function (column) {
        if (!_.isFunction(this.getInput)) {
          return false;
        }

        var ui = this.getInput(column.getName());
        var change;

        if (ui) {
          change = _.result(ui, 'unsavedChange');

          if (change !== undefined) {
            unsavedChanges[column.getName()] = change;
          }
        }
      }, this);

      if (!_.isEmpty(unsavedChanges)) {
        attributes = _.extend(attributes || {}, unsavedChanges);
      }

      return attributes;
    },

    hasUnsavedAttributes: function () {
      return !!this.unsavedAttributes();
    },

    unsavedChanges: function (options) {
      var changes = _.isEmpty(this._unsavedChanges) ? false : _.clone(this._unsavedChanges);

      options = options || {};

      if (changes && options.includeRelationships !== true) {
        _.each(this.getStructure().getRelationalColumns(), function (column) {
          if (column.isAlias()) {
            delete changes[column.id];
          }
        });
      }

      return changes;
    },

    getChanges: function (includeRelationships) {
      var data = null;

      if (includeRelationships === undefined) {
        includeRelationships = true;
      }

      this.trigger('save:before');

      if (this.isNew()) {
        return data;
      }

      data = this.unsavedChanges({includeRelationships: includeRelationships}) || {};

      this.structure.each(function (column) {
        var attr = column.id;
        var options = column.options;
        var nullable = (options && options.get('allow_null') === true) || column.isNullable();

        if (nullable && data[attr] === '') {
          data[attr] = null;
        }

        if (!includeRelationships && _.has(data, column.id) && column.isRelational()) {
          delete data[column.id];
        }
      }, this);

      return data;
    },

    startTracking: function () {
      this._startTracking();

      _.each(this.attributes, function (value) {
        if (value instanceof EntriesModel) {
          value.startTracking();
        }
      });

      this.on('sync', this._onTrackingSync, this);
    },

    stopTracking: function () {
      this._originalAttributes = {};
      this.disablePrompt();
      this._stopTracking();

      _.each(this.attributes, function (value) {
        if (value instanceof EntriesModel) {
          value.stopTracking();
        }
      });

      this.resetAttributes();
      this.off('sync', this._onTrackingSync, this);
    },

    enablePrompt: function () {
      this.setPrompt(true);
    },

    disablePrompt: function () {
      this.setPrompt(false);
    },

    setPrompt: function (enabled) {
      // TODO: Remove this condition when we completely implement tracking on all interfaces
      if (this.isTracking()) {
        this._unsavedConfig.unloadRouterPrompt = enabled;
        this._unsavedConfig.unloadWindowPrompt = enabled;
      }
    },

    set: function (key, val, options) {
      var attrs, ret;

      if (key == null) return this;
      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Delegate to Backbone's set.
      ret = Backbone.Model.prototype.originalSet.call(this, attrs, options);

      // NOTE: Track changes even when the silent flag has been set
      if (this._trackingChanges) {
        for (key in attrs) {
          // NOTE: this was added to avoid tracking files non-structure column attributes
          if (_.isFunction(this.shouldBeTracked) && !this.shouldBeTracked(key)) {
            continue;
          }

          val = attrs[key];
          // NOTE: This code was inserted by us to support relational attributes
          // not part of TrackIt library original code
          if (val instanceof Backbone.Model || val instanceof Backbone.Collection) {
            val = val.toJSON();
          }

          if (_.isEqual(this._originalAttributes[key], val))
            delete this._unsavedChanges[key];
          else
            this._unsavedChanges[key] = val;
        }
        this._triggerUnsavedChanges();
      }

      return ret;
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

      ModelHelper.setIdAttribute(this);

      EntriesModel.__super__.constructor.call(this, data, options);
    }
  });

  _.extend(EntriesModel.prototype, StatusMixin.Model);
  _.extend(EntriesModel.prototype, SaveItemMixin);
});
