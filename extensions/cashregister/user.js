define([
  // Application.
  "app",

  // Modules.
  "../../extensions/cashregister/product"
],

function(app, Product) {

  var User = app.module(), searchVal = "";

  User.Collection = Backbone.Collection.extend({
  	initialize: function() {
		this.url = '/directus/api/1/extensions/cashregister/customers';
  	}
  });


  User.ListView = Backbone.Layout.extend({
  	prefix: 'extensions/cashregister/templates/',

    template: 'customers-table',

  	initialize: function() {
  		this.listenTo(this.collection, {
  			"reset": this.render,

  			"fetch": function() {
  				this.$('.status').text("Loading...");
  			}
  		});

  	},

    serialize: function() {
      return { rows: this.collection.toJSON(), searchVal: searchVal };
    }
  });

  return User;
});