/* global $ */
define(['underscore', 'core/UIView', 'core/t', 'core/notification'], function (_, UIView, __t, Notification) {
  'use strict';

  return UIView.extend({
    template: 'password/input',

    currentPassword: '',

    /**
     * Events vary depending on the presence or absence of the confirm password field.
     */
    events: function () {
      var $confirm = this.$el.find('input.password-confirm');
      var changeTargetClass = $confirm.length ? 'password-confirm' : 'password-primary';

      var eventsHash = {
        'click .password-generate': 'onGeneratePassword',

        'click .password-toggle': 'onPasswordRevealToggle',

        'blur input.password-primary': 'onPrimaryPasswordLostFocus'
      };

      eventsHash['change input.' + changeTargetClass] = 'onInputChange';

      return eventsHash;
    },

    onGeneratePassword: function (event) {
      var length = 16;
      var charset = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var pass = '';
      var self = this;
      var $password = this.$el.find('input.password-primary');
      var $confirm = this.$el.find('input.password-confirm');
      var changeTargetClass = $confirm.length ? 'password-confirm' : 'password-primary';

      event.preventDefault();

      for (var i = 0, n = charset.length; i < length; ++i) {
        pass += charset.charAt(Math.floor(Math.random() * n));
      }

      this.$el.find('.password-toggle').show();
      $password.val(pass);
      $confirm.val(pass);

      if ($confirm.length > 0) {
        $confirm.removeAttr('disabled');
      }

      var $onChangeInput = self.$el.find('input.' + changeTargetClass);
      $onChangeInput.one('blur', function () {
        $onChangeInput.trigger('change');
        self.hidePass();
      });

      this.showPass();
      $onChangeInput.trigger('focus');
    },

    onPasswordRevealToggle: function (event) {
      event.preventDefault();

      this.passwordRevealed = !this.passwordRevealed;

      if (this.passwordRevealed) {
        this.showPass();
      } else {
        this.hidePass();
      }
    },

    onPrimaryPasswordLostFocus: function (event) {
      var $input = $(event.currentTarget);
      var $confirm = this.$el.find('input.password-confirm');

      if (!_.isEmpty($.trim($input.val()))) {
        this.$el.find('.password-toggle').show();
        this.$el.find('input[type=password]').data('oldVal', undefined);

        return;
      }

      this.$el.find('input[type=password]').each(function () {
        var val = $(this).val();

        if (_.isEmpty(val) && $(this).data('oldVal')) {
          $(this).val($(this).data('oldVal'));
          if ($confirm.length > 0) {
            $confirm.attr('disabled', 'disabled');
          }
        }
      });
    },

    onInputChange: function () {
      var $password = this.$el.find('input.password-primary');
      var $confirm = this.$el.find('input.password-confirm');
      var primaryPass = $password.val();

      if (!primaryPass) {
        return;
      }

      if ($confirm.length > 0 && primaryPass !== $confirm.val()) {
        Notification.warning(__t('password_do_not_match'));
        return false;
      }

      this.model.set(this.name, primaryPass);
    },

    initialize: function () {
      this.passwordRevealed = false;
    },

    serialize: function () {
      return {
        name: this.options.name,
        value: this.options.value,
        comment: this.options.schema.get('comment'),
        require_confirmation: (this.options.settings.get('require_confirmation') === true),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      };
    },

    showPass: function () {
      // If (!this.currentPlainPassword) {
      //   return;
      // }

      this.$el.find('input.password-primary').get(0).type = 'text';
      this.$el.find('input.password-confirm').get(0).type = 'text';
      // This.$el.find('input.password-primary').get(0).value = this.currentPlainPassword;
      // this.$el.find('input.password-confirm').get(0).value = this.currentPlainPassword;
      this.$el.find('.password-toggle').html(__t('mask_password'));
    },

    hidePass: function () {
      this.$el.find('input.password-primary').get(0).type = 'password';
      this.$el.find('input.password-confirm').get(0).type = 'password';
      this.$el.find('.password-toggle').html(__t('reveal_password'));
    }
  });
});
