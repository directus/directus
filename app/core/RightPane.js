define([
  'app',
  'backbone'
], function(app, Backbone) {

  return Backbone.Layout.extend({
   initialize: function(options) {
     this.baseView = options.baseView;
   }
  });
});
