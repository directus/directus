//  Password Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'app',
  'underscore',
  'core/UIComponent',
  'core/UIView',
  'core/t',
  'core/notification'
], function(app, _, UIComponent, UIView, __t, Notification) {

  'use strict';

  var template = '<input type="password" value="{{value}}" name="{{name}}" class="medium password-primary" style="display:block;margin-bottom:10px;" placeholder="{{t "password_placeholder"}}" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"/> \
                 <input type="password" id="password_fake" class="hidden" autocomplete="off" style="display: none;"> \
                 <span class="password-text"></span> \
                 {{#if require_confirmation}} \
                 <input type="password" value="{{value}}" class="medium password-confirm" style="display:block;margin-bottom:10px;" placeholder="{{t "password_confirm_placeholder"}}" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"/> \
                 {{/if}} \
                 <div style="display:block;"> \
                 <button class="button password-generate" style="margin-right:10px;" type="button">{{t "generate_new"}}</button> \
                 <button class="button password-toggle" style="display:none;" type="button">{{t "reveal_password"}}</button> \
                 <span class="encrypted hidden">{{t "password_encrypted"}}</span> \
                 </div> \
                 ';

  var Input = UIView.extend({
    templateSource: template,

    currentPassword: '',

    /**
     * Events vary depending on the presence or absence of the confirm password field.
     */
    events: function () {
      var $confirm = this.$el.find('input.password-confirm'),
          changeTargetClass = $confirm.length ? 'password-confirm' : 'password-primary';

      var eventsHash = {

        'click .password-generate' : 'onGeneratePassword',

        'click .password-toggle' : 'onPasswordRevealToggle',

        'blur input.password-primary' : 'onPrimaryPasswordLostFocus'
      };

      eventsHash['change input.' + changeTargetClass] = 'onInputChange';

      return eventsHash;
    },

    onGeneratePassword: function (event) {
      var length = 16,
          charset = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
          pass = '',
          self = this,
          $password = this.$el.find('input.password-primary'),
          $confirm = this.$el.find('input.password-confirm'),
          changeTargetClass = $confirm.length ? 'password-confirm' : 'password-primary';

      event.preventDefault();

      for (var i = 0, n = charset.length; i < length; ++i) {
        pass += charset.charAt(Math.floor(Math.random() * n));
      }

      this.$el.find('.password-toggle').show();
      $password.val(pass);
      $confirm.val(pass);

      if ($confirm.length) {
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
          if ($confirm.length) {
            $confirm.attr('disabled','disabled');
          }
        }
      });
    },

    onInputChange: function (event) {
      var $password = this.$el.find('input.password-primary'),
          $confirm = this.$el.find('input.password-confirm'),
          primaryPass = $password.val();

      if (!primaryPass) {
        return;
      }

      if ($confirm.length && primaryPass !== $confirm.val()) {
        Notification.warning(__t('password_do_not_match'));
        return false;
      }
    },

    initialize: function() {
      this.passwordRevealed = false;
    },

    serialize: function () {
      return {
        name: this.options.name,
        value: this.options.value,
        comment: this.options.schema.get('comment'),
        require_confirmation: (this.options.settings.get('require_confirmation') === true)
      };
    },

    showPass: function () {
      // if (!this.currentPlainPassword) {
      //   return;
      // }

      this.$el.find('input.password-primary').get(0).type = 'text';
      this.$el.find('input.password-confirm').get(0).type = 'text';
      // this.$el.find('input.password-primary').get(0).value = this.currentPlainPassword;
      // this.$el.find('input.password-confirm').get(0).value = this.currentPlainPassword;
      this.$el.find('.password-toggle').html(__t('mask_password'));
    },

    hidePass: function () {
      this.$el.find('input.password-primary').get(0).type = 'password';
      this.$el.find('input.password-confirm').get(0).type = 'password';
      this.$el.find('.password-toggle').html(__t('reveal_password'));
    }
  });

  var Component = UIComponent.extend({

    id: 'password',

    dataTypes: ['VARCHAR'],

    skipSerializationIfNull: true,

    variables: [
      // Toggles the second input ("Confirm Password"). On by default.
      {id: 'require_confirmation', default_value: true, type: 'Boolean', ui: 'checkbox'},
      // The name of the column to be used as a salt in the password hash
      {id: 'salt_field', type: 'String', default_value: 'salt', ui: 'textinput'}
    ],

    Input: Input,

    validate: function (value, options) {
      var $el = $('input[name="' + options.schema.id + '"]').parent();
      var password = $el.find('input.password-primary').val(),
        confirm = $el.find('input.password-confirm').val();

      if (options.model.isMine() && !password && options.schema.get('required')) {
        return __t('you_must_specify_a_password');
      }

      if (password && password !== confirm) {
        return __t('password_must_match');
      }
    },

    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return Component;
});
