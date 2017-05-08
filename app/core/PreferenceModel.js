define(function(require, exports, module) {

  'use strict';

  var app       = require('app');
  var Backbone  = require('backbone');
  var __t       = require('core/t');
  var $         = require('jquery');

  var PreferenceModel = module.exports = Backbone.Model.extend({

    url: function () {
      return app.API_URL + 'tables/' + encodeURIComponent(this.get('table_name')) + '/preferences';
    },

    parse: function(data) {
      return data.meta ? data.data : data;
    },

    fetch: function (options) {
      // @NOTE: Do we need this?
      // this.trigger('fetch', this);
      var args = {
        data: $.param((options || {}))
      };

      return this.constructor.__super__.fetch.call(this, args);
    },

    getListViewOptions: function (attr) {
      var viewOptions = {};

      try {
        viewOptions = JSON.parse(this.get('list_view_options')) || {};
      } catch (err) {
        viewOptions = {};
        console.error(__t('calendar_has_malformed_options_json'));
      }

      return attr ? viewOptions[attr] : viewOptions;
    },

    getAllViewOptions: function(viewId) {
      var viewOptions = this.getListViewOptions();

      if (viewId) {
        viewOptions = viewOptions[viewId] || {};
      }

      return viewOptions;
    },

    getViewOptions: function (viewId, attr) {
      var options = this.getAllViewOptions(viewId);

      return attr ? options[attr] : options;
    }
  });
});
