define([
  // Application.
  "app",

  // Modules.
  "../../extensions/cashregister/user",
  "../../extensions/cashregister/product"
],

function(app, User, Product) {

  var Transaction = app.module();

  Transaction.Model = Backbone.Model.extend({
    initialize: function() {
      this.activeProductsCollection = new Transaction.ActiveProductsCollection();
      this.activeProductsCollection.transaction = this;
    }
  });

  Transaction.ActiveProductsCollection = Backbone.Collection.extend({
    model: Product.Model,
    initialize: function(options) {
      this.on('cartAdd', this.cartAdd, this);
      this.on('change remove cartAdd', this.recalculate, this);
    },
    cartAdd: function(item) {
      var itemCurrentIndex = this.indexOf(item);
      if (itemCurrentIndex === -1) {
        item.set({quantity: 1});
        this.add(item);
      } else {
        var currentQuantity = this.at(itemCurrentIndex).get('quantity');
        this.at(itemCurrentIndex).set({quantity: currentQuantity+1});
      }
    },
    recalculate: function() {
      var runningTotal = 0;
      this.each(function(product) {
        runningTotal += product.get('subtotal');
      }, this);
      this.transaction.set({runningTotal: runningTotal});
    }
  });

Transaction.Views.ActiveProductsList = Backbone.Layout.extend({

    prefix: 'extensions/cashregister/templates/',

    template: 'active-products-table',

    events: {
      'click a.remove_item':'remove_item'
    },

    initialize: function() {
      this.listenTo(this.model.activeProductsCollection, {
        "remove": this.render
      });

      this.listenTo(this.model, {
        "change:runningTotal": this.render
      });
    },

    remove_item: function(e) {
      var productToRemove = this.model.activeProductsCollection.get($(e.currentTarget).data('id'));
      productToRemove.set({quantity: 0});
      this.model.activeProductsCollection.remove(productToRemove);
    },

    serialize: function() {
      return { rows: this.model.activeProductsCollection.toJSON(), runningTotal: this.model.get('runningTotal') };
    }
  });

  return Transaction;
});