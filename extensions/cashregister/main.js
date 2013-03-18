define([
    'app',
    'backbone',
    'underscore',
    'core/directus',

    '../../extensions/cashregister/accounting.min',

    // modules
    '../../extensions/cashregister/product',
    '../../extensions/cashregister/user',
    '../../extensions/cashregister/transaction'

],

function (app, Backbone, _, Directus, Accounting, Product, User, Transaction) {

    var Extension = {
        id: 'cash_register'
    };

    Handlebars.registerHelper('moneyFormat', function (number) {
        return Accounting.formatMoney(number);
    });;

    Extension.Router = Directus.SubRoute.extend({
        routes: {
            "": "index"
        },

        index: function () {
            this.v.main.render();
        },

        initialize: function () {

            this.transaction = new Transaction.Model();

            var routerProxy = this;

            var collections = {
                quickPicksCollection: new Product.QuickPicksCollection(),
                customerCollection: new User.Collection(),
                activeProductsCollection: this.transaction.activeProductsCollection
            };

            _.extend(this, collections);

            this.v = {};

            var SubMain = Backbone.Layout.extend({
                prefix: 'extensions/cashregister/templates/',

                template: 'register-main',

                initialize: function(options) {
                    this.transaction = options.transaction;
                    this.listenTo(options.transaction, {
                        'change:selectedRider':this.show_rider_detail
                    });
                },

                events: {
                    'keyup #customer-filter': 'update_users_table',
                    'keyup #quickpicks-filter': 'update_products_table'
                },

                views: {
                    '.omnibox': new Transaction.Views.OmniBox({
                        customerColllection: this.customerCollection,
                        productCollection: this.quickPicksCollection
                    }),

                    '.quick_picks_table': new Product.Views.QuickPicksList({
                        collection: this.quickPicksCollection,
                        activeProductsCollection: this.activeProductsCollection
                    }),
                    '.active_products_table': new Transaction.Views.ActiveProductsList({
                        model: this.transaction
                    }),
                    '.customers_table': new User.Views.List({
                        collection: this.customerCollection,
                        transaction: this.transaction
                    })
                },

                show_rider_detail: function() {
                    this.setView('.customers_table', new User.Views.Selected({model: this.transaction.get('selectedRider')}));
                    this.render();
                },

                update_users_table: _.debounce(function (e) {
                    
                    var searchVal = e.currentTarget.value;

                    if (searchVal.length > 0) {
                        routerProxy.customerCollection.url = '/directus/api/1/extensions/cashregister/customers/' + searchVal;
                    } else {
                        routerProxy.customerCollection.url = '/directus/api/1/extensions/cashregister/customers';
                    }
                    console.log(this);
                    this.setView('.customers_table', new User.Views.List({
                      collection: this.options.customerCollection,
                      transaction: this.transaction
                    }));
                    routerProxy.customerCollection.fetch();
                }, 800),

                update_products_table: _.debounce(function (e) {

                    routerProxy.quickPicksCollection.trigger('change:searchVal', {
                        searchVal: e.currentTarget.value
                    })

                }, 500)
            });

            this.v.subMain = new SubMain(
              {
                transaction: this.transaction, 
                quickPicksCollection: this.quickPicksCollection,
                activeProductsCollection: this.activeProductsCollection,
                customerCollection: this.customerCollection
              }
            );

            this.v.main = new Backbone.Layout({
                template: 'page',
                el: '#content',
                views: {
                    '#page-content': this.v.subMain
                },
                serialize: function () {
                    return {
                        title: 'Cash Register'
                    };
                }
            });

            this.quickPicksCollection.fetch();
            this.customerCollection.fetch();

        }

    });

    return Extension;
});