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

  Product.QuickPicksCollection = Backbone.Collection.extend({
    model: Product.Model,
    initialize: function() {
      this.url = '/directus/api/1/extensions/cashregister/products';
      this.searchVal = '';
    }

  });

  Product.AllProductsCollection = Backbone.Collection.extend({
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
      this.activeProductCollectionInternalModel.set({runningTotal: runningTotal});
    }
  });

Product.ItemView = Backbone.Layout.extend({
      prefix: 'extensions/cashregister/templates/',

      template: 'product-item',

      tagName: 'tr',

      events: {
            'click':'addProduct'
      },

      initialize: function(options) {
        this.activeProductsCollection = options.activeProductsCollection;
        this.listenTo(this.model, {
          "change": this.render
        });
        this.listenTo(this.collection, {
          "change:searchVal": this.showOrHide
        });
      },

      addProduct:function(e) {
       // var productToAdd = this.collection.get($(e.currentTarget).data('id'));
        this.activeProductsCollection.trigger('cartAdd', this.model );
      },

      showOrHide: function(searchValObj) {
        var searchVal = searchValObj.searchVal;
        if (~this.model.get('title').toLowerCase().indexOf(searchVal.toLowerCase()) || searchVal === "") {
          this.$el.fadeIn('fast');
        } else {
          this.$el.fadeOut('fast');
        }
      },

      serialize: function() {
        return this.model.toJSON();
      }
});

Product.QuickPicksListView = Backbone.Layout.extend({
    prefix: 'extensions/cashregister/templates/',

    template: 'quick-picks-table',

    initialize:function(options) {
      this.activeProductsCollection = options.activeProductsCollection;
      this.listenTo(this.collection, {
        "reset": this.render,

        "fetch": function() {
          this.$('.status').text("Loading...");
        }
      });
    },

    beforeRender: function() {
      if(this.collection.length > 0) {
        this.collection.each(function(product) {
          this.insertView("tbody", new Product.ItemView({
              model: product,
              activeProductsCollection: this.activeProductsCollection,
              collection: this.collection
            }));
        }, this);
      } else {
        // say there are no products....
      }

    },

    serialize: function() {
      return { rows: this.collection.toJSON() };
    }

  });

  Product.ActiveProductsListView = Backbone.Layout.extend({

    prefix: 'extensions/cashregister/templates/',

    template: 'active-products-table',

    events: {
      'click a.remove_item':'remove_item'
    },

    initialize: function() {
      this.listenTo(this.collection, {
        "remove": this.render
      });

      this.listenTo(this.collection.activeProductCollectionInternalModel, {
        "change:runningTotal": this.render
      });
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