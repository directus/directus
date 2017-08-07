define([
  'app',
  'underscore',
  'backbone',
  'core/notification'
], function (app, _, Backbone, Notification) {

  return Backbone.Layout.extend({

    template: 'modules/messages/message-new',

    tagName: 'form',

    events: {
      'keyup textarea': 'toggleButtons',
      'keydown textarea': 'toggleButtons',
      'change textarea': 'toggleButtons',
      'focus textarea': 'toggleButtons',
      'blur textarea': 'toggleButtons',
      'focus .reply textarea': 'activeReplyArea',
      'blur .reply textarea': 'deActiveReplyArea',
      'click .js-button-send': 'sendMessage'
    },

    activeReplyArea: function (event) {
      this.$('.reply').addClass('active');
    },

    deActiveReplyArea: function (event) {
      var $el = $(event.currentTarget);
      if (!$el.val().trim().length) {
        this.$('.reply').removeClass('active');
      }
    },

    toggleButtons: function (event) {
      var $el = $(event.currentTarget);
      var $group = this.$('.compose .button-group .button, .reply .button-group .button');

      if ($el.val().trim().length > 0) {
        $group.removeClass('hidden');
      } else {
        $group.addClass('hidden');
      }
    },

    sendMessage: function (event) {
      event.preventDefault();

      var data = this.$el.serializeObject();

      if (this.options.parentModel) {
        this.sendResponse(data);
      } else {
        this.sendNewMessage(data);
      }
    },

    sendNewMessage: function (data) {
      var options = {};
      var collection = this.model.collection;
      var model = this.model;
      var errors;

      errors = model.validate(data, {validateAttributes: true});
      if (errors) {
        this.model.trigger('invalid', this.model, errors);
        return;
      }

      data.read = 1;
      options.wait = true;
      options.success = function (model, resp) {
        collection.add(model);
        // @NOTE: Do we need/use those warning message?
        if (resp.warning) {
          Notification.warning(null, resp.warning, {timeout: 5000});
        }
      };

      model.save(data, options);
    },

    sendResponse: function (data) {
      var parentMessageModel = this.options.parentModel;
      var newResponseModel = this.model;
      var collection = parentMessageModel.get('responses');

      var recipients = _.map(parentMessageModel.get('recipients').split(','), function(id) {
        return '0_' + id;
      });

      recipients.push('0_' + newResponseModel.get('from'));

      var attrs = _.extend({
        'from': app.user.id,
        'subject': 'RE: ' + parentMessageModel.get('subject'),
        'recipients': recipients.join(','),
        'response_to': parentMessageModel.id,
        'responses': []
      }, data);

      var self = this;
      var success = function (model) {
        collection.add(model);
        // create a new model after one has been successfully sent
        self.model = self.model.clone();
        self.model.clear();
        self.model.set('from', app.user.id);

        self.render();
      };

      // @TODO: Get ID after create message
      // Create an API endpoint for new messages
      // returning a JSON with the new message
      newResponseModel.save(attrs, {wait: true, success: success});
    },

    serialize: function () {
     var user = app.user;

     return {
       model: this.model,
       isResponse: this.options.parentModel,
       canSendMessages: app.user.canSendMessages(),
       view: {
         recipients: {
           parent: this,
           model: this.model,
           attr: 'recipients',
           options: {
             structure: this.model.structure
           }
         },
         attachments: {
           parent: this,
           model: this.model,
           attr: 'attachment',
           options: {
             structure: this.model.structure
           }
         }
       },
       user: user.toJSON()
     };
    }
  });
});
