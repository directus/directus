//  Password Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'password';
  Module.dataTypes = ['VARCHAR'];
  Module.skipSerializationIfNull = true;
  Module.isAPIHashed = false;

  Module.variables = [
    {id: 'require_confirmation', ui: 'checkbox', def: '1'},
    {id: 'salt_field', ui: 'textinput', def: 'salt'}
  ];

  var template = '<input type="password" value="{{value}}" name="{{name}}" class="medium password-primary" style="display:block;margin-bottom:10px;" placeholder="Password" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"/> \
                 <span class="password-text"></span> \
                 {{#if require_confirmation}} \
                 <input type="password" value="{{value}}" class="medium password-confirm" style="display:block;margin-bottom:10px;" placeholder="Confirm Password" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"/> \
                 {{/if}} \
                 <div style="display:block;"> \
                 <button class="btn btn-small btn-primary margin-left password-generate" style="margin-right:10px;" type="button">Generate New</button> \
                 <button class="btn btn-small btn-primary margin-left password-toggle" type="button">Reveal Password</button> \
                 <span class="placard encrypted hide add-color margin-left-small bold">Encrypted!</span> \
                 </div> \
                 ';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    /**
     * Events vary depending on the presence or absence of the confirm password field.
     */
    events: function() {

      var $password = this.$el.find('input.password-primary'),
          $confirm = this.$el.find('input.password-confirm'),
          changeTargetClass = $confirm.length ? 'password-confirm' : 'password-primary';

      var eventsHash = {

        'focus input.password-primary' : function(e) {
          if(this.$el.data('isAPIHashed')) {
            var that = this;
            this.$el.find('input[type=password]').each(function(e) {
              var val = $(this).val();
              if(!_.isEmpty(val)) {
                $(this).data('oldVal', val);
                $(this).val('');
                that.$el.data('wasAPIHashed', that.$el.data('isAPIHashed'));
                that.$el.find('.encrypted').addClass('hide');
                $confirm.removeAttr('disabled');
              }
            });
          }
        },

        'blur input.password-primary' : function(e) {
          if(!_.isEmpty($.trim($(e.target).val()))) {
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

        'click .password-generate' : function(e) {
          var length = 10,
              charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
              pass = "";
          for (var i = 0, n = charset.length; i < length; ++i) {
            pass += charset.charAt(Math.floor(Math.random() * n));
          }
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
        }
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
          if($confirm.length) {
            $confirm.val('');
            $confirm.removeAttr('disabled');
          }
        }, this);

        // @todo run UI validation (e.g. for matching passwords)
        var hashParams = {password:primaryPass};
        var saltField = this.options.settings.has('salt_field') ? this.options.settings.get('salt_field') : false;
        if(saltField) {
          var $saltInput = this.$el.closest('form').find('input[name='+saltField+']');
          if($saltInput.length) {
            hashParams.salt = $.trim($saltInput.val());
            if(_.isEmpty(hashParams.salt)) {
              // @todo throw alert that the salt needs definition
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
      this.$el.data('wasAPIHashed', false);
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
      this.$el.find('input.password-primary').get(0).type = 'text';
      this.$el.find('input.password-confirm').get(0).type = 'text';
      this.$el.find('.password-toggle').html('Mask Password');
    },

    hidePass: function() {
      this.$el.find('input.password-primary').get(0).type = 'password';
      this.$el.find('input.password-confirm').get(0).type = 'password';
      this.$el.find('.password-toggle').html('Reveal Password');
    }

  });

  Module.validate = function(value,options) {

    // need access to peer element somehow.

    // var $el = this.Input.$el,
    //     password = $el.find('input.password-primary'),
    //     confirm = $el.find('input.password-confirm');
    // if(password !== confirm) {
    //   return "Passwords must match.";
    // }
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});