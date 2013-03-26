define([
// Application.
"app"

],

function (app) {

    var User = app.module(),
        searchVal = "";


    User.Model = Backbone.Model.extend({
      initialize: function(options) {
        if (options.guest) {
          // this is a guest user... for what its worth...
          this.set({guest: true, first_name: 'Guest', last_name: 'User'});
        }
      }
    });

    User.Collection = Backbone.Collection.extend({
        initialize: function (options) {
            this.url = '/directus/api/1/extensions/cashregister/customers';
            this.options = options;
        },
        model: User.Model
    });


    User.Views.List = Backbone.Layout.extend({
        prefix: 'extensions/cashregister/templates/',

        template: 'customers-table',

        initialize: function (options) {
        	this.transaction = options.transaction;
          this.listenTo(this.collection, {
              "reset": this.render,

              "fetch": function () {
                  this.$('.status').text("Loading...");
              }
          });
        },

        beforeRender: function() {
    			if(this.collection.length > 0) {
		        this.collection.each(function(user) {
		          this.insertView("tbody", new User.Views.Item({
		              model: user,
		              collection: this.collection,
		              transaction: this.transaction
		            }));
		        }, this);
		      } else {
		        // say there are no products....
		      }
        },

        serialize: function () {
            return {
                rows: this.collection.toJSON(),
                searchVal: searchVal
            };
        }

    });

User.Views.Item = Backbone.Layout.extend({
      prefix: 'extensions/cashregister/templates/',

      template: 'customer-row',

      tagName: 'tr',

      events: {
            'click':'setTransactionUser'
      },

      initialize: function(options) {
      	this.transaction = options.transaction;
        this.listenTo(this.model, {
          "change": this.render
        });
       
      },

      setTransactionUser:function() {
      	this.transaction.set({selectedRider: this.model});
       	console.log("setTransactionUser", this.model);
      },

      serialize: function() {
        return this.model.toJSON();
      }
});


    User.Views.PaymentTypeRadio = Backbone.Layout.extend({
          prefix: 'extensions/cashregister/templates/',

          template: 'payment_type_radio',

          tagName: 'li',

          initialize: function() {
            console.log("instant of paymenttyperadio", this.model);
            this.listenTo(this.model, {
              'change': this.render
            })
          },

          serialize: function() {
              return 
                  this.model.toJSON()
          }
      });
    User.Views.Selected = Backbone.Layout.extend({

        prefix: 'extensions/cashregister/templates/',

        template: 'user-selected-form',

        initialize: function (options) {
          console.log("options", options);
          this.options = options;
          this.listenTo(options.transaction, {
            'change:selected_payment_type':this.render
          });
          this.listenTo(options.paymentTypes, {
            'reset': this.render
          })
        },

        beforeRender: function() {
            this.options.paymentTypes.each(function(payment_type) {
              this.insertView(".payment_options", new User.Views.PaymentTypeRadio({
                  model: payment_type
              }));
            }, this);
        },

        serialize: function() {
			     return { user: this.model.toJSON(), transaction: this.options.transaction.toJSON() }
        }

    });

    return User;
});