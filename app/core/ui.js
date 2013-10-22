define([
  "module",
  "core-ui/textinput",
  "core-ui/directus_columns",
  "core-ui/directus_media",
  "core-ui/checkbox",
  "core-ui/color",
  "core-ui/numeric",
  "core-ui/slider",
  "core-ui/single_media",
  "core-ui/slug",
  "core-ui/textarea",
  //"core-ui/relational",
  'core-ui/directus_user',
  'core-ui/directus_activity',
  'core-ui/datetime',
  'core-ui/date',
  'core-ui/time',
  'core-ui/directus_user_activity',
  'core-ui/directus_user_avatar',
  'core-ui/directus_media_size',
  'core-ui/blob',
  'core-ui/alias',
  'core-ui/salt',
  'core-ui/select',
  'core-ui/tags',
  'core-ui/many_to_one',
  'core-ui/radiobuttons',
  'core-ui/many_to_many',
  'core-ui/one_to_many',
  'core-ui/wysiwyg',
  'core-ui/directus_messages_recepients',
  'core-ui/password'],
function(module, textinput) {

  "use strict";

  var ui = {};

  ui.core = _.values(arguments).slice(1);

  module.exports = ui;

  var Component = function(options) {
    this.model = options.model;
    this.collection = options.collection || this.model.collection;
    this.structure = options.structure || this.structure;
  };

  _.extend(Component.prototype, {

    getInput: function(attr) {
      var schema = this.structure.get(attr);
      var View = _.where(ui.core, {id: schema.get('ui')})[0] || textinput;
      var view = new View.Input({
        model: this.model,
        collection: this.collection,
        settings: schema.options,
        schema: schema,
        structure: this.structure,
        name: attr,
        value: this.model.get(attr),
        canWrite: _.has(this.model, 'canEdit') ? this.model.canEdit(attr) : true
      });
      return view;
    }

  });

  // This is a shorter way to get the list way since
  // It's total overkill to instanciate an object before
  // It's also AB-FAB for templates!
  ui.getList = function(model, attr) {
    var collection = model.collection;
    var structure = model.getStructure();
    var schema = structure.get(attr);
    var View = ui.getModelColumnInput(model, attr);
    return View.list({
        model: model,
        collection: collection,
        settings: schema.options,
        schema: schema,
        value: model.get(attr),
        tagName: 'td'
    });
  };

  ui.getModelColumnInput = function(model, attr) {
    var collection = model.collection;
    var structure = model.getStructure();
    var schema = structure.get(attr);
    var View = _.where(ui.core, {id: schema.get('ui')})[0] || textinput;
    return View;
  };

  ui.validate = function(model, attr, value) {
    var collection = model.collection;
    var structure = model.getStructure();
    var schema = structure.get(attr);
    var View = ui.getModelColumnInput(model, attr);
    if (View.hasOwnProperty('validate')) {
      return View.validate(value, {
        model: model,
        collection: collection,
        settings: schema.options,
        schema: schema,
        tagName: 'td'
      });
    }
  };

  ui.initialize = function(model, options) {
    return new Component(model, options);
  };

  // Return the settings for all UI-components. Usefult for caching.
  ui.settings = function() {
    var settings = {};
    _.each(ui.core, function(ui) {
      //ui.schema = new Backbone.Collection(ui.variables);
      settings[ui.id] = ui;
    });
    return settings;
  };

  ui.perType = function(type) {
    return _.filter(ui.core, function(obj) { return (_.indexOf(obj.dataTypes, type) > -1); });
  };

  //Handlebars helper!
  Handlebars.registerHelper("ui", function(model, attr, options) {
    if (model.isNested) model = model.get('data');
    var html = ui.getList(model, attr) || '';
    return new Handlebars.SafeString(html);
  });

});