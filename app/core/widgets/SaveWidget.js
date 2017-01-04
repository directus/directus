define([
  'app',
  'backbone',
  'underscore'
],
function(app, Backbone, _) {

  'use strict';

  return Backbone.Layout.extend({
    template: 'core/widgets/save-widget',

    tagName: 'div',

    attributes: {
      class: 'action widget widget-button'
    },

    events: function() {
      return this.getEvents();
    },

    getEvents: function() {
      return this._events;
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    setSaved: function(isSaved) {
      this.options.widgetOptions.isUpToDate = isSaved;
      this.render();
    },

    initialize: function(options) {
      this._events = {};
      if (!options.widgetOptions) {
        this.options.widgetOptions = {isUpToDate: true};
      }

      if (_.isFunction(options.onClick)) {
        this._events['click #save_button.saved-success'] = options.onClick;
      }
    }
  });
});
