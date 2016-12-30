define([
  'app',
  'backbone',
  'underscore',
  'handlebars'
],
function(app, Backbone, _, Handlebars) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/button',

    tagName: 'div',

    attributes: {
      class: 'action widget widget-button'
    },

    events: function() {
      return this.getEvents();
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    afterRender: function() {
      if(this.options.widgetOptions && this.options.widgetOptions.active) {
        $(this.el).addClass('active');
      }
    },

    getEvents: function() {
      return this._events;
    },

    initialize: function(options) {
      this._events = {};

      if (_.isFunction(options.onClick)) {
        this._events['click .js-action-button'] = options.onClick;
      }
    }
  });
});
