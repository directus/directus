define([
  "app",
], function(app) {

	// Messages Container
	var messages = new Backbone.Layout({el: '#messages'});

	// Default Error View
	var ErrorView = Backbone.Layout.extend({

      	showDetails: false,

      	events: {
      		'click button.show-details': function() {
      			this.showDetails = !this.showDetails;
      			this.render();
      		},
      		'click button.close-alert': function() {
      			app.unlockScreen();
      			this.remove();
      		}
      	},

      	template: 'error',

      	serialize: function() {
      		return {message: this.options.message, details: this.options.details, showDetails: this.showDetails}
      	},

      	afterRender: function() {
      		var position = $(window).scrollTop();
      		this.$el.find('.alert-xl').css('margin-top', position);
      	}

     });

    var showProgressNotification = function(message) {
      var position = $(window).scrollTop();
      $('#alert-message').text(message);
      $('#alert').css('margin-top', position);
      $('body').css('cursor', 'progress');
      $('#alert').show();
      app.lockScreen();
    }

    var hideProgressNotification = function() {
      $('#alert').fadeOut('fast');
      $('body').css('cursor', 'default');
      app.unlockScreen();
    }

    // listen to alter events!
    app.on('progress', showProgressNotification);
    app.on('load', hideProgressNotification);

    app.on('alert:error', function(message, details) {
	  var view = new ErrorView({message: message, details: details});
	  hideProgressNotification();
	  app.lockScreen();
	  messages.insertView(view).render();
      view.render();
    });
});