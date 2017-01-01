define([
  'core/RightPane'
], function(RightPane) {
  return RightPane.extend({

    attributes: {
      class: 'scroll-y wide no-title'
    },

    template: 'modules/tables/edit-right-pane',

    beforeRender: function() {
      this.baseView.rightSidebarView.$el.addClass('scroll-y wide no-title');
    }
  });
});
