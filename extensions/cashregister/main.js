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

            var CashRegister = {};

            CashRegister.Models = {};
            CashRegister.Collections = {};

            CashRegister.Views = {};

            CashRegister.Models.PaymentType = Backbone.Model.extend({
                initialize: function() {
                    console.log("paymenttype", this);
                    this.listenTo(this.collection.transaction, {
                        'change:selected_payment_type':this.check_sel_or_not
                    });
                },
                check_sel_or_not: function() {
                   // console.log('check_sel_or_not');
                    this.set({sel: this.collection.transaction.get('selected_payment_type') == this});
                }
            });

            CashRegister.Collections.PaymentTypes = Backbone.Collection.extend({
                url: '/directus/api/1/extensions/cashregister/payment_types',
                model: CashRegister.Models.PaymentType,
                initialize: function(coll, options) {
                    this.transaction = options.transaction;
                    console.log("collection", options);
                    //options.transaction.on('change:selected_payment_type', this.set_selected_type);
                },
                set_selected_type: function() {

                }
            });

            this.paymentTypes = new CashRegister.Collections.PaymentTypes([], {transaction: this.transaction});

            var collections = {
                quickPicksCollection: new Product.QuickPicksCollection(),
                customerCollection: new User.Collection({transaction: this.transaction}),
                activeProductsCollection: this.transaction.activeProductsCollection,
                paymentTypes: this.paymentTypes
            };

            _.extend(this, collections);

            this.v = {};

            var SubMain = Backbone.Layout.extend({
                prefix: 'extensions/cashregister/templates/',

                template: 'register-main',

                initialize: function(options) {
                    console.log(options);
                    this.transaction = options.transaction;
                    this.paymentTypes = options.paymentTypesCollection;
                    this.listenTo(options.transaction, {
                        'change:selectedRider':this.show_rider_detail,
                        'change:userSearchSetting':this.set_user_search_view
                    });
                },

                views: {
                    '.omnibox': new Transaction.Views.OmniBox({
                        customerCollection: this.customerCollection,
                        activeProductsCollection: this.activeProductsCollection,
                        productCollection: this.quickPicksCollection,
                        transaction: this.transaction,
                        paymentTypes: this.paymentTypes
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
                    this.setView('.customers_table', new User.Views.Selected({model: this.transaction.get('selectedRider'), transaction: this.transaction, paymentTypes: this.paymentTypes }));
                    this.render();
                },

                set_user_search_view: function() {
                  var searchSetting = this.transaction.get('userSearchSetting');
                  this.setView('.customers_table', new User.Views.List({
                    collection: this.options.customerCollection,
                    transaction: this.transaction
                  }));
                  switch (searchSetting) {
                    case '':
                      this.options.customerCollection.url = '/directus/api/1/extensions/cashregister/customers';
                      this.options.customerCollection.fetch();
                    break;
                    case 'class':
                      this.options.customerCollection.url = '/directus/api/1/extensions/cashregister/customers/class';
                      this.options.customerCollection.fetch();
                    break;
                  }

                }

            });

            this.v.subMain = new SubMain(
              {
                transaction: this.transaction, 
                quickPicksCollection: this.quickPicksCollection,
                activeProductsCollection: this.activeProductsCollection,
                customerCollection: this.customerCollection,
                paymentTypesCollection: this.paymentTypes
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

            this.paymentTypes.fetch();
            this.quickPicksCollection.fetch();
            this.customerCollection.fetch();

        }

    });

      var BarcodeScannerEvents = function() {
           this.initialize.apply(this, arguments);
      };

      BarcodeScannerEvents.prototype = {
        initialize: function(obj) {
          console.log("obj",obj);
           $(document).on({
              keyup: $.proxy(this._keyup, this)
           });
        },
        _timeoutHandler: 0,
        _inputString: '',
        _keyup: function (e) {
        if (this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
            this._inputString += String.fromCharCode(e.which);
        } 

        this._timeoutHandler = setTimeout($.proxy(function () {
            if (this._inputString.length <= 3) {
                this._inputString = '';
                return;
            }

            console.log('YES');
            $(document).trigger('onbarcodescaned', this._inputString);
            this._inputString = '';

        }, this), 20);
        }
      };

    return Extension;
});