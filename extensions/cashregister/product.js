define([
  // Application.
  "app"
],

function(app) {

  var Product = app.module();

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

Product.Views.Item = Backbone.Layout.extend({
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

Product.Views.QuickPicksList = Backbone.Layout.extend({
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
          this.insertView("tbody", new Product.Views.Item({
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

  return Product;
});