//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var template = '<style type="text/css"> \
                  label.radiobuttons { \
                    display:inline-block; \
                    margin-right: 20px; \
                    padding: 0 0 4px 0; \
                    font-weight: 500; \
                    font-size: 14px; \
                    cursor: pointer; \
                  } \
                  </style> \
                  <div style="margin-top: 14px;margin-bottom: 10px;"> \
                  {{#options}} \
                    <label class="radiobuttons" for="radio-{{value}}"><input style="margin-top:-3px;" type="radio" name="{{../name}}" value="{{value}}" id="radio-{{value}}" {{#if selected}}checked{{/if}}>{{value}}</label> \
                  {{/options}} \
                  </div>';

  var Input = UIView.extend({
    templateSource: template,

    serialize: function() {
      var options = [];

      if(this.options.settings.get('options')) {
        options = _.map(this.options.settings.get('options').split(','), function(item) {
          return {
            value: item,
            selected: (item === this.options.value)
          };
        }, this);
      }

      return {
        name: this.options.name,
        options: options,
        comment: this.options.schema.get('comment')
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'radiobuttons',
    dataTypes: ['VARCHAR'],
    variables: [
      {id: 'options', type: 'String', def: '', ui: 'textinput', char_length: 100, comment: __t('radiobuttons_options_comment')}
    ],
    Input: Input,
    // @TODO: Not working – not even being called
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    }
  });

  return Component;
});
