define([
  'app',
  'backbone',
  'underscore',
  'core/directus',

  '../../extensions/cashregister/accounting.min',

  // modules
  '../../extensions/cashregister/product',
  '../../extensions/cashregister/user'

],

function(app, Backbone, _, Directus, Accounting, Product, User) {

 var Extension = {

    id: 'cash_register'

  };

  Handlebars.registerHelper('moneyFormat', function(number) {
    return Accounting.formatMoney(number);
  });;
  
  var vars = vars || {};

  var Customer = Backbone.Model.extend({

  });

  var CustomerCollection = Backbone.Collection.extend({
    model: Customer
  });

  vars.quickPicksCollection = new Product.QuickPicksCollection();
  vars.customerCollection = new CustomerCollection();
  vars.activeProductsCollection = new Product.ActiveProductsCollection();

  

  var CustomerListView = Backbone.Layout.extend({

  });

  // Private view
  var MainView = Backbone.Layout.extend({

    prefix: 'extensions/cashregister/templates/',

    template: 'register-main',

    beforeRender: function() {
      this.setView('.quick_picks_table', new Product.QuickPicksListView({collection: vars.quickPicksCollection, activeProductsCollection: vars.activeProductsCollection}));
      this.setView('.active_products_table', new Product.ActiveProductsListView({collection: vars.activeProductsCollection}));
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
      console.log(Product);
        var collections = {
          products: new Product.Collection(),
          users: new User.Collection()
        };

      _.extend(this, collections);
    }

  });

  return Extension;
});