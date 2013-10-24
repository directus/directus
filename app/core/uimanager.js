define(function(require, exports, module) {

  "use strict";

  var UI = function UI(options) {
    this._uis = {};
  };

  // Registers one or many UI's
  UI.prototype.register = function(uis) {
    _.each(uis, function(ui) {
      this._uis[ui.id] = ui;
    },this);
  }

  UI.prototype._getUI = function(uiId) {
    var ui = this._uis[uiId];

    if (ui === undefined) {
      throw new Error('There is no registered UI with id "' + uiId + '"');
    }

    return ui;
  }

  UI.prototype.getList = function() {

  }

  UI.prototype.hasUI = function(uiId) {
    return this._uis.hasOwnProperty(uiId);
  }

  UI.prototype.getSettings = function(uiId) {
    var ui = this._getUI(uiId),
        variables = [];

    // Deep Clone variables if they exist
    if (ui.variables !== undefined) {
      variables = JSON.parse(JSON.stringify(ui.variables));
    }

    return variables;
  }

  UI.prototype.getAllSettings = function() {
    return _.map(this._uis, function(ui) {
      return {id: ui.id, settings: ui.variables || []};
    });
  }

  UI.prototype.getInput = function(uiId, columnName, options) {
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
      canWrite: _.has(options.model, 'canEdit') ? options.model.canEdit(attr) : true
    }, options);

    var view = new View(viewOptions);

    return view;
  }

  UI.prototype.getValidator = function() {

  }

  module.exports = UI;
});