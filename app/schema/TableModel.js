define(function(require, exports, module) {

  'use strict';

  var Backbone = require('backbone'),
      ColumnsCollection = require('./ColumnsCollection'),
      PreferenceModel = require('./../core/PreferenceModel');

  module.exports =  Backbone.Model.extend({

    parse: function(data) {
      data = data.data ? data.data : data;
      if (this.columns === undefined) {
        this.columns = new ColumnsCollection(data.columns, {parse: true, url: this.url + '/columns'});
      } else {
        this.columns.reset(data.columns, {parse: true});
      }

      if(data.preferences !== undefined) {
        if (this.preferences === undefined) {
          var preference = data.preferences;
          this.preferences = new PreferenceModel(data.preferences, {url: app.API_URL + 'tables/' + preference.table_name + '/preferences'})
        } else {
          this.preferences.set(data.preferences);
        }
      }

      this.columns.table = this;

      return _.omit(data, ['columns', 'preferences']);
    },

    toJSON: function(options) {
      var attrs = _.clone(this.attributes);
      attrs.columns = this.columns.toJSON();
      return attrs;
    }

  });

});
