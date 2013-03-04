define([
  'app',
  'backbone',
  'core/directus',

  '../../extensions/cashregister/accounting.min'
],

function(app, Backbone, Directus, Accounting) {

 var Extension = {

    id: 'cash_register'

  };

  Handlebars.registerHelper('moneyFormat', function(number) {
    return Accounting.formatMoney(number);
  });;

  var products = [
    {
      'name':'Shoes and Water',
      'price':5.00,
      'id':1
    },
    {
      'name':'Shoes and Big Water',
      'price':6.00,
      'id':2
    }
  ];
  
  var vars = vars || {};

  var ActiveProductCollectionInternalModel = Backbone.Model.extend({
    initialize: function() {

    }
  });


  var Product = Backbone.Model.extend({
    initialize: function() {
      this.on('change:quantity', this.calculateSubtotal);
    },
    calculateSubtotal: function() {
      var newSubTotal = this.get('quantity')*this.get('price');
      this.set({'subtotal': newSubTotal});
    }
    
  });

  var Customer = Backbone.Model.extend({

  });

  var QuickPicksCollection = Backbone.Collection.extend({
    model: Product,
    initialize: function() {
      this.url = '/directus/api/1/extensions/cashregister/products';
    }
    
  });

  var ActiveProductsCollection = Backbone.Collection.extend({
    model: Product,
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

  var CustomerCollection = Backbone.Collection.extend({
    model: Customer
  });

  vars.quickPicksCollection = new QuickPicksCollection();
  vars.customerCollection = new CustomerCollection();
  vars.activeProductsCollection = new ActiveProductsCollection();

  var QuickPicksListView = Backbone.Layout.extend({
    prefix: 'extensions/cashregister/templates/',

    template: 'quick-picks-table',

    events: {
      'click tr':'addProduct'
    },

    initialize:function() {
      this.collection.on('reset', this.render, this);
      /*this.collection.listenTo({
        'reset':this.render
      });*/
    },

    addProduct:function(e) {
      var productToAdd = this.collection.get($(e.currentTarget).data('id'));
      vars.activeProductsCollection.trigger('cartAdd', productToAdd, vars.activeProductsCollection);
    },

    serialize: function() {
      return { rows: this.collection.toJSON(), product1: 'test', product2: 'test 2'};
    }

  });

  var ActiveProductsListView = Backbone.Layout.extend({

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

  var CustomerListView = Backbone.Layout.extend({

  });

  // Private view
  var MainView = Backbone.Layout.extend({

    prefix: 'extensions/cashregister/templates/',

    template: 'register-main',

    beforeRender: function() {
      this.setView('.quick_picks_table', new QuickPicksListView({collection: vars.quickPicksCollection}));
      this.setView('.active_products_table', new ActiveProductsListView({collection: vars.activeProductsCollection}));
    }

  });

  var View = Backbone.Layout.extend({

    template: 'page',

    el: '#content',

    serialize: function() {
      return {title: 'Cash Register'};
    },

    afterRender: function() {
      var mainView = new MainView();
      this.setView('#page-content', mainView);
      mainView.render();
    }

  });

 

Extension.Router = Directus.SubRoute.extend({
    routes: {
      "":         "index"
    },

    index: function() {
      this.main = new View();
      this.main.render();
      vars.quickPicksCollection.fetch();
    },

    initialize: function() {

    }

  });

  return Extension;
});