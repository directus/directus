define([
  'backbone'
],
function(Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
        {{#if title}}<button class="btn btn-primary btn-top" id="btn-top">{{title}}</button>{{/if}} \
        {{#if button}}<button class="tool-item large-circle" id="addBtn" title="{{button.title}}"><span class="icon icon-plus"></span></button>{{/if}}'
    ),

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },

    serialize: function() {
      return this.options.widgetOptions;
    }
  });
});