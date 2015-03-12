define(function(require, exports, module) {

  "use strict";

  // Register Core UI's
  var defaultUis = ([
    require('core-ui/textinput'),
    require('core-ui/directus_columns'),
    require('core-ui/instructions'),
    require('core-ui/checkbox'),
    require('core-ui/color'),
    require('core-ui/numeric'),
    require('core-ui/slider'),
    require('core-ui/single_file'),
    require('core-ui/slug'),
    require('core-ui/textarea'),
    require('core-ui/directus_user'),
    require('core-ui/directus_activity'),
    require('core-ui/datetime'),
    require('core-ui/date'),
    require('core-ui/time'),
    require('core-ui/directus_user_activity'),
    require('core-ui/directus_user_avatar'),
    require('core-ui/directus_file_size'),
    require('core-ui/blob'),
    require('core-ui/alias'),
    require('core-ui/salt'),
    require('core-ui/select'),
    require('core-ui/tags'),
    require('core-ui/many_to_one'),
    require('core-ui/radiobuttons'),
    require('core-ui/many_to_many'),
    require('core-ui/one_to_many'),
    require('core-ui/wysiwyg'),
    require('core-ui/directus_messages_recipients'),
    require('core-ui/password'),
    require('core-ui/many_to_one_typeahead'),
    require('core-ui/enum'),
    require('core-ui/multi_select'),
    require('core-ui/system'),
    require('core-ui/user'),
    require('core-ui/directus_file'),
    require('core-ui/directus_file_title'),
    require('core-ui/map'),
    require('core-ui/multiple_files'),
    require('core-ui/translation'),
    require('core-ui/template_chooser')
  ]);

  var jQuery = require('jquery');
  /**
   * @private
   * Holds all UI's that are registered
   */
  var uis = {};

  var app = require('app');

  /**
   * @private
   * Holds all Sytem fields and mapped UI
   */
  var system_fields = {
  };

  // Attach all methods to the UIManager prototype.
  module.exports = {

    setup: function() {
      //Register default UI's
      this.register(defaultUis);
      system_fields[app.statusMapping.status_name] = {'ui':'system'};
    },

    // Get reference to external UI file
    _getUI: function(uiId) {
      var ui = uis[uiId];

      if (ui === undefined) {
        console.warn('There is no registered UI with id "' + uiId + '"');
      }

      return ui;
    },

    _getAllUIs: function() {
      return uis;
    },

    // Returns a reference to a UI based on a
    // model/attribute/schema combination
    _getModelUI: function(model, attr, schema) {
      if (schema === undefined) {
        var structure = model.getStructure();
        schema = structure.get(attr);
      }
      if(schema === undefined) {
        throw "Cannot Find Schema for: '" + attr + "' Check Your Preferences!";
      }
      var uiId = schema.get('ui');

      if(system_fields[attr] !== undefined) {
        uiId = system_fields[attr].ui;
      }

      return this._getUI(uiId);
    },

    // Registers (@todo: one or) many UI's
    register: function(uiArray) {
      _.each(uiArray, function(ui) {
        uis[ui.id] = ui;
      },this);
    },

    // Loads an array of paths to UI's and registers them.
    // Returns a jQuery Deferred's Promise object
    load: function(paths) {
      var self = this;
      var dfd = new jQuery.Deferred();

      require(paths, function() {
        self.register(_.values(arguments));
        dfd.resolve();
      });

      return dfd;
    },

    // Returns `true` if a UI with the provided ID exists
    hasUI: function(uiId) {
      return uis.hasOwnProperty(uiId);
    },

    // Returns all properties and settings of a UI with the provided ID
    getSettings: function(uiId) {
      var ui = this._getUI(uiId);

      var variablesDeepClone = JSON.parse(JSON.stringify(ui.variables || []));
      var sortbyDeepClone = JSON.parse(JSON.stringify(ui.sortBy || []));

      return {
        id: ui.id,
        skipSerializationIfNull: ui.skipSerializationIfNull || false,
        variables: variablesDeepClone,
        dataTypes: ui.dataTypes || [],
        system: ui.system || false,
        sortBy: sortbyDeepClone
      };
    },

    // Returns all properties and settings for all registered UI's
    getAllSettings: function(options) {
      options = options || {};


      var array = _.map(uis, function(ui) {
        return this.getSettings(ui.id);
      }, this);

      // Maps the settings to a key-value datastructure where
      // the key is the id of the UI.
      if (options.returnObject) {
        var obj = {};

        _.each(array, function(item) {
          obj[item.id] = item;
        });

       return obj;
      }

      return array;
    },

    // Finds the UI for the model/attribute and
    // returns a string containing the table view
    getList: function(model, attr) {
      var collection = model.collection;
      // @TODO: we need to make this getStructure available to our base model
      var structure;
      if (typeof model.getStructure === 'function') {
        structure = model.getStructure();
      } else {
        structure = this.structure || undefined;
      }
      var UI;
      if (structure !== undefined) {
        var schema = structure.get(attr);
        UI = schema ? this._getModelUI(model, attr, schema) : undefined;
      }

      // If there is no UI, return just text
      if (UI === undefined) {
        var attribute = model.get(attr);
        if(!attribute || attribute === "") {
          attribute = '<span class="secondary-info">--</span>';
        }
        return attribute;
      }

      var list = UI.list({
          model: model,
          collection: collection,
          settings: schema.options,
          schema: schema,
          value: model.get(attr),
          tagName: 'td'
      });

      if(!list || list === "") {
        list = '<span class="secondary-info">--</span>';
      }

      return list;
    },

    // Finds the UI for the provided model/attribute and
    // returns a backbone view instance containing the input view
    getInputInstance: function(model, attr, options) {
      options.model = model;
      options.name = attr;
      options.structure = options.structure || options.model.getStructure();
      options.schema = options.structure.get(options.name);
      options.value = options.model.get(options.name);
      options.collection = options.collection || options.model.collection;
      options.canWrite = typeof options.model.canEdit === 'function' ? options.model.canEdit(attr) : true;
      options.settings = options.schema.options;


      var UI = this._getModelUI(model, attr, options.schema);
      if (UI.Input === undefined) {
        throw new Error('The UI with id "' + UI.id + '" has no input view');
      }

      var view = new UI.Input(options);

      return view;
    },

    // Finds the UI for the provided model/attribute and
    // and returns the result of the UI validation
    validate: function(model, attr, value) {
      var collection = model.collection;
      var structure = model.getStructure();
      var schema = structure.get(attr);
      var UI = this._getModelUI(model, attr, schema);

      if (UI.hasOwnProperty('validate')) {
        return UI.validate(value, {
          model: model,
          collection: collection,
          settings: schema.options,
          schema: schema,
          tagName: 'td'
        });
      }
    }

  };

});