define([
  // Application.
  "app",

  // Modules.
  "../../extensions/cashregister/user"
],

function(app, User) {

  var Product = app.module();

  Product.Collection = Backbone.Collection.extend({
  	initialize: function() {
  		
  	}
  });

  return Product;
});