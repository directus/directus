define([
  'app',
  'backbone',
  'core/notification'
], function (app, Backbone, Notification) {

  return Backbone.Layout.extend({

    template: 'modules/messages/message-new',

    events: {
      'keyup textarea': 'toggleButtons',
      'keydown textarea': 'toggleButtons',
      'change textarea': 'toggleButtons',
      'focus textarea': 'toggleButtons',
      'blur textarea': 'toggleButtons',
      'click .js-button-send': 'sendMessage'
    },

    toggleButtons: function (event) {
      var $el = $(event.currentTarget);
      var $group = this.$('.compose .button-group .button');

      if ($el.val().trim().length > 0) {
        $group.removeClass('hidden');
      } else {
        $group.addClass('hidden');
      }
    },

    sendMessage: function (event) {
      event.preventDefault();

      var data = this.$('form').serializeObject();
      var options = {};

      data.read = 1;
      options.success = function (model, resp) {
        // @NOTE: Do we need/use those warning message?
        if (resp.warning) {
          Notification.warning(null, resp.warning, {timeout: 5000});
        }
      };

      this.model.save(data, options);

      this.model.collection.add(this.model);
    },

    serialize: function () {
     var user = app.users.getCurrentUser();

     return {
       model: this.model,
       view: {
         parent: this,
         model: this.model,
         attr: 'recipients',
         options: {structure: this.model.structure}
       },
       user: user.toJSON()
     };
    }
  });
});
