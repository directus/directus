//  Random Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'core/notification'], function(app, UIComponent, UIView, Notification) {

  'use strict';

  var template = '<input type="text" value="{{value}}" name="{{name}}" class="medium password-primary" style="display:block;margin-bottom:10px;" placeholder="{{ placeholder }}" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"/> \
                  <div> \
                  <button class="btn btn-primary margin-left string-generate" style="margin-right:10px;" type="button">Generate New</button> \
                  <span class="placard generated hide add-color margin-left-small bold">Generated!</span> \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      'click .string-generate': function(e) {
        var $password = this.$el.find('input.password-primary');
        var length = this.options.settings.has('string_length')
                      ? this.options.settings.get('string_length')
                      : 16;

        var randomSuccess = _.bind(function(data, textStatus, jqXHR) {
          if(!_.isEmpty(data) && !_.isEmpty(data.random)) {
            $password.val(data.random);
            this.$el.find('.generated').removeClass('hide');
          } else {
            Notification.error('Random', 'Error generating a random string.');
          }
        }, this);

        $.ajax({
          type: "POST",
          url: app.API_URL + 'random/',
          data: {length: length},
          success: randomSuccess,
          dataType: 'json',
          error: function(data, textStatus, jqXHR) {
            Notification.error('Random', 'Error generating a random string.');
          }
        });
      }
    },

    initialize: function() {
      //
    },

    serialize: function() {
      return {
        name: this.options.name,
        value: this.options.value,
        comment: this.options.schema.get('comment'),
        placeholder: (this.options.settings && this.options.settings.has('placeholder')) ? this.options.settings.get('require_confirma') : ''
      };
    },
  });

  var Component = UIComponent.extend({
    id: 'random',
    dataTypes: ['VARCHAR'],
    variables: [
      {id: 'string_length', ui: 'numeric', char_length: 200, def: 16},
      // Allow the user to input their own value
      {id: 'allow_any_value', ui: 'checkbox', def: '1'},
      // Initial Placeholder text for the UI
      {id: 'placeholder_text', ui: 'textinput', char_length: 200, def: ''},
    ],
    Input: Input,
    validate: function(value, options) {
      var $el = $('input[name="' + options.schema.id + '"]').parent();
      var data = $el.data();
      var randomString = $el.find('input.password-primary').val();

      if(!randomString && options.schema.get('required')) {
        return 'This field is required ['+options.schema.id+'].';
      }
    },
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return new Component();
});
