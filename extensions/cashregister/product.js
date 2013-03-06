define([
  // Application.
  "app",

  // Modules.
  "../../extensions/cashregister/user"
],

function(app, User) {

  var Product = app.module();

  var ActiveProductCollectionInternalModel = Backbone.Model.extend({
    initialize: function() {

    }
  });

  Product.Model = Backbone.Model.extend({
    initialize: function() {
      this.on('change:quantity', this.calculateSubtotal);
    },
    calculateSubtotal: function() {
      var newSubTotal = this.get('quantity')*this.get('price');
      this.set({'subtotal': newSubTotal});
    }
    
  });

  Product.Collection = Backbone.Collection.extend({
    model: Product.Model,
  	initialize: function() {
  		
  	}
  });

  Product.QuickPicksCollection = Backbone.Collection.extend({
    model: Product.Model,
    initialize: function() {
      this.url = '/directus/api/1/extensions/cashregister/products';
    }
    
  });

  Product.ActiveProductsCollection = Backbone.Collection.extend({
    model: Product.Model,
    initialize: function() {
      this.on('cartAdd', this.cartAdd, this);
      this.on('change remove cartAdd', this.recalculate, this);
      this.activeProductCollectionInternalModel = new ActiveProductCollectionInternalModel();
    },
    cartAdd: function(item, collection) {
      var itemCurrentIndex = collection.indexOf(item);
      if (itemCurrentIndex === -1) {
        item.set({quantity: 1});
        collection.add(item);
      } else {
        var currentQuantity = collection.at(itemCurrentIndex).get('quantity');
        collection.at(itemCurrentIndex).set({quantity: currentQuantity+1});
      }
    },
    recalculate: function() {
      var runningTotal = 0;
      this.each(function(product) {
        runningTotal += product.get('subtotal');
      }, this);
      this.activeProductCollectionInternalModel.set({runningTotal: runningTotal});
    }
  });


Product.QuickPicksListView = Backbone.Layout.extend({
    prefix: 'extensions/cashregister/templates/',

    template: 'quick-picks-table',

    events: {
      'click tr':'addProduct'
    },

    initialize:function(options) {
      console.log("options", options);
      this.collection.on('reset', this.render, this);
      this.activeProductsCollection = options.activeProductsCollection;
      /*this.collection.listenTo({
        'reset':this.render
      });*/
    },

    addProduct:function(e) {
      var productToAdd = this.collection.get($(e.currentTarget).data('id'));
      this.activeProductsCollection.trigger('cartAdd', productToAdd, this.activeProductsCollection);
    },

    serialize: function() {
      return { rows: this.collection.toJSON(), product1: 'test', product2: 'test 2'};
    }

  });

  Product.ActiveProductsListView = Backbone.Layout.extend({

    prefix: 'extensions/cashregister/templates/',

    template: 'active-products-table',

    events: {
      'click a.remove_item':'remove_item'
    },

    initialize: function() {
      this.collection.on('remove', this.render, this);
      this.collection.activeProductCollectionInternalModel.on('change:runningTotal', this.render, this);
    },

    remove_item: function(e) {
      var productToRemove = this.collection.get($(e.currentTarget).data('id'));
      productToRemove.set({quantity: 0});
      this.collection.remove(productToRemove);
    },

    serialize: function() {
      return { rows: this.collection.toJSON(), runningTotal: this.collection.activeProductCollectionInternalModel.get('runningTotal') };
    }
  });

  return Product;
});