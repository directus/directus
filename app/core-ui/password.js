//  Password Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'password';
  Module.dataTypes = ['VARCHAR'];
  Module.skipSerializationIfNull = true;
  Module.isAPIHashed = false;

  Module.variables = [
    {id: 'require_confirmation', ui: 'checkbox', def: '1'},
    {id: 'salt_field', ui: 'textinput', def: 'salt'}
  ];

  var template = '<label>Change Password <span class="note">{{comment}}</span></label> \
                 <input type="password" name="{{name}}" class="medium password-primary"/> \
                 <button class="btn btn-small btn-primary margin-left password-generate" type="button">Generate New</button> \
                 <button class="btn btn-small btn-primary margin-left password-toggle" type="button">Reveal Password</button> \
                 <span class="password-text"></span> \
                 {{#if require_confirmation}} \
                 <label style="margin-top:12px">Confirm Password</label> \
                 <input type="password" value="{{value}}" class="medium password-confirm"/> \
                 {{/if}}';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    /**
     * Events vary depending on the presence or absence of the confirm password field.
     */
    events: function() {

      var eventsHash = {
        'click .password-generate' : function(e) {
          var length = 10,
              charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
              pass = "";
          for (var i = 0, n = charset.length; i < length; ++i) {
            pass += charset.charAt(Math.floor(Math.random() * n));
          }
          this.$el.find('input.password-primary').val(pass);
          this.$el.find('input.password-confirm').val(pass);
          e.preventDefault();
          return false;
        },

        'click .password-toggle' : function(e) {
          if($(e.target).html() == 'Mask Password'){
            this.$el.find('input.password-primary').get(0).type = 'password';
            this.$el.find('input.password-confirm').get(0).type = 'password';
            $(e.target).html('Reveal Password');
          } else {
            this.$el.find('input.password-primary').get(0).type = 'text';
            this.$el.find('input.password-confirm').get(0).type = 'text';
            $(e.target).html('Mask Password');
            e.preventDefault();
            return false;
          }
        }
      };

      var $password = this.$el.find('input.password-primary'),
          $confirm = this.$el.find('input.password-confirm'),
          changeTargetClass = $confirm.length ? 'password-confirm' : 'password-primary';

      eventsHash['change input.' + changeTargetClass] = function(e) {

        var primaryPass = $password.val();
        if(!primaryPass) {
          return;
        }

        var clearFields = function() {
          $password.val('');
          if($confirm.length) {
            $confirm.val('');
          }
        };

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

        var hashSuccess = function(data, textStatus, jqXHR) {
          console.log(arguments);
          if(!_.isEmpty(data) && !_.isEmpty(data.password)) {
            $password.val(data.password);
            if($confirm.length) {
              $confirm.val(data.password);
            }
            return;
          }
          // @todo alert user that the hashing failed
          clearFields();
        };

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

    serialize: function() {
      return {
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        require_confirmation: (this.options.settings && this.options.settings.has('require_confirmation') && this.options.settings.get('require_confirmation') == '0') ? false : true
      };
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