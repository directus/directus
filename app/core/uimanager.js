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
    var ui = this._getUI(uiId),
        variables = [];

    // Deep Clone variables if they exist
    if (ui.variables !== undefined) {
      variables = JSON.parse(JSON.stringify(ui.variables));
    }

    return variables;
  };

  UIManager.prototype.getAllSettings = function(options) {
    options = options || {};

    var array = _.map(this._uis, function(ui) {
      return {
        id: ui.id,
        variables: ui.variables || [],
        dataTypes: ui.dataTypes || [],
        system: ui.system || false
      };
    });

    if (options.returnObject) {
      var obj = {};

      _.each(array, function(item) {
        obj[item.id] = item;
      });

     return obj;

    }

    return array;
  };

  UIManager.prototype.getInput = function(uiId, columnName, options) {
    var ui = this._getUI(uiId);
    var View = ui.Input;

    if (View === undefined) {
      throw new Error('The UI with id "' + uiId + '" has no input view');
    }

    var column = options.columns.get(columnName);

    var viewOptions = _.extend({
      schema: column,
      settings: column.options,
      structure: options.columns,
      name: columnName,
      value: options.model.get(columnName),
      canWrite: _.has(options.model, 'canEdit') ? options.model.canEdit(columnName) : true
    }, options);

    var view = new View(viewOptions);

    return view;
  };

  UIManager.prototype.getValidator = function() {

  };

  module.exports = UIManager;
});