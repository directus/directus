define(['app', 'underscore', 'backbone', 'core/t'], function(app, _, Backbone, __t) {
  return Backbone.Layout.extend({
    optionsStructure: function() {},

    getAllViewOptions: function(viewId) {
      if (this.state && this.state.malformedOptions) {
        return {};
      }

      var viewOptions = {};
      try {
        viewOptions = JSON.parse(this.collection.preferences.get('list_view_options')) || {};
      } catch (err) {
        viewOptions = {};
        this.state.malformedOptions = true;
        console.error(__t('calendar_has_malformed_options_json'));
      }

      if (viewId) {
        viewOptions = viewOptions[viewId] || {};
      }

      return viewOptions;
    },

    getViewOptions: function(attr) {
      var options = this.getAllViewOptions(this.id);

      return attr ? options[attr] : options;
    },

    enable: function() {
      if (this._isEnabled) {
        return;
      }

      this._isEnabled = true;

      // Right pane options changes
      if (this.baseView) {
        this.baseView.on('rightPane:input:change', this.savePreferences, this);
      }

      this.onEnable();
    },

    onEnable: function() {},

    disable: function() {
      if (!this._isEnabled) {
        return;
      }

      this._isEnabled = false;

      // Right pane options changes
      if (this.baseView) {
        this.baseView.off('rightPane:input:change', this.savePreferences, this);
      }

      this.onDisable();
    },

    onDisable: function() {},

    savePreferences: function(name, value, global) {
      var attributes = {};
      var viewOptions = this.getAllViewOptions();
      var options;
      var viewId = this.id;

      // @TODO: create helper to create value using string key
      // calendar.date_column
      if (global !== true) {
        if (!viewOptions[viewId]) {
          viewOptions[viewId] = {};
        }

        if (!viewOptions[viewId][name]) {
          viewOptions[viewId][name] = {};
        }

        viewOptions[viewId][name] = value;
      } else {
        viewOptions[name] = value;
      }

      attributes['list_view_options'] = JSON.stringify(viewOptions);

      var success = _.bind(function() {
        this.state.malformedOptions = false
      }, this);

      options = {
        wait: false,
        silent: true,
        success: success
      };

      this.collection.preferences.save(attributes, options);
      this.trigger('preferences:updated');
    },

    constructor: function(options) {
      this.baseView = options.baseView;
      this.id = options.id;

      this.state = {
        malformedOptions: false
      };

      Backbone.Layout.prototype.constructor.apply(this, arguments);

      // this.enable();
    }
  });
});
