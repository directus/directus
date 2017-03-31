//  Password Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

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

    /**
     * Events vary depending on the presence or absence of the confirm password field.
     */
    events: function() {
      var $password = this.$el.find('input.password-primary'),
          $confirm = this.$el.find('input.password-confirm'),
          changeTargetClass = $confirm.length ? 'password-confirm' : 'password-primary';

      var eventsHash = {
        'keydown input.password-primary': function(e) {
          if($confirm.length) {
            if(this.$el.data('wasAPIHashed') || this.$el.data('isAPIHashed')) {
              $confirm.val("");
              $confirm.removeAttr('disabled');
              this.$el.data('wasAPIHashed', false);
              this.$el.data('isAPIHashed', false);
            }
          }
        },

        'click .password-generate' : function(e) {
          var length = 10,
              charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
              pass = "";
          for (var i = 0, n = charset.length; i < length; ++i) {
            pass += charset.charAt(Math.floor(Math.random() * n));
          }
          this.currentPlainPassword = pass;
          this.$el.find('.password-toggle').show();
          this.$el.data('isAPIHashed', false);
          this.$el.data('wasAPIHashed', false);
          this.$el.find('.encrypted').addClass('hidden');
          this.$el.find('input.password-primary').val(pass);
          this.$el.find('input.password-confirm').val(pass);
          if($confirm.length) {
            $confirm.removeAttr('disabled');
          }

          var $onChangeInput = this.$el.find('input.' + changeTargetClass);
          var that = this;
          $onChangeInput.one('blur', function(e) {
            $onChangeInput.trigger('change');
            that.hidePass();
          });
          this.showPass();
          $onChangeInput.trigger('focus');

          e.preventDefault();
          return false;
        },

        'click .password-toggle' : function(e) {
          if($(e.target).html() === __t('mask_password')){
            this.hidePass(e);
          } else {
            this.showPass(e);
            e.preventDefault();
            return false;
          }
        },

        'blur input.password-primary' : function(e) {
          if(!_.isEmpty($.trim($(e.target).val()))) {
            this.currentPlainPassword = $(e.target).val();
            this.$el.find('.password-toggle').show();
            this.$el.data('wasAPIHashed', this.$el.data('isAPIHashed'));
            this.$el.data('isAPIHashed', false);
            this.$el.find('input[type=password]').data('oldVal', undefined);
            return;
          }
          var that = this;
          this.$el.find('input[type=password]').each(function(e) {
            var val = $(this).val();
            if(_.isEmpty(val) && $(this).data('oldVal')) {
              $(this).val($(this).data('oldVal'));
              that.$el.data('isAPIHashed', true);
              that.$el.data('wasAPIHashed', false);
              that.$el.find('.encrypted').removeClass('hidden');
              if($confirm.length) {
                $confirm.attr('disabled','disabled');
              }
            }
          });
        },
      };

      eventsHash['change input.' + changeTargetClass] = function(e) {
        var primaryPass = $password.val();
        if(!primaryPass) {
          return;
        }

        var clearFields = _.bind(function() {
          this.$el.data('isAPIHashed', false);
          this.$el.find('.encrypted').addClass('hidden');
          $password.val('');
          this.currentPlainPassword = '';
          this.$el.find('.password-toggle').hide();
          if($confirm.length) {
            $confirm.val('');
            $confirm.removeAttr('disabled');
          }
        }, this);

        if($confirm.length) {
          if(primaryPass !== $confirm.val()) {
            alert(__t('password_do_not_match'));
            return false;
          }
        }

        var hashParams = {password:primaryPass};
        var saltField = this.options.settings.get('salt_field');
        var $saltInput = this.$el.closest('form').find('input[name='+saltField+']');
        if($saltInput.length) {
          hashParams.salt = $.trim($saltInput.val());
          if(_.isEmpty(hashParams.salt)) {
            alert(__t('password_salt_is_not_defined'));
            return false;
          }
        }

        var hashSuccess = _.bind(function(data, textStatus, jqXHR) {
          if(!_.isEmpty(data) && !_.isEmpty(data.password)) {
            $password.val(data.password);
            if($confirm.length) {
              $confirm.val(data.password);
              $confirm.attr('disabled','disabled');
            }
            this.$el.find('.encrypted').removeClass('hidden');
            this.$el.data('isAPIHashed', true);
            return;
          }
          // @todo alert user that the hashing failed
          clearFields();
        }, this);

        $.ajax({
          type: "POST",
          url: app.API_URL + 'hash/',
          data: hashParams,
          success: hashSuccess,
          dataType: 'json',
          error: function(data, textStatus, jqXHR) {
            // @todo alert user that the hashing failed
            clearFields();
          }
        });
      };

      return eventsHash;
    },

    initialize: function() {
      this.$el.data('isAPIHashed', false);
      this.$el.data('wasAPIHashed', true);
    },

    serialize: function() {
      return {
        name: this.options.name,
        value: this.options.value,
        comment: this.options.schema.get('comment'),
        require_confirmation: (this.options.settings.get('require_confirmation') === true)
      };
    },

    showPass: function() {
      if (!this.currentPlainPassword) {
        return;
      }

      this.$el.find('input.password-primary').get(0).type = 'text';
      this.$el.find('input.password-confirm').get(0).type = 'text';
      this.$el.find('input.password-primary').get(0).value = this.currentPlainPassword;
      this.$el.find('input.password-confirm').get(0).value = this.currentPlainPassword;
      this.$el.find('.password-toggle').html(__t('mask_password'));
    },

    hidePass: function() {
      this.$el.find('input.password-primary').get(0).type = 'password';
      this.$el.find('input.password-confirm').get(0).type = 'password';
      this.$el.find('.password-toggle').html(__t('reveal_password'));
    }
  });

  var Component = UIComponent.extend({
    id: 'password',
    dataTypes: ['VARCHAR'],
    skipSerializationIfNull: true,
    isAPIHashed: false,
    // Plain password before being saved.
    currentPlainPassword: '',
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
        // @NOTE: Password UI won't be in charge to hash the plain text password
        // if (!$el.data().isAPIHashed && !$el.data().wasAPIHashed) {
        //   return __t('you_must_hash_your_password');
        // }
      }
    },
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return Component;
});
