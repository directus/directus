define(function(require, module, exports) {
  var Backbone = require('backbone');
  var UIComponentsOptions = ['id'];
  var UIComponent = function(options) {
    _.extend(this, _.pick(UIComponentsOptions, options));
  };

  UIComponent.extend = Backbone.Model.extend;
  _.extend(UIComponent.prototype, Backbone.Events, {
    // unique UI name
    id: null,
    // (mysql) database data types that supports
    dataTypes: [],
    // UI Options that can be set in Column Settings Page
    variables: [],
    // UI global options. (Directus Settings)
    settings: [],
    // UI Input view (UIView instance)
    Input: null,
    // value that represents the UI
    list: function(options) {
      return options.value;
    },
    // method called to validate the UI value
    validate: function(value, options) {
      return true;
    },
    // Value used to sort the UI
    sort: function(options) {
      return options.value;
    },
    // compile a handlebars content
    compileView: function(source, data) {
      var template = Handlebars.compile(source);
      data || (data = {});

      return template(data);
    }
  });

  return UIComponent;
});
