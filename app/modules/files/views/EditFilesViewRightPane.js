define([
  'app',
  'core/RightPane',
  'core/widgets/timeline/TimelineWidget',
  'core/widgets/FilesMetadataWidget',
  'core/widgets/StatusWidget'
], function(app, RightPane, TimelineWidget, FilesMetadataWidget, StatusWidget) {

  return RightPane.extend({

    attributes: {
      class: 'scroll-y wide no-title'
    },

    beforeRender: function() {
      var table = this.model.table;
      // var statusColumnName = table ? table.getStatusColumnName() : app.statusMapping.get('*').get('status_name');

      this.baseView.rightSidebarView.$el.addClass('scroll-y wide no-title');

      // if (this.model.has(statusColumnName)) {
      //   this.insertView(new StatusWidget({model: this.model}));
      // }

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
  });
});
