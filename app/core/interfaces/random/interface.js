define([
  'core/underscore',
  'core/UIView',
  'core/notification',
  'core/t'
], function (_, UIView, Notification, __t) {

  'use strict';

  return UIView.extend({
    template: 'random/interface',

    events: {
      'click .string-generate': function(e) {
        var length = this.options.settings.get('string_length');

        this.generateString(length);
      }
    },

    generateString: function(length) {
      length = (length || this.options.settings.get('string_length') || 32);
      var randomSuccess = _.bind(function(resp, textStatus, jqXHR) {
        if(!_.isEmpty(resp) && !_.isEmpty(resp.data.random)) {
          this.$el.find('input.password-primary').val(resp.data.random);
          this.$el.find('.generated').removeClass('hide');
        } else {
          Notification.error('Random', __t('error_generating_a_random_string'));
        }
      }, this);

      // TODO: Generate random string locally
      $.ajax({
        type: "POST",
        url: app.API_URL + 'random/',
        data: {length: length},
        success: randomSuccess,
        dataType: 'json',
        error: function(data, textStatus, jqXHR) {
          Notification.error('Random', __t('error_generating_a_random_string'));
        }
      });
    },

    initialize: function() {
      if (!this.options.value && this.options.settings.get('auto_generate') === true) {
        this.generateString();
      }
    },

    serialize: function() {
      return {
        name: this.options.name,
        value: this.options.value,
        readonly: this.options.settings.get('allow_any_value') !== true,
        comment: this.options.schema.get('comment'),
        placeholder: this.options.settings.get('placeholder_text')
      };
    }
  });
});
