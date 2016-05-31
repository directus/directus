define(function(require, exports, module) {

  "use strict";

  // Register Core UI's
  var defaultUis = ([
    require('core/components/textinput'),
    require('core/components/directus_columns'),
    require('core/components/instructions'),
    require('core/components/checkbox'),
    require('core/components/color'),
    require('core/components/numeric'),
    require('core/components/slider'),
    require('core/components/single_file'),
    require('core/components/slug'),
    require('core/components/textarea'),
    require('core/components/directus_user'),
    require('core/components/directus_activity'),
    require('core/components/datetime'),
    require('core/components/date'),
    require('core/components/time'),
    require('core/components/directus_user_activity'),
    require('core/components/directus_user_avatar'),
    require('core/components/directus_file_size'),
    require('core/components/blob'),
    require('core/components/alias'),
    require('core/components/salt'),
    require('core/components/select'),
    require('core/components/tags'),
    require('core/components/many_to_one'),
    require('core/components/radiobuttons'),
    require('core/components/many_to_many'),
    require('core/components/one_to_many'),
    require('core/components/wysiwyg'),
    require('core/components/directus_messages_recipients'),
    require('core/components/password'),
    require('core/components/random'),
    require('core/components/many_to_one_typeahead'),
    require('core/components/enum'),
    require('core/components/multi_select'),
    require('core/components/system'),
    require('core/components/user'),
    require('core/components/directus_file'),
    require('core/components/directus_file_title'),
    require('core/components/map'),
    //require('core/components/markdown'),
    require('core/components/multiple_files'),
    require('core/components/translation'),
    require('core/components/template_chooser')
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

    validSections: ['list', 'value', 'sort'],

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

      var UI = this._getUI(uiId);
      this.parseDefaultValue(UI, model, schema.options);

      return UI;
    },

    // Registers (@todo: one or) many UI's
    register: function(uiArray) {
      // TODO: Should UIs be object instance using new?
      // instead of being instantiate on the define file
      _.each(uiArray, function(ui) {
        uis[ui.id] = ui;
      },this);
    },

    // Get all the settings specified in the UI
    // Do not confused this with UI variables
    // UI Variables is used for each single UI
    // UI Settings is used to add new Settings to Directus
    getDirectusSettings: function() {
      var allUISettings = [];

      _.each(uis, function(ui) {
        if (ui.settings) {
          var settings = _.isArray(ui.settings) ? ui.settings : [ui.settings];
          _.each(settings, function(setting) {
            allUISettings.push(setting);
          });
        }
      });

      return allUISettings;
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

    hasList: function(model, attr) {
      return this.getList(model, attr, true);
    },

    hasValue: function(model, attr) {
      return this.getValue(model, attr, true);
    },

    hasSortValue: function(model, attr) {
      return this.getSortValue(model, attr) || this.getValue(model, attr);
    },

    getUIByModel: function(model, attr, defaultValue) {
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

      if (typeof UI === 'undefined') {
        return false;
      }

      return {
        UI: UI,
        schema: schema
      };
    },

    // Finds the UI for the model/attribute and
    // returns a string containing the table view
    getUIValue: function(section, model, attr, noDefault) {
      var section = _.contains(this.validSections, section) ? section : 'list';
      var defaultValue = '<span class="secondary-info">--</span>';
      // Return true or false whether there's value or not (UI)
      // Instead of returning the default HTML
      // https://github.com/RNGR/Directus/issues/452
      var returnDefaultValue = true === noDefault ? true : false;

      var UIObject = this.getUIByModel(model, attr);
      // If there is no UI, return just text
      if (UIObject == false) {
        var attribute = model.get(attr);
        if (!attribute || attribute === "") {
          if (!defaultValue) {
            return false;
          }
          attribute = defaultValue;
        }
        return attribute;
      }

      var UIOptions = {
        model: model,
        collection: model.collection,
        settings: UIObject.schema.options,
        schema: UIObject.schema,
        value: model.get(attr),
        tagName: 'td'
      };

      var value = _.has(UIObject.UI, section) ? UIObject.UI[section](UIOptions) : UIObject.UI.list(UIOptions);

      if ((!value || value === "") && returnDefaultValue) {
        value = defaultValue;
      }

      return value;
    },

    getSortValue: function(model, attr, noDefault) {
      return this.getUIValue('sort', model, attr, noDefault);
    },

    getValue: function(model, attr, defaultValue) {
      return this.getUIValue('value', model, attr, noDefault);
    },

    getList: function(model, attr, noDefault) {
      return this.getUIValue('list', model, attr, noDefault);
    },

    parseDefaultValue: function(UI, model, settings) {
      if (!_.isArray(UI.variables) || UI.variables.length <= 0) {
        return;
      }

      _.each(UI.variables, function(variable) {
        if (typeof variable.def != 'undefined') {
          if (!settings.defaultAttributes) settings.defaultAttributes = {};
          settings.defaultAttributes[variable.id] = variable.def;
        }
      });

      settings.get = function(attr) {
        var attribute = this.attributes[attr];
        if (this.defaultAttributes && !attribute) {
          var defaultAttribute = this.defaultAttributes[attr];
          if (defaultAttribute) {
            attribute = defaultAttribute;
          }
        }

        return attribute;
      };
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
