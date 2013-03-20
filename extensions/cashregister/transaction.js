define([
// Application.
"app",

// Modules.
"../../extensions/cashregister/user",
    "../../extensions/cashregister/product"],

function (app, User, Product) {

    var Transaction = app.module();

    Transaction.Model = Backbone.Model.extend({
        initialize: function () {
            this.activeProductsCollection = new Transaction.ActiveProductsCollection();
            this.activeProductsCollection.transaction = this;
        }
    });

    Transaction.ActiveProductsCollection = Backbone.Collection.extend({
        model: Product.Model,
        initialize: function (options) {
            this.on('cartAdd', this.cartAdd, this);
            this.on('change remove cartAdd', this.recalculate, this);
        },
        cartAdd: function (item) {
            var itemCurrentIndex = this.indexOf(item);
            if (itemCurrentIndex === -1) {
                item.set({
                    quantity: 1
                });
                this.add(item);
            } else {
                var currentQuantity = this.at(itemCurrentIndex).get('quantity');
                this.at(itemCurrentIndex).set({
                    quantity: currentQuantity + 1
                });
            }
        },
        recalculate: function () {
            var runningTotal = 0;
            this.each(function (product) {
                runningTotal += product.get('subtotal');
            }, this);
            this.transaction.set({
                runningTotal: runningTotal
            });
        }
    });

    Transaction.Views.OmniBox = Backbone.Layout.extend({
        prefix: 'extensions/cashregister/templates/',

        template: 'omnibox',

        initialize: function (options) {
            this.options = options;
            var self = this;
            this.listenTo(options.customerCollection, {
              'reset': this.render
            });
        },

        afterRender: function () {
          var self = this;
          this.$("input").focus();
          this.$("input").typeahead({
              minLength: 2,
              //items: 5,
              source: function (typeahead, query) {
                  $.ajax({
                      url: "/directus/api/1/extensions/cashregister/omnibox",
                      dataType: 'json',
                      success: function (data) {
                          var items = [];
                          $.each(data, function (i, item) {
                              items.push(JSON.stringify(item));
                          });
                          items.push(JSON.stringify({id:0, title:'Riders in current and upcoming classes', type:'class'}));
                          items.push(JSON.stringify({id:0, title:'All Riders', type:'allusers'}));
                          typeahead.process(items);
                      }
                  });
              },

              matcher: function(item) {
                var obj = JSON.parse(item);
                if (obj.type === "rider" && self.options.customerCollection.pluck('id').indexOf(obj.id) == -1) {
                  return false;
                } else {
                  return ~item.toLowerCase().indexOf(this.query.toLowerCase())
                } 
              },
              sorter: function (items) {
                    var beginswith = []
                    , caseSensitive = []
                    , caseInsensitive = []
                    , item

                  while (item = items.shift()) {
                    var itemObj = JSON.parse(item);
                    var itemName = itemObj.title;
                    if (!itemName.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
                    else if (~itemName.indexOf(this.query)) caseSensitive.push(item)
                    else caseInsensitive.push(item)
                  }

                  return beginswith.concat(caseSensitive, caseInsensitive)
                },
              highlighter: function (item) {
                var item = JSON.parse(item);
                var itemTitle = item.title;

                return itemTitle.replace(new RegExp('(' + this.query + ')', 'ig'), function ($1, match) {
                    return '<strong>' + match + '</strong>'
                })
              },
              onselect: function (obj) {
                  var item = JSON.parse(obj);
                  switch (item.type) {
                    case 'product':
                      var modelToAdd = self.options.productCollection.get(item.id);
                      self.options.activeProductsCollection.trigger('cartAdd', modelToAdd );
                    break;
                    case 'rider':
                      var modelToAdd = self.options.customerCollection.get(item.id);
                      self.options.transaction.set({selectedRider: modelToAdd});
                    break;
                    case 'class':
                      self.options.transaction.set({userSearchSetting:'class'});
                    break;
                    case 'allusers':
                      self.setView('.customers_table', new User.Views.List({
                        collection: self.options.customerCollection,
                        transaction: self.options.transaction
                      }));
                      self.options.transaction.set({userSearchSetting:''});
                      
                    break;
                  }
                  self.$("input").val('');
                  self.$("input").focus();
              }
          });
        }
    });

    Transaction.Views.ActiveProductsList = Backbone.Layout.extend({

        prefix: 'extensions/cashregister/templates/',

        template: 'active-products-table',

        events: {
            'click a.remove_item': 'remove_item'
        },

        initialize: function () {
            this.listenTo(this.model.activeProductsCollection, {
                "remove": this.render
            });

            this.listenTo(this.model, {
                "change:runningTotal": this.render
            });
        },

        remove_item: function (e) {
            var productToRemove = this.model.activeProductsCollection.get($(e.currentTarget).data('id'));
            productToRemove.set({
                quantity: 0
            });
            this.model.activeProductsCollection.remove(productToRemove);
        },

        serialize: function () {
            return {
                rows: this.model.activeProductsCollection.toJSON(),
                runningTotal: this.model.get('runningTotal')
            };
        }
    });

    return Transaction;
});