define(function (require, exports, module) {
  'use strict';

  var _ = require('underscore');
  var __t = require('core/t');
  var Utils = require('utils');
  // holds all the warned interfaces
  // to prevent tons of warning on the same interface
  var missingInterfacesWarned = {};

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
    require('core/interfaces/_internals/comments_count/component'),
    require('core/interfaces/_internals/directus_users/component'),
    require('core/interfaces/_internals/file_preview/component'),
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
    require('core/interfaces/_system/accountability/user_modified'),
    require('core/interfaces/user/component')
  ].map(interfaceGroup('system'));

  var StringInterfaces = [
    require('core/interfaces/text_input/component'),
    require('core/interfaces/slug/component'),
    require('core/interfaces/textarea/component'),
    require('core/interfaces/json/component'),
    require('core/interfaces/random/component'),
    require('core/interfaces/blob/component'),
    require('core/interfaces/radio_buttons/component'),
    require('core/interfaces/checkboxes/component'),
    require('core/interfaces/dropdown/component'),
    require('core/interfaces/dropdown_multiselect/component'),
    require('core/interfaces/tags/component'),
    require('core/interfaces/wysiwyg/component'),
    require('core/interfaces/wysiwyg_full/component'),
    require('core/interfaces/password/component'),
    require('core/interfaces/encrypted/component'),
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
    require('core/interfaces/section_break/component')
  ].map(interfaceGroup('misc'));

  // Directus Core Interfaces
  var coreInterfaces = []
    .concat(StringInterfaces, NumericInterfaces, DateTimeInterfaces, RelationalInterfaces, MiscInterfaces);

  var jQuery = require('jquery');

  /**
   * @private
   * Holds all UI's that are registered
   */
  var interfaces = {};

  /**
   * Holds the default interface by date type
   *
   * @private
   */
  var defaultInterfaces = {};
  var defaultInterfaceName = 'text_input';

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
      this.register(coreInterfaces);
      this.register(systemInterfaces);
      this.register(internalInterfaces);
    },

    setDefaultInterfaces: function (map) {
      defaultInterfaces = map;
    },

    getDefaultInterface: function (type) {
      return defaultInterfaces[type] || defaultInterfaces[defaultInterfaceName];
    },

    // @deprecated since 6.4.3
    _getUI: function (interfaceId) {
      return this._getInterface(interfaceId)
    },

    // Get reference to external UI file
    _getInterface: function (interfaceId) {
      var ui = interfaces[interfaceId];

      if (ui === undefined) {
        console.warn('There is no registered UI with id "' + interfaceId + '"');
      }

      return ui;
    },

    // @deprecated since 6.4.3
    _getAllUIs: function () {
      return this._getAllInterfaces();
    },

    _getAllInterfaces: function () {
      return interfaces;
    },

    // @deprecated since 6.4.3
    getAllUIsGrouped: function (ids) {
      return this.getAllInterfacesGrouped(ids);
    },

    getAllInterfacesGrouped: function (ids) {
      var list = {};
      var allInterfaces = _.clone(interfaces);
      var filter = ids && ids.length > 0;

      _.each(allInterfaces, function (ui) {
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

    // @deprecated since 6.4.3
    _getModelUI: function (model, attr, schema) {
      return this._getModelInterface(model, attr, schema);
    },

    // Returns a reference to a interface
    // based on a model/attribute/schema combination
    _getModelInterface: function (model, attr, schema) {
      if (schema === undefined) {
        schema = model.getStructure().get(attr);
      }

      if (schema === undefined) {
        throw 'Cannot Find Schema for: \'' + attr + '\' Check Your Preferences!';
      }

      var interfaceId = schema.get('ui');
      var UI = this._getInterface(interfaceId);

      if (!UI) {
        if (!missingInterfacesWarned[interfaceId]) {
          missingInterfacesWarned[interfaceId] = true;
          app.trigger('alert:warning', __t('warning_missing_interface_x', {name: interfaceId}));
        }

        UI = this._getInterface(this.getDefaultInterface(schema.get('type')));
      }

      if (UI) {
        this.parseDefaultValue(UI, model, schema.options);
      }

      return UI;
    },

    // Registers one or many Interfaces
    register: function (interfaceList) {
      if (!_.isArray(interfaceList)) {
        interfaceList = [interfaceList];
      }

      _.each(interfaceList, function (ui) {
        try {
          var uiInstance = new ui();
          interfaces[uiInstance.id] = uiInstance;
          interfaces[uiInstance.id].group = ui.group || 'custom';
          interfaces[uiInstance.id].isSystem = ui.group === 'system';
          interfaces[uiInstance.id].isInternal = ui.group === 'internal';
        } catch (ex) {
          console.warn(ex.message);
        }
      }, this);
    },

    isSystem: function (interfaceId) {
      var ui = this._getInterface(interfaceId);

      return (ui && ui.isSystem);
    },

    hasOptions: function (interfaceId) {
      var ui = this._getInterface(interfaceId);

      return ui && (ui.getOptions() || []).length > 0;
    },

    shouldForceUIValidation: function (interfaceId) {
      var ui = this._getInterface(interfaceId);

      return ui && ui.forceUIValidation === true;
    },

    // Get all the settings specified in the Interface
    // Do not confused this with Interface variables
    // Interface Variables is used for each single Interface
    // Interface Settings is used to add new Settings to Directus
    getDirectusSettings: function () {
      var allInterfaceSettings = [];

      _.each(interfaces, function (ui) {
        if (ui.settings) {
          var settings = _.isArray(ui.settings) ? ui.settings : [ui.settings];
          _.each(settings, function (setting) {
            allInterfaceSettings.push(setting);
          });
        }
      });

      return allInterfaceSettings;
    },

    // Loads and register an array of interfaces paths
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

    // Returns `true` if a Interface with the provided ID exists
    // @deprecated since 6.4.3
    hasUI: function (interfaceId) {
      return this.hasInterface(interfaceId);
    },

    // Returns `true` if a Interface with the provided ID exists
    hasInterface: function (interfaceId) {
      return interfaces.hasOwnProperty(interfaceId);
    },

    // Returns all properties and settings of a Interface with the provided ID
    getSettings: function (interfaceId) {
      var ui = this._getInterface(interfaceId);
      var variablesDeepClone = [];
      var sortbyDeepClone = [];
      var skipSerializationIfNull = false;
      var dataTypes = [];
      var system = false;

      if (ui) {
        variablesDeepClone = JSON.parse(JSON.stringify(ui.getOptions() || []));
        sortbyDeepClone = JSON.parse(JSON.stringify(ui.sortBy || []));
        skipSerializationIfNull = ui.skipSerializationIfNull || false;
        dataTypes = ui.dataTypes || [];
        system = ui.system || false;
      }

      return {
        id: interfaceId,
        skipSerializationIfNull: skipSerializationIfNull,
        variables: variablesDeepClone,
        dataTypes: dataTypes,
        system: system,
        sortBy: sortbyDeepClone
      };
    },

    // Returns all properties and settings for all registered interfaces
    getAllSettings: function (options) {
      options = options || {};

      var settings = _.map(interfaces, function (ui) {
        return this.getSettings(ui.id);
      }, this);

      // Maps the settings to a key-value data structure where
      // the key is the id of the Interface.
      if (options.returnObject) {
        var obj = {};

        _.each(settings, function (item) {
          obj[item.id] = item;
        });

        return obj;
      }

      return settings;
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

    // @deprecated since 6.4.3
    getUIByModel: function (model, attr, defaultValue) {
      return this.getInterfaceByModel(model, attr, defaultValue);
    },

    getInterfaceByModel: function (model, attr, defaultValue) {
      // TODO: we need to make this getStructure available to our base model
      var structure;
      var UI;

      if (typeof model.getStructure === 'function') {
        structure = model.getStructure();
      } else {
        structure = model.structure || undefined;
      }

      if (structure !== undefined) {
        var schema = structure.get(attr);
        UI = schema ? this._getModelInterface(model, attr, schema) : undefined;
      }

      if (typeof UI === 'undefined') {
        return false;
      }

      return {
        UI: UI,
        schema: schema
      };
    },

    // @deprecated since 6.4.3
    getUIValue: function (section, model, attr, noDefault) {
      return this.getInterfaceValue(section, model, attr, noDefault);
    },

    // Finds the Interface for the model/attribute and
    // returns a string containing the table view
    getInterfaceValue: function (section, model, attr, noDefault) {
      var section = _.contains(this.validSections, section) ? section : 'list';
      var defaultValue = '<span class="no-value">--</span>';
      // Return true or false whether there's value or not (UI)
      // Instead of returning the default HTML
      // https://github.com/RNGR/Directus/issues/452
      var returnDefaultValue = noDefault === true;

      var InterfaceObject = this.getInterfaceByModel(model, attr);
      // If there is no UI, return just text
      if (InterfaceObject === false) {
        var attribute = model.get(attr);
        if (!attribute || attribute === '') {
          if (!defaultValue) {
            return false;
          }
          attribute = defaultValue;
        }
        return attribute;
      }

      var InterfaceOptions = {
        model: model,
        collection: model.collection,
        settings: InterfaceObject.schema.options,
        schema: InterfaceObject.schema,
        value: model.get(attr),
        tagName: 'td'
      };

      // Section is the name of a method that represents an value.
      // list: represents the value that will be shown on a list.
      section = InterfaceObject.UI[section] !== null ? section : 'list';
      this.triggerBeforeValue(section, InterfaceObject.UI, InterfaceOptions);
      var value = InterfaceObject.UI[section](InterfaceOptions);
      this.triggerAfterValue(section, InterfaceObject.UI, InterfaceOptions);

      if (Utils.isNothing(value) && returnDefaultValue) {
        value = defaultValue;
      }

      return value;
    },

    getSortValue: function (model, attr, noDefault) {
      return this.getInterfaceValue('sort', model, attr, noDefault);
    },

    getValue: function (model, attr, defaultValue) {
      return this.getInterfaceValue('value', model, attr, noDefault);
    },

    getList: function (model, attr, noDefault) {
      return this.getInterfaceValue('list', model, attr, noDefault);
    },

    getRequiredOptions: function (interfaceId, includeDefault) {
      var UI = this._getInterface(interfaceId);
      var options = [];

      if (!UI || !_.isArray(UI.getOptions()) || UI.getOptions().length <= 0) {
        return [];
      }

      _.each(UI.getOptions(), function (option) {
        if (includeDefault !== true && Utils.isSomething(option.default_value)) {
          return false;
        }

        if (option.required === true) {
          options.push(option.id);
        }
      });

      return options;
    },

    parseDefaultValue: function (UI, model, settings) {
      if (!_.isArray(UI.getOptions()) || UI.getOptions().length <= 0) {
        return;
      }

      if (!settings.defaultAttributes) {
        settings.defaultAttributes = {};
      }
      if (!settings.attributeTypes) {
        settings.attributeTypes = {};
      }

      _.each(UI.getOptions(), function (variable) {
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
      options.collection = options.collection || options.model.collection;
      options.value = options.model.get(options.name);
      // NOTE: we must let each interface get their default value
      // this prevent the confusion of whether is the actual value OR the default value
      options.default_value = options.schema.get('default_value');

      if (options.canWrite === undefined) {
        options.canWrite = typeof options.model.canEdit === 'function' ? options.model.canEdit(attr) : true;
      }

      var UI = this._getModelInterface(model, attr, options.schema);
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
      var UI = this._getModelInterface(model, attr, schema);

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
