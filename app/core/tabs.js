//  tabs.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  "app",
  "backbone"
],

function(app, Backbone) {

  var Tabs = {};

  Tabs.Collection = Backbone.Collection.extend({
    setActive: function(route) {
      var model = this.get(route);
      if (!model) { return; }
      //deactive all tabs
      _.each(this.where({'active':true}),function(model) {
        model.unset('active',{silent: true});
      });
      model.set({'active':true});

      // Report the "last page" data to the API
      // var user = app.getCurrentUser();
      // user.set('last_page', route);
      // user.save();
    }
  });

  Tabs.View = Backbone.Layout.extend({
    template: "tabs",

    serialize: function() {
      return {tabs: this.collection.toJSON()};
    },

    initialize: function() {
      this.collection.on('change sync', this.render, this);
    }

  });

  return Tabs;
});