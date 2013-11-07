define(function(require, exports, module) {

  "use strict";

  // Register Core UI's
  var defaultUis = ([
    require('core-ui/textinput'),
    require('core-ui/directus_columns'),
    require('core-ui/directus_media'),
    require('core-ui/checkbox'),
    require('core-ui/color'),
    require('core-ui/numeric'),
    require('core-ui/slider'),
    require('core-ui/single_media'),
    require('core-ui/slug'),
    require('core-ui/textarea'),
    require('core-ui/directus_user'),
    require('core-ui/directus_activity'),
    require('core-ui/datetime'),
    require('core-ui/date'),
    require('core-ui/time'),
    require('core-ui/directus_user_activity'),
    require('core-ui/directus_user_avatar'),
    require('core-ui/directus_media_size'),
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
    require('core-ui/directus_messages_recepients'),
    require('core-ui/password')
  ]);

  var UIManager = function UI(options) {
    this._uis = {};
    this.register(defaultUis);
  };

  // Registers one or many UI's
  UIManager.prototype.register = function(uis) {
    _.each(uis, function(ui) {
      this._uis[ui.id] = ui;
    },this);
  };

  UIManager.prototype._getUI = function(uiId) {
    var ui = this._uis[uiId];

    if (ui === undefined) {
      throw new Error('There is no registered UI with id "' + uiId + '"');
    }

    return ui;
  };

  UIManager.prototype.getList = function() {

  };

  UIManager.prototype.hasUI = function(uiId) {
    return this._uis.hasOwnProperty(uiId);
  };

  UIManager.prototype.getSettings = function(uiId) {
    var ui = this._getUI(uiId);

    var variablesDeepClone = JSON.parse(JSON.stringify(ui.variables || []));

    return {
      id: ui.id,
      skipSerializationIfNull: ui.skipSerializationIfNull || false,
      variables: variablesDeepClone,
      dataTypes: ui.dataTypes || [],
      system: ui.system || false
    };
  };

  UIManager.prototype.getAllSettings = function(options) {
    options = options || {};


    var array = _.map(this._uis, function(ui) {
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
  };

  UIManager.prototype.getInputInstance = function(options) {
    options.structure = options.structure || options.model.getStructure();
    options.schema = options.structure.get(options.name);
    options.value = options.model.get(options.name);
    options.collection = options.collection || options.model.collection;
    options.canWrite = _.has(options.model, 'canEdit') ? options.model.canEdit(columnName) : true;
    options.settings = options.schema.options;

    var uiId = options.schema.get('ui');
    var UI = this._getUI(uiId);

    if (UI.Input === undefined) {
      throw new Error('The UI with id "' + uiId + '" has no input view');
    }

    var view = new UI.Input(options);

    return view;
  };

  UIManager.prototype.validate = function(model, attr, value) {
    var collection = model.collection;
    var structure = model.getStructure();
    var schema = structure.get(attr);
    var uiId = schema.get('ui');
    var UI = this._getUI(uiId);

    if (UI.hasOwnProperty('validate')) {
      return UI.validate(value, {
        model: model,
        collection: collection,
        settings: schema.options,
        schema: schema,
        tagName: 'td'
      });
    }

  };

  module.exports = UIManager;
});