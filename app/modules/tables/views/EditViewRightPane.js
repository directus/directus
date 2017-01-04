define([
  'core/RightPane',
  'core/widgets/timeline/TimelineWidget'
], function(RightPane, TimelineWidget) {
  return RightPane.extend({

    attributes: {
      class: 'scroll-y wide no-title'
    },

    template: 'modules/tables/edit-right-pane',

    serialize: function() {
      return this.model ? this.model.toJSON() : {};
    },

    beforeRender: function() {
      this.baseView.rightSidebarView.$el.addClass('scroll-y wide no-title');

      this.insertView(new TimelineWidget({model: this.model}));
    }
  });
});
