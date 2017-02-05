define(['app', 'backbone'], function(app, Backbone) {
  return Backbone.Layout.extend({
    optionsStructure: function() {},

    getAllViewOptions: function(viewId) {
      if (this.state && this.state.malformedOptions) {
        return {};
      }

      var viewOptions = this.collection.preferences.get('list_view_options');
      if (viewOptions) {
        try {
          viewOptions = JSON.parse(viewOptions);
        } catch (err) {
          viewOptions = {};
          this.state.malformedOptions = true;
          console.error(__t('calendar_has_malformed_options_json'));
        }
      }

      if (viewId) {
        viewOptions = viewOptions[viewId] || {};
      }

      return viewOptions;
    },

    getViewOptions: function() {
      return this.getAllViewOptions(this.id);
    },

    enable: function() {},

    disable: function() {},

    constructor: function(options) {
      this.baseView = options.baseView;
      this.id = options.id;

      this.state = {
        malformedOptions: false
      };

      Backbone.Layout.prototype.constructor.apply(this, arguments);

      this.enable();
    }
  });
});
