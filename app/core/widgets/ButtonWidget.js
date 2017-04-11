define([
  'app',
  'backbone',
  'underscore'
],
function(app, Backbone, _) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/button',

    tagName: 'div',

    attributes: function () {
      var classes = ['action', 'widget', 'widget-button'];

      if (this.widgetId) {
        classes.push(this.widgetId);
      }

      return {
        class: classes.join(' ')
      }
    },

    events: function() {
      return this.getEvents();
    },

    addClass: function (classes) {
      this.$('button').addClass(classes);
    },

    removeClass: function (classes) {
      this.$('button').removeClass(classes);
    },

    serialize: function() {
      var options = this.options.widgetOptions;

      // @TODO: Add library that handle class uniqueness and spaces.
      options.buttonClass += ' action js-action-button';
      if (options.help) {
        options.buttonClass += ' help';
      }

      options.state = this.state;

      return options;
    },

    afterRender: function() {
      if (this.options.widgetOptions && this.options.widgetOptions.active) {
        $(this.el).addClass('active');
      }
    },

    getEvents: function() {
      return this._events;
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
      this._events = {};
      this.state = {};

      options = _.defaults(options, {enable: true});

      this.setEnabled(options.enable);

      if (_.isFunction(options.onClick)) {
        this._events['click .js-action-button'] = options.onClick;
      }

      this.listenTo(this, 'enabled:change', this.render);
    }
  });
});
