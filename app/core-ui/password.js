//  Password Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

  var template = '<input type="password" value="{{value}}" name="{{name}}" class="medium password-primary" style="display:block;margin-bottom:10px;" placeholder="Password" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"/> \
                 <input type="password" id="password_fake" class="hidden" autocomplete="off" style="display: none;"> \
                 <span class="password-text"></span> \
                 {{#if require_confirmation}} \
                 <input type="password" value="{{value}}" class="medium password-confirm" style="display:block;margin-bottom:10px;" placeholder="Confirm Password" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"/> \
                 {{/if}} \
                 <div style="display:block;"> \
                 <button class="btn btn-primary margin-left password-generate" style="margin-right:10px;" type="button">Generate New</button> \
                 <button class="btn btn-primary margin-left password-toggle" style="display:none;" type="button">Reveal Password</button> \
                 <span class="placard encrypted hide add-color margin-left-small bold">Encrypted!</span> \
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
          this.$el.find('.encrypted').addClass('hide');
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
          if($(e.target).html() == 'Mask Password'){
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
              that.$el.find('.encrypted').removeClass('hide');
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
          this.$el.find('.encrypted').addClass('hide');
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
            alert("Passwords do not Match!");
            return false;
          }
        }

        var hashParams = {password:primaryPass};
        var saltField = this.options.settings.has('salt_field') ? this.options.settings.get('salt_field') : false;
        if(saltField) {
          var $saltInput = this.$el.closest('form').find('input[name='+saltField+']');
          if($saltInput.length) {
            hashParams.salt = $.trim($saltInput.val());
            if(_.isEmpty(hashParams.salt)) {
              alert("Salt is not Defined! (Malformed Table Setup)");
              return false;
            }
          }
        }

        var hashSuccess = _.bind(function(data, textStatus, jqXHR) {
          if(!_.isEmpty(data) && !_.isEmpty(data.password)) {
            $password.val(data.password);
            if($confirm.length) {
              $confirm.val(data.password);
              $confirm.attr('disabled','disabled');
            }
            this.$el.find('.encrypted').removeClass('hide');
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
        require_confirmation: (this.options.settings && this.options.settings.has('require_confirmation') && this.options.settings.get('require_confirmation') == '0') ? false : true
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
      this.$el.find('.password-toggle').html('Mask Password');
    },

    hidePass: function() {
      this.$el.find('input.password-primary').get(0).type = 'password';
      this.$el.find('input.password-confirm').get(0).type = 'password';
      this.$el.find('.password-toggle').html('Reveal Password');
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
      {id: 'require_confirmation', ui: 'checkbox', def: '1'},
      // The name of the column to be used as a salt in the password hash
      {id: 'salt_field', ui: 'textinput', def: 'salt'}
    ],
    Input: Input,
    validate: function(value, options) {
      var $el = $('input[name="' + options.schema.id + '"]').parent();
      var data = $el.data();
      var password = $el.find('input.password-primary').val(),
        confirm = $el.find('input.password-confirm').val();

      if(!password && options.schema.get('required')) {
        return "You Must Specify a Password";
      }

      if(password) {
        if(password !== confirm) {
          return "Passwords must match.";
        }
        if(!$el.data().isAPIHashed && !$el.data().wasAPIHashed) {
          return "You Must Hash Your Password";
        }
      }
    },
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return new Component();
});
