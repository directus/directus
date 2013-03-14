define([
// Application.
"app"

],

function (app) {

    var User = app.module(),
        searchVal = "";

    User.Collection = Backbone.Collection.extend({
        initialize: function () {
            this.url = '/directus/api/1/extensions/cashregister/customers';
        }
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
       // this.activeProductsCollection = options.activeProductsCollection;
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

    User.Views.Selected = Backbone.Layout.extend({

        prefix: 'extensions/cashregister/templates/',

        template: 'user-selected-form',

        initialize: function () {
        	console.log("selectedRiderview initialized", this.model);
        },

        serialize: function() {
			return this.model.toJSON();
        }

    });

    return User;
});