define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: 'core/widgets/save-widget',

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },
    serialize: function() {
      return this.options.widgetOptions;
    },
    setSaved: function(isSaved) {
      this.options.widgetOptions.isUpToDate = isSaved;
      this.render();
    },
    initialize: function(options) {
      if(!options.widgetOptions) {
        this.options.widgetOptions = {isUpToDate: true};
      }
    }
  });
});
