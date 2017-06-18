define(function (require, exports, module) {
  'use strict';

  var _ = require('underscore');
  var Utils = require('utils');

  var interfaceGroup = function (name) {
    return function (ui) {
      ui.group = name;

      return ui;
    };
  };

  var internalInterfaces = [
    require('core/interfaces/_system/accountability/interface'),
    require('core/interfaces/_internals/activity/component'),
    require('core/interfaces/_internals/columns_picker/component'),
    require('core/interfaces/_internals/columns/component'),
    require('core/interfaces/_internals/directus_users/component'),
    require('core/interfaces/_internals/file_preview/component'),
    require('core/interfaces/_internals/file_title/component'),
    require('core/interfaces/_internals/file_size/component'),
    require('core/interfaces/_internals/permissions/component'),
    require('core/interfaces/_internals/messages_recipients/component'),
    require('core/interfaces/_internals/views/component'),
    require('core/interfaces/_internals/user_avatar/component'),
    require('core/interfaces/_internals/user_activity/component')
  ].map(interfaceGroup('internal'));

  /**
   * @private
   *
   * Holds all system interfaces
   */
  var systemInterfaces = [
    require('core/interfaces/_system/primary_key/component'),
    require('core/interfaces/_system/sort/component'),
    require('core/interfaces/_system/status/component'),
    require('core/interfaces/_system/accountability/date_created'),
    require('core/interfaces/_system/accountability/date_modified'),
    require('core/interfaces/_system/accountability/user_created'),
    require('core/interfaces/_system/accountability/user_modified')
  ].map(interfaceGroup('system'));

  var StringInterfaces = [
    require('core/interfaces/textinput/component'),
    require('core/interfaces/slug/component'),
    require('core/interfaces/textarea/component'),
    require('core/interfaces/json/component'),
    require('core/interfaces/random/component'),
    require('core/interfaces/blob/component'),
    require('core/interfaces/select_list/component'),
    require('core/interfaces/select_list_multiple/component'),
    require('core/interfaces/dropdown/component'),
    require('core/interfaces/dropdown_multiple/component'),
    require('core/interfaces/tags/component'),
    require('core/interfaces/wysiwyg/component'),
    require('core/interfaces/wysiwyg_full/component'),
    require('core/interfaces/password/component'),
    require('core/interfaces/dropdown_enum/component'),
    require('core/interfaces/map/component'),
    require('core/interfaces/markdown/component')
  ].map(interfaceGroup('string'));

  var DateTimeInterfaces = [
    require('core/interfaces/datetime/datetime'),
    require('core/interfaces/datetime/date'),
    require('core/interfaces/datetime/time')
  ].map(interfaceGroup('date_and_time'));

  var NumericInterfaces = [
    require('core/interfaces/color/component'),
    require('core/interfaces/numeric/component'),
    require('core/interfaces/slider/component'),
    require('core/interfaces/toggle/component')
  ].map(interfaceGroup('numeric'));

  var RelationalInterfaces = [
    require('core/interfaces/many_to_one_typeahead/component'),
    require('core/interfaces/many_to_one/component'),
    require('core/interfaces/relational/m2m/component'),
    require('core/interfaces/one_to_many/component'),
    require('core/interfaces/single_file/component'),
    require('core/interfaces/multiple_files/relational/component'),
    require('core/interfaces/multiple_files/csv/component'),
    require('core/interfaces/translation/component')
  ].map(interfaceGroup('relational'));

  var MiscInterfaces = [
    require('core/interfaces/section_break/component'),
    require('core/interfaces/user/interface'),
    require('core/interfaces/user')
  ].map(interfaceGroup('misc'));

  // Register Core UI's
  var defaultInterfaces = []
    .concat(StringInterfaces, NumericInterfaces, DateTimeInterfaces, RelationalInterfaces, MiscInterfaces);

  var jQuery = require('jquery');
  /**
   * @private
   * Holds all UI's that are registered
   */
  var uis = {};

  var app = require('app');

  var castType = function (type, value) {
    if (typeof value === 'undefined') {
      return value;
    }
    switch (type) {
      // '0', 0 and false should be false
      case 'Boolean': return value != false;
      case 'Number': return Number(value);
      case 'String': return String(value);
      default: return value;
    }
  };

  // Attach all methods to the UIManager prototype.
  module.exports = {

    validSections: ['list', 'value', 'sort'],

    setup: function () {
      // Register default UI's
      this.register(defaultInterfaces);
      this.register(systemInterfaces, true);
      this.register(internalInterfaces);
    },

    // Get reference to external UI file
    _getUI: function (uiId) {
      var ui = uis[uiId];

      if (ui === undefined) {
        console.warn('There is no registered UI with id "' + uiId + '"');
      }

      return ui;
    },

    _getAllUIs: function () {
      return uis;
    },

    getAllUIsGrouped: function (ids) {
      var list = {};
      var allUIs = _.clone(uis);
      var filter = ids && ids.length > 0;

      _.each(allUIs, function (ui) {
        if (filter && ids.indexOf(ui.id) < 0) {
          return false;
        }

        if (list[ui.group] === undefined) {
          list[ui.group] = [];
        }

        list[ui.group].push(ui);
      });

      _.each(list, function (group, name) {
        list[name] = _.sortBy(group, function (ui) {
          return ui.id;
        });
      });

      return list;
    },

    // Returns a reference to a UI based on a
    // model/attribute/schema combination
    _getModelUI: function (model, attr, schema) {
      if (schema === undefined) {
        var structure = model.getStructure();
        schema = structure.get(attr);
      }
      if (schema === undefined) {
        throw 'Cannot Find Schema for: \'' + attr + '\' Check Your Preferences!';
      }
      var uiId = schema.get('ui');

      var UI = this._getUI(uiId);

      if (!UI) {
        throw 'Could not find Interface "' + uiId + '"';
      }

      this.parseDefaultValue(UI, model, schema.options);

      return UI;
    },

    // Registers (@todo: one or) many UI's
    register: function (uiArray) {
      if (!_.isArray(uiArray)) {
        uiArray = [uiArray];
      }

      _.each(uiArray, function (ui) {
        try {
          var uiInstance = new ui();
          uis[uiInstance.id] = uiInstance;
          uis[uiInstance.id].group = ui.group || 'custom';
          uis[uiInstance.id].isSystem = ui.group === 'system';
          uis[uiInstance.id].isInternal = ui.group === 'internal';
        } catch (ex) {
          console.warn(ex.message);
        }
      }, this);
    },

    isSystem: function (uiId) {
      var ui = uis[uiId];

      return (ui && ui.isSystem);
    },

    // Get all the settings specified in the UI
    // Do not confused this with UI variables
    // UI Variables is used for each single UI
    // UI Settings is used to add new Settings to Directus
    getDirectusSettings: function () {
      var allUISettings = [];

      _.each(uis, function (ui) {
        if (ui.settings) {
          var settings = _.isArray(ui.settings) ? ui.settings : [ui.settings];
          _.each(settings, function (setting) {
            allUISettings.push(setting);
          });
        }
      });

      return allUISettings;
    },

    // Loads an array of paths to UI's and registers them.
    // Returns a jQuery Deferred's Promise object
    load: function (paths) {
      var self = this;
      var dfd = new jQuery.Deferred();

      require(paths, function () {
        self.register(_.values(arguments));
        dfd.resolve();
      });

      return dfd;
    },

    // Returns `true` if a UI with the provided ID exists
    hasUI: function (uiId) {
      return uis.hasOwnProperty(uiId);
    },

    // Returns all properties and settings of a UI with the provided ID
    getSettings: function (uiId) {
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
    getAllSettings: function (options) {
      options = options || {};

      var array = _.map(uis, function (ui) {
        return this.getSettings(ui.id);
      }, this);

      // Maps the settings to a key-value datastructure where
      // the key is the id of the UI.
      if (options.returnObject) {
        var obj = {};

        _.each(array, function (item) {
          obj[item.id] = item;
        });

        return obj;
      }

      return array;
    },

    hasList: function (model, attr) {
      return this.getList(model, attr, true);
    },

    hasValue: function (model, attr) {
      return this.getValue(model, attr, true);
    },

    hasSortValue: function (model, attr) {
      return this.getSortValue(model, attr) || this.getValue(model, attr);
    },

    getUIByModel: function (model, attr, defaultValue) {
      // @TODO: we need to make this getStructure available to our base model
      var structure;
      if (typeof model.getStructure === 'function') {
        structure = model.getStructure();
      } else {
        structure = model.structure || undefined;
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
    getUIValue: function (section, model, attr, noDefault) {
      var section = _.contains(this.validSections, section) ? section : 'list';
      var defaultValue = '<span class="no-value">--</span>';
      // Return true or false whether there's value or not (UI)
      // Instead of returning the default HTML
      // https://github.com/RNGR/Directus/issues/452
      var returnDefaultValue = noDefault === true;

      var UIObject = this.getUIByModel(model, attr);
      // If there is no UI, return just text
      if (UIObject === false) {
        var attribute = model.get(attr);
        if (!attribute || attribute === '') {
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

      // Section is the name of a method that represents an value.
      // list: represents the value that will be shown on a list.
      var section = UIObject.UI[section] !== null ? section : 'list';
      this.triggerBeforeValue(section, UIObject.UI, UIOptions);
      var value = UIObject.UI[section](UIOptions);
      this.triggerAfterValue(section, UIObject.UI, UIOptions);

      if (Utils.isNothing(value) && returnDefaultValue) {
        value = defaultValue;
      }

      return value;
    },

    getSortValue: function (model, attr, noDefault) {
      return this.getUIValue('sort', model, attr, noDefault);
    },

    getValue: function (model, attr, defaultValue) {
      return this.getUIValue('value', model, attr, noDefault);
    },

    getList: function (model, attr, noDefault) {
      return this.getUIValue('list', model, attr, noDefault);
    },

    getRequiredOptions: function (uiId) {
      var UI = this._getUI(uiId);
      var options = [];

      if (!_.isArray(UI.variables) || UI.variables.length <= 0) {
        return [];
      }

      _.each(UI.variables, function (option) {
        if (option.required === true) {
          options.push(option.id);
        }
      });

      return options;
    },

    parseDefaultValue: function (UI, model, settings) {
      if (!_.isArray(UI.variables) || UI.variables.length <= 0) {
        return;
      }

      if (!settings.defaultAttributes) {
        settings.defaultAttributes = {};
      }
      if (!settings.attributeTypes) {
        settings.attributeTypes = {};
      }

      _.each(UI.variables, function (variable) {
        if (typeof variable.default_value !== 'undefined') {
          settings.defaultAttributes[variable.id] = variable.default_value;
        }
        settings.attributeTypes[variable.id] = variable.type;
      });

      settings.get = function (attr) {
        var attribute = this.attributes[attr];
        if (this.defaultAttributes && attribute === undefined) {
          var defaultAttribute = this.defaultAttributes[attr];
          // Falsy values are accepted as default values
          // excepted undefined (#1256)
          if (defaultAttribute !== undefined) {
            attribute = defaultAttribute;
          }
        }

        return castType(this.attributeTypes[attr], attribute);
      };
    },

    // Finds the UI for the provided model/attribute and
    // returns a backbone view instance containing the input view
    getInputInstance: function (model, attr, options) {
      options.model = model;
      options.name = attr;
      options.structure = options.structure || options.model.getStructure();
      options.schema = options.structure.get(options.name);
      options.settings = options.schema.options;
      options.value = options.model.get(options.name) || options.schema.get('default_value');
      options.collection = options.collection || options.model.collection;

      if (options.canWrite === undefined) {
        options.canWrite = typeof options.model.canEdit === 'function' ? options.model.canEdit(attr) : true;
      }

      var UI = this._getModelUI(model, attr, options.schema);
      if (UI.Input === undefined) {
        throw new Error('The UI with id "' + UI.id + '" has no input view');
      }

      this.triggerBeforeCreateInput(UI, options);
      var view = new UI.Input(options);
      this.triggerAfterCreateInput(UI, options);

      return view;
    },

    // Finds the UI for the provided model/attribute and
    // and returns the result of the UI validation
    validate: function (model, attr, value) {
      var collection = model.collection;
      var structure = model.getStructure();
      var schema = structure.get(attr);
      var UI = this._getModelUI(model, attr, schema);

      if (UI.validate) {
        return UI.validate(value, {
          view: model.getInput ? model.getInput(attr) : undefined,
          model: model,
          collection: collection,
          settings: schema.options,
          schema: schema,
          // @TODO: Do we need this?
          tagName: 'td'
        });
      }
    },
    triggerEvent: function (eventName, UI, options) {
      var events = this.constructEventNames(eventName, UI, options);
      var args = Array.prototype.slice.call(arguments, 2);
      var appEvents = events.map(function (name) {
        return 'UI:' + name;
      });

      UI.trigger.call(UI, events.join(' '), UI, options);
      app.trigger.call(app, events.join(' '), UI, options);
    },

    constructEventNames: function (eventName, UI, options) {
      var structure = options.structure || options.collection.structure;
      var appendNames = [
        '',
        ':' + UI.id
      ];

      if (structure.table && structure.table.id) {
        var tableName = (structure.table.isFake ? 'fake:' : '') + structure.table.id;
        appendNames = appendNames.concat([
          ':' + tableName + ':' + UI.id,
          ':' + tableName + ':' + options.schema.id,
          ':' + tableName + ':' + options.schema.id + ':' + UI.id
        ]);
      }

      return appendNames.map(function (name) {
        return eventName + name;
      });
    },

    triggerBeforeCreateInput: function (UI, options) {
      return this.triggerEvent('beforeCreateInput', UI, options);
    },

    triggerAfterCreateInput: function (UI, options) {
      return this.triggerEvent('afterCreateInput', UI, options);
    },

    triggerBeforeValue: function (section, UI, options) {
      this.triggerEvent('beforeValue', UI, options);
      this.triggerEvent('beforeValue:' + section, UI, options);
    },

    triggerAfterValue: function (section, UI, options) {
      this.triggerEvent('afterValue', UI, options);
      this.triggerEvent('afterValue:' + section, UI, options);
    }
  };
});
