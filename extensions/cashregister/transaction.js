define([
    // Application.
    "app",

    // Modules.
    "../../extensions/cashregister/user",
    "../../extensions/cashregister/product"
],

function (app, User, Product) {

    var Transaction = app.module();

    Transaction.Models = {};
    Transaction.Collections = {};

    Transaction.Model = Backbone.Model.extend({
        initialize: function () {
            this.activeProductsCollection = new Transaction.ActiveProductsCollection();
            this.activeProductsCollection.transaction = this;
            this.on('change:selected_payment_type', this.process_payment_type_change)
        },

        process_payment_type_change: function() {
            var selected_payment_type = this.get('selected_payment_type').get('name');
            switch (selected_payment_type) {
                case 'Credit Card':
                    // if we have a selected user, that is fine. Otherwise lets default to guest.
                    if ( this.get('selectedRider') ) {

                    } else {
                        this.set({ selectedRider: new User.Model({ guest: true }) });
                    }
                    console.log();
                break;
            }
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
            this.listenTo(options.transaction, {
                'credit_card_swiped':this.show_creditcard_swiped_message
            });
            this.on('barcodescan', this.barcodeScanned);
        },

        barcodeScanned: function (barcode) {
            var scannedProduct = this.options.productCollection.findWhere({
                sku: barcode
            });
            if (scannedProduct) {
                this.options.activeProductsCollection.trigger('cartAdd', scannedProduct);
                this.$("input").val('');
                this.$("input").focus();
            }
        },

        show_creditcard_swiped_message: function() {
            console.log(this.options);
            this.options.transaction.set({ selected_payment_type: this.options.paymentTypes.findWhere({name: "Credit Card"}) });
            this.$("input").val('');
            this.$("input").focus();
        },

        afterRender: function () {
            var self = this,
                barcodeLogging = false,
                ccSwipeLogging = false,
                currentBarcode = '';
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
                            items.push(JSON.stringify({
                                id: 0,
                                title: 'Riders in current and upcoming classes',
                                type: 'class'
                            }));
                            items.push(JSON.stringify({
                                id: 0,
                                title: 'All Riders',
                                type: 'allusers'
                            }));
                            typeahead.process(items);
                        }
                    });
                },
                keyup: function (e) {
                  // console.log(String.fromCharCode(e.which), e);
                    if (barcodeLogging) {
                        if (e.which == 13) {
                            barcodeLogging = false;
                            self.trigger('barcodescan', currentBarcode);
                            currentBarcode = '';
                        } else {

                            if (e.which != 16 && e.which != 17) {
                                currentBarcode = currentBarcode + String.fromCharCode(e.which);
                            }

                        }
                        return false;
                    }

                    if (e.ctrlKey && e.keyCode == 66) {
                        barcodeLogging = true;
                        return false;
                    }

                    // check for credit card swipe...
                    if (ccSwipeLogging) {
                        // check that the second character is %, otherwise this did not come off the CC swiper...
                        if (e.keyCode != 53 && this.$element.val().length == 1) {
                            ccSwipeLogging = false;
                        }
                    }
                    if (ccSwipeLogging) {
                        console.log(e.keyCode);
                        if (e.keyCode == 13) {
                            var inputVal = this.$element.val();
                            SwipeParser(inputVal, self.options.transaction);
                            ccSwipeLogging = false;
                        }
                    }

                    if (e.keyCode == 16) {
                        ccSwipeLogging = true;
                    }

                    switch (e.keyCode) {
                        case 40:
                            // down arrow
                        case 38:
                            // up arrow
                        case 16:
                            // shift
                        case 17:
                            // ctrl
                        case 18:
                            // alt
                            break

                        case 9:
                            // tab
                        case 13:
                            // enter
                            if (!this.shown) return
                            this.select()
                            break

                        case 27:
                            // escape
                            if (!this.shown) return
                            this.hide()
                            break

                        default:
                            this.lookup()
                    }

                    e.stopPropagation()
                    e.preventDefault()
                },

                matcher: function (item) {
                    var obj = JSON.parse(item);
                    if (obj.type === "rider" && self.options.customerCollection.pluck('id').indexOf(obj.id) == -1) {
                        return false;
                    } else {
                        return~ item.toLowerCase().indexOf(this.query.toLowerCase())
                    }
                },
                sorter: function (items) {
                    var beginswith = [],
                        caseSensitive = [],
                        caseInsensitive = [],
                        item

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
                            self.options.activeProductsCollection.trigger('cartAdd', modelToAdd);
                            break;
                        case 'rider':
                            var modelToAdd = self.options.customerCollection.get(item.id);
                            self.options.transaction.set({
                                selectedRider: modelToAdd
                            });
                            break;
                        case 'class':
                            self.options.transaction.set({
                                userSearchSetting: 'class'
                            });
                            break;
                        case 'allusers':
                            self.setView('.customers_table', new User.Views.List({
                                collection: self.options.customerCollection,
                                transaction: self.options.transaction
                            }));
                            self.options.transaction.set({
                                userSearchSetting: ''
                            });

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
























function SwipeParser(strParse, transactionObj) {
    //boolean values to determine which method to parse
    var blnCarrotPresent = false;
    var blnEqualPresent = false;
    var blnBothPresent = false;

    var strCarrotPresent = strParse.indexOf("^");
    var strEqualPresent = strParse.indexOf("=");

    if (strCarrotPresent > 0) {
        blnCarrotPresent = true;
    }

    if (strEqualPresent > 0) {
        blnEqualPresent = true;
    }

    if (blnEqualPresent == true && blnCarrotPresent == true) {
        //contains both equal and carrot
        strParse = '' + strParse + ' ';
        arrSwipe = new Array(4);
        arrSwipe = strParse.split("^");

        if (arrSwipe.length > 2) {
            account = stripAlpha(arrSwipe[0].substring(1, arrSwipe[0].length));
            account_name = arrSwipe[1];
            exp_month = arrSwipe[2].substring(2, 4);
            exp_year = '20' + arrSwipe[2].substring(0, 2);
            console.log(transactionObj);
            transactionObj.set({cc_name: account_name, cc_number: account, cc_exp_month: exp_month, cc_exp_year: exp_year });
            transactionObj.trigger('credit_card_swiped');

        } else {
            alert("Error Parsing Card.  \r\n Please Contact IT! \r\n");
        }

    } else if (blnCarrotPresent == true) {
        //carrot only delimiter
        strParse = '' + strParse + ' ';
        arrSwipe = new Array(4);
        arrSwipe = strParse.split("^");

        if (arrSwipe.length > 2) {
            account = stripAlpha(arrSwipe[0].substring(1, arrSwipe[0].length));
            account_name = arrSwipe[1];
            exp_month = arrSwipe[2].substring(2, 4);
            exp_year = '20' + arrSwipe[2].substring(0, 2);

            console.log(transactionObj);
            transactionObj.set({cc_name: account_name, cc_number: account, cc_exp_month: exp_month, cc_exp_year: exp_year});
            transactionObj.trigger('credit_card_swiped');

        } else {
            alert("Error Parsing Card.  \r\n Please Contact IT! \r\n");
        }

    } else if (blnEqualPresent == true) {
        //equal only delimiter
        sCardNumber = strParse.substring(1, strEqualPresent);
        sYear = strParse.substr(strEqualPresent + 1, 2);
        sMonth = strParse.substr(strEqualPresent + 3, 2);

        account = sAccountNumber = stripAlpha(sCardNumber);
        exp_month = sMonth
        exp_year = '20' + sYear;
        transactionObj.set({cc_number: account, cc_exp_month: exp_month, cc_exp_year: exp_year});
        transactionObj.trigger('credit_card_swiped');

    } else {
        return GetRunTotal();
    }

}

function stripAlpha(sInput) {
    if (sInput == null) return '';
    return sInput.replace(/[^0-9]/g, '');
}




    return Transaction;
});