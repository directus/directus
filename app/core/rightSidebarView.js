define([
  'app',
  'backbone'
], function(app, Backbone) {

  return Backbone.Layout.extend({
    attributes: {
      id: 'rightSidebar',
      class: 'right-sidebar'
    }
  });
});
