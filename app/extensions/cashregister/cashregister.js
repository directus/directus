define([
  'app',
  'backbone',
  'core/directus',
],

function(app, Backbone, Directus) {


  var CashRegister = Backbone.Layout.extend({
    template: 'page',

    serialize: function() {
      return {title: 'Cash Register'};
    },

    afterRender: function() {
      this.insertView('#page-content', this.productsTable);
      this.products.fetch();
    },

    initialize: function() {
      this.products = app.entries['products'];
      this.productsTable = new Directus.Table({collection: this.products});
    }
  });

  return CashRegister;
});