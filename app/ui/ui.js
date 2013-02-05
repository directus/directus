define([
  "ui/directus_media",
  "ui/checkbox",
  "ui/numeric",
  "ui/textinput",
  "ui/textarea",
  "ui/relational",
  'ui/directus_user',
  'ui/email',
  'ui/directus_activity',
  'ui/datetime',
  'ui/directus_user_activity',
  'ui/directus_media_size',
  'ui/blob',
  'ui/alias',
  'ui/select',
  'ui/tags'
],

function(directus_media, checkbox, numeric, textinput, textarea, relational, directus_user, email, directus_activity, datetime, directus_user_activity, directus_media_size, blob, alias, select, tags) {

  ui = {};

  ui.core = arguments;

  var Component = function(options) {
    this.model = options.model;
    this.collection = options.collection || this.model.collection;
    this.structure = options.structure || this.collection.structure;
  };

  _.extend(Component.prototype, {

    getList: function(attr) {
      var schema = this.structure.get(attr);
      var View = _.where(ui.core, {id: schema.get('ui')})[0] || textinput;
      var view = View.list({
        model: this.model,
        collection: this.collection,
        settings: schema.options,
        schema: schema,
        value: this.model.has(attr) ? this.model.get(attr) : this.model.id,
        tagName: 'td'
      });
      return view;
    },

    getInput: function(attr) {
      var schema = this.structure.get(attr);
      var View = _.where(ui.core, {id: schema.get('ui')})[0] || textinput;
      var view = new View.Input({
        model: this.model,
        collection: this.collection,
        settings: schema.options,
        schema: schema,
        name: attr,
        value: this.model.get(attr)
      });
      return view;
    }

  });

  // This is a shorter way to get the list way since
  // It's total overkill to instanciate an object before
  // It's also AB-FAB for templates!
  ui.getList = function(model, attr) {
    var collection = model.collection;
    var structure = model.collection.structure;
    var schema = structure.get(attr);
    var View = _.where(ui.core, {id: schema.get('ui')})[0] || textinput;
    return View.list({
        model: model,
        collection: collection,
        settings: schema.options,
        schema: schema,
        value: model.has(attr) ? model.get(attr) : model.id,
        tagName: 'td'
    });
  };

  ui.initialize = function(model, options) {
    return new Component(model, options);
  };

  // Return the settings for all UI-components. Usefult for caching.
  ui.settings = function() {
    var settings = {};
    _.each(ui.core, function(ui) {
      ui.schema = new Backbone.Collection(ui.variables);
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

  return ui;
});