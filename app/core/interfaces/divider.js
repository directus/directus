define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var template =  '<h3>{{title}}</h3>';

  var Input = UIView.extend({

    templateSource: template,

    fieldClass: 'break-header',

    hideLabel: true,

    afterRender: function() {
      //
    },

    serialize: function() {
      return {
        title: this.options.settings.get('title')
      };
    },

    initialize: function() {
      //
    }
  });

  var Component = UIComponent.extend({
    id: 'divider',
    dataTypes: ['VARCHAR', 'TEXT'],
    variables: [
      {id: 'text', type: 'String', default_value: '', ui: 'textinput'}
    ],
    Input: Input,
    list: function(options) {
      return options.settings.get('title');
    }
  });

  return Component;
});
