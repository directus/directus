define([
  // Application.
  "app",

  // Modules.
  "../../extensions/cashregister/product"
],

function(app, Product) {

  var User = app.module();

  User.Collection = Backbone.Collection.extend({
  	initialize: function() {

  	}
  });

  return User;
});