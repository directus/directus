define([
// Application.
"app"

],

function (app) {

    var User = app.module(),
        searchVal = "";

    User.Collection = Backbone.Collection.extend({
        initialize: function (options) {
            this.url = '/directus/api/1/extensions/cashregister/customers';
            this.options = options;
            this.listenTo(options.transaction, {
            	"change:userSearchSetting":this.handleUserSearchSetting
            });
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

        initialize: function (options) {
          console.log("options", options);
          this.options = options;
        	console.log("selectedRiderview initialized", this.model);
          this.listenTo(options.transaction, {
            'credit_card_swiped':this.process_credit_card_swipe
          });
        },

        process_credit_card_swipe: function() {
          this.$('#payment_type_credit_card').prop('checked', true);
          this.$('#credit_card_name').val(this.options.transaction.get('cc_name'));
          this.$('#credit_card_number').val(this.options.transaction.get('cc_number'));
          this.$('#credit_card_exp_month').val(this.options.transaction.get('cc_exp_month'));
          this.$('#credit_card_exp_year').val(this.options.transaction.get('cc_exp_year'));
        },

        serialize: function() {
			     return this.model.toJSON();
        }

    });

    return User;
});