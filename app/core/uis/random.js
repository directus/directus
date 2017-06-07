//  Random Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'app',
  'jquery',
  'underscore',
  'core/UIComponent',
  'core/UIView',
  'core/notification',
  'core/t'
], function (app, $, _, UIComponent, UIView, Notification, __t) {

  'use strict';

  var template = '<input type="text" value="{{value}}" name="{{name}}" class="medium password-primary" style="display:block;margin-bottom:10px;" placeholder="{{ placeholder }}" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" {{#if readonly}}readonly{{/if}}/> \
                  <div> \
                  <button class="btn btn-primary margin-left string-generate" style="margin-right:10px;" type="button">{{t "generate_new"}}</button> \
                  <span class="placard generated hide add-color margin-left-small bold">{{t "generated"}}</span> \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      'click .string-generate': function (event) {
        var length = this.options.settings.get('string_length')

        this.generateString(length);
      }
    },

    generateString: function (length) {
      length = (length || 16);
      var randomSuccess = _.bind(function (data, textStatus, jqXHR) {
        if(!_.isEmpty(data) && !_.isEmpty(data.random)) {
          this.$el.find('input.password-primary').val(data.random);
          this.$el.find('.generated').removeClass('hide');
        } else {
          Notification.error('Random', __t('error_generating_a_random_string'));
        }
      }, this);

      // TODO: Generate random string locally
      // unless we implement different server generation token script
      $.ajax({
        type: 'POST',
        url: app.API_URL + 'random/',
        data: {length: length},
        success: randomSuccess,
        dataType: 'json',
        error: function (data, textStatus, jqXHR) {
          Notification.error('Random', __t('error_generating_a_random_string'));
        }
      });
    },

    initialize: function () {
      if (!this.options.value && this.options.settings.get('auto_generate') === true) {
        var length = this.options.settings.get('string_length') || 16;

        this.generateString(length);
      }
    },

    serialize: function () {
      return {
        name: this.options.name,
        value: this.options.value,
        readonly: this.options.settings.get('allow_any_value') !== true,
        comment: this.options.schema.get('comment'),
        placeholder: this.options.settings.get('placeholder_text')
      };
    },
  });

  var Component = UIComponent.extend({
    id: 'random',
    dataTypes: ['VARCHAR'],
    variables: [
      {id: 'string_length', type: 'Number', default_value: 16, ui: 'numeric', char_length: 200},
      // Allow the user to input their own value
      {id: 'allow_any_value', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'auto_generate',  type: 'Boolean', default_value: false, ui: 'checkbox'},
      // Initial Placeholder text for the UI
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
    ],
    Input: Input,
    validate: function (value, options) {
      var $el = $('input[name="' + options.schema.id + '"]').parent();
      var data = $el.data();
      var randomString = $el.find('input.password-primary').val();

      if(!randomString && options.schema.get('required')) {
        return 'This field is required ['+options.schema.id+'].';
      }
    },
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return Component;
});
