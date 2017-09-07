define([
  'backbone',
  'underscore',
  'handlebars',
  'helpers/ui',
  'core/t'
], function (Backbone, _, Handlebars, UIHelper, __t) {

  var UIComponentsOptions = ['id'];
  var UIComponent = function (options) {
    _.extend(this, _.pick(UIComponentsOptions, options));

    this.options = this.options || this.variables || [];

    if (this.isNumeric() && this.supportsNumber()) {
      this.options.push({
        id: 'footer',
        type: 'Boolean',
        default_value: false,
        ui: 'toggle',
        comment: __t('numeric_footer_comment')
      });
    }
  };

  UIComponent.extend = Backbone.Model.extend;
  _.extend(UIComponent.prototype, Backbone.Events, {
    // Unique UI name
    id: null,
    // Supported Data Types for this UI
    dataTypes: [],
    // UI Options that can be set in Column Settings Page
    // NOTE: undefined to fallback to "variables" property if it doesn't exists
    options: undefined,
    // UI global options. (Directus Settings)
    settings: [],
    // UI Input view (UIView instance)
    Input: null,
    // Get the UI Options
    getOptions: function () {
      return this.options;
    },
    // Returns String That should be used to represent this UI when being listed as part of a table
    // @param options : Object : Contains Options/Attributes for this UI (value, collection [TableCollection], model [EntriesModel], schema, settings)
    list: function(options) {
      return options.value;
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
    },
    isNumeric: function() {
      return this.id === 'numeric';
    },
    supportsNumber: function() {
      return _.some(this.dataTypes, function(type) {
        return UIHelper.supportsNumeric(type);
      });
    }
  });

  return UIComponent;
});
