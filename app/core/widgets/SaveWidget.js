define([
  'app',
  'backbone',
  'underscore'
],
function(app, Backbone, _) {

  'use strict';

  // TODO: Make this widget extends from ButtonWidget
  return Backbone.Layout.extend({
    template: 'core/widgets/save-widget',

    tagName: 'div',

    attributes: {
      class: 'action widget widget-button'
    },

    _events: {
      'click .more': function (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    },

    events: function() {
      return this.getEvents();
    },

    getEvents: function() {
      return this._events;
    },

    serialize: function() {
      var data = this.options.widgetOptions;

      data.state = this.state;

      return data;
    },

    setEnabled: function (enabled) {
      this.state.enabled = enabled;
      this.trigger('enabled:change', enabled);
    },

    enable: function () {
      this.setEnabled(true);
    },

    disable: function () {
      this.setEnabled(false);
    },

    initialize: function (options) {
      this._events = this._events || {};
      this.state = {};

      this.state.enabled = options.enabled === undefined ? true : options.enabled;

      if (!options.widgetOptions) {
        this.options.widgetOptions = {isUpToDate: true};
      }

      if (_.isFunction(options.onClick)) {
        this._events['click #save_button'] = _.wrap(options.onClick, function(onClick, event) {
          if (this.state.enabled) {
            onClick(event);
          }
        });
        this._events['change #save_options'] = function (event) {
          options.onClick(event);
          event.target.selectedIndex = -1;
        };
      }

      if (_.isFunction(options.onChange)) {
        this._events['change #save_options'] = options.onChange;
      }

      this.listenTo(this, 'enabled:change', this.render);
    }
  });
});
