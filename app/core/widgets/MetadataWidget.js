define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'moment'
],
function(app, Backbone, _, Handlebars, moment) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/metadata',

    tagName: 'div',

    attributes: {
      class: 'metadata'
    },

    events: function() {
      return this.getEvents();
    },

    serialize: function() {
      var collection = this.model.collection;
      var table = collection ? collection.table : null;
      var model = this.model ? this.model.toJSON() : {};
      var dateFormat = 'MMM Mo, YYYY @ H:mma';
      var previewUrl = table ? table.get('preview_url') : null;
      var metadata = {};

      previewUrl = Handlebars.compile(previewUrl)(model);

      if (table && table.get('user_create_column')) {
        metadata.createdBy = this.model.get(table.get('user_create_column'));
      }

      if (table && table.get('date_create_column')) {
        metadata.createdOn = this.model.get(table.get('date_create_column'));
      }

      if (table && table.get('user_update_column')) {
        metadata.updatedBy = moment(this.model.get(table.get('user_update_column')), dateFormat);
      }

      if (table && table.get('date_update_column')) {
        metadata.updatedOn = moment(this.model.get(table.get('date_update_column')), dateFormat);
      }

      return {
        model: model,
        previewUrl: previewUrl,
        meta: metadata
      }
    },

    afterRender: function() {
      if (this.options.widgetOptions && this.options.widgetOptions.active) {
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
