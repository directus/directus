define([
  'backbone'
],
function(Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <li class="input-and-button"> \
          {{#if button}}<button class="tool-item large-circle" id="addBtn" title="{{button.title}}"><span class="icon icon-plus"</button>{{/if}} \
      </li>'
    ),

    serialize: function() {
      return this.options.widgetOptions;
    }
  });
});