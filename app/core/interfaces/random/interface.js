/* global $ */
define([
  'app',
  'underscore',
  'core/UIView',
  'core/notification',
  'core/t'
], function (app, _, UIView, Notification, __t) {
  'use strict';

  return UIView.extend({
    template: 'random/interface',

    events: {
      'input input': 'onInputChange',
      'click .string-generate': function () {
        var length = this.options.settings.get('string_length');
        var type = this.options.settings.get('type_of_value');

        this.generateString(length, type);
      }
    },

    onInputChange: function (event) {
      var $target = $(event.currentTarget);

      this.model.set(this.name, $target.val());
    },

    generateString: function (length, type) {
      length = (length || this.options.settings.get('string_length') || 32);
      type = (type || this.options.settings.get('type_of_value') || 'alphanumeric');

      var randomSuccess = _.bind(function (resp) {
        var randomString;

        if (!_.isEmpty(resp) && !_.isEmpty(resp.data.random)) {
          randomString = resp.data.random;
          this.$('input.password-primary').val(randomString);
          this.$('.generated').removeClass('hidden');
          this.model.set(this.name, randomString);
        } else {
          Notification.error('Random', __t('error_generating_a_random_string'));
        }
      }, this);

      // TODO: Generate random string locally
      $.ajax({
        type: 'POST',
        url: app.API_URL + 'random/',
        data: {length: length, type: type},
        success: randomSuccess,
        dataType: 'json',
        error: function () {
          Notification.error('Random', __t('error_generating_a_random_string'));
        }
      });
    },

    initialize: function () {
      if (!this.options.value && this.options.settings.get('auto_generate') === true) {
        this.generateString();
      }
    },

    serialize: function () {
      return {
        name: this.options.name,
        value: this.options.value,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        comment: this.options.schema.get('comment'),
        placeholder: this.options.settings.get('placeholder')
      };
    }
  });
});
