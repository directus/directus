define(['app', 'underscore', 'backbone', 'core/t'], function(app, _, Backbone, __t) {
  return Backbone.Layout.extend({

    // default view options
    defaultOptions: {},

    optionsStructure: function () {},

    getAllViewOptions: function (viewId) {
      var defaultOptions = this.defaultOptions || {};
      var viewOptions = this.collection.preferences.get('list_view_options');

      if (!viewOptions || (this.state && this.state.malformedOptions)) {
        return defaultOptions;
      }

      try {
        viewOptions = JSON.parse(viewOptions) || {};
      } catch (err) {
        viewOptions = {};
        this.state.malformedOptions = true;
        console.error(__t('view_has_malformed_options_json'));
      }

      if (viewId) {
        viewOptions = viewOptions[viewId] || {};
      }

      return _.extend(defaultOptions, viewOptions);
    },

    getViewOptions: function (attr) {
      var options = this.getAllViewOptions(this.options.id);

      return attr ? options[attr] : options;
    },

    enable: function () {
      if (this._isEnabled) {
        return;
      }

      this._isEnabled = true;

      // Right pane options changes
      if (this.baseView) {
        this.baseView.on('rightPane:input:change', this.savePreferences, this);
      }

      _.result(this, 'bindEvents');
      _.result(this, 'onEnable');
    },

    disable: function () {
      if (!this._isEnabled) {
        return;
      }

      this._isEnabled = false;

      // Right pane options changes
      if (this.baseView) {
        this.baseView.off('rightPane:input:change', this.savePreferences, this);
      }

      _.result(this, 'unbindEvents');
      _.result(this, 'onDisable');
    },

    savePreferences: function (name, value, global) {
      var attributes = {};
      var viewOptions = this.getAllViewOptions();
      var options;
      var viewId = this.options.id;

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

    navigate: function (id) {
      var route = Backbone.history.fragment.split('/');
      route.push(id);
      app.router.go(route);
    },

    cleanup: function () {
      if (this.unbindEvents) {
        this.unbindEvents();
      }

      if (_.isFunction(this.onCleanUp)) {
        this.onCleanUp.apply(this);
      }
    },

    // before the view element ($el) is removed from the DOM
    // after all the listeners has been stopped
    onCleanUp: function () {},

    constructor: function (options) {
      this.baseView = options.baseView;

      this.state = {
        malformedOptions: false
      };

      Backbone.Layout.prototype.constructor.apply(this, arguments);
    }
  });
});
