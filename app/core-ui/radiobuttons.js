//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'radiobuttons';
  Module.dataTypes = ['VARCHAR'];

  Module.variables = [
    {id: 'options', ui: 'textinput', 'char_length': 100, 'comment': 'Use a JSON object'}
  ];

  var template = '<style type="text/css"> \
                  label.radiobuttons { \
                    font-weight:normal; \
                    display:inline; \
                    margin-right: 10px; \
                    padding: 4px; \
                  } \
                  </style> \
                  {{#options}} \
                    <input style="margin-top:-3px;" type="radio" name="{{../name}}" value="{{value}}" id="radio-{{value}}" {{#if selected}}checked{{/if}}><label class="radiobuttons" for="radio-{{value}}">{{value}}</label> \
                  {{/options}}';

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    serialize: function() {
      var options = _.map(this.options.settings.get('options').split(','), function(item) {
        return {
          value: item,
          selected: (item === this.options.value)
        };
      }, this);

      return {
        name: this.options.name,
        options: options,
        comment: this.options.schema.get('comment')
      };
    }

  });

  Module.list = function(options) {
    return options.value;
  };

  return Module;

});