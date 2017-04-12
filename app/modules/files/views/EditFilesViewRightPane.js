define([
  'app',
  'core/RightPaneWide',
  'core/widgets/timeline/TimelineWidget',
  'core/widgets/FilesMetadataWidget',
  'core/widgets/StatusWidget'
], function(app, RightPaneWide, TimelineWidget, FilesMetadataWidget) {

  return RightPaneWide.extend({

    attributes: {
      class: 'scroll-y wide no-title'
    },

    beforeRender: function () {
      this.baseView.rightSidebarView.$el.addClass('scroll-y wide no-title');

      if (!this.model.isNew()) {
        this.insertView(new FilesMetadataWidget.View({
          model: new FilesMetadataWidget.Model({}, {
            table: this.model.table,
            recordId: this.model.id
          }),
          itemModel: this.model
        }));

        if (!this.model.isNew()) {
          this.insertView(new TimelineWidget({model: this.model}));
        }
      }
    }
  });
});
