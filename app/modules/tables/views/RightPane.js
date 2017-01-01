define([
    'app',
    'backbone'
  ],

  function(app, Backbone) {

    return Backbone.Layout.extend({
      template: 'modules/tables/right-pane'
    });
  });
