define([
  'app',
  'core/widgets/MetadataWidget',
  'underscore',
  'core/t',
  'helpers/file'
], function(app, MetadataWidget, _, __t, FileHelper) {

  'use strict';

  var MetadataView = MetadataWidget.View.extend({

    template: 'core/widgets/files-metadata',

    serialize: function () {
      var model = this.model ? this.model.toJSON() : {};
      var itemModel = this.options.itemModel ? this.options.itemModel.toJSON(true) : {};
      var table = this.model.table ? this.model.table : null;
      // @TODO: Add Timezone
      var dateFormat = 'MMM Do, YYYY @ H:mma';
      var previewUrl = table ? table.get('preview_url') : null;
      var metadata = {
        createdBy: this.model.get('created_by'),
        createdByIsOnline: false,
        createdOn: this.model.get('created_on'),
        updatedBy: this.model.get('updated_by'),
        updatedOn: this.model.get('updated_on'),
        updatedByIsOnline: false
      };

      var createdByUser = metadata.createdBy ? app.users.get(metadata.createdBy) : null;
      if (createdByUser) {
        metadata.createdByIsOnline = createdByUser.isOnline();
      }

      var updatedByUser = metadata.updatedBy ? app.users.get(metadata.updatedBy) : null;
      if (updatedByUser) {
        metadata.updatedByIsOnline = updatedByUser.isOnline();
      }

      itemModel.type = this.options.itemModel.getSubType(true);
      itemModel.isEmbed = this.options.itemModel.isEmbed();
      if (itemModel.isEmbed) {
        itemModel.size = app.seconds_convert(itemModel.size);
      } else {
        itemModel.size = FileHelper.humanReadableSize(itemModel.size);
      }

      itemModel.status = this.options.itemModel.getStatusName();

      return {
        isNew: this.options.itemModel.isNew(),
        dateFormat: dateFormat,
        model: model,
        file: itemModel,
        previewUrl: previewUrl,
        meta: metadata
      }
    }
  });

  return {
    View: MetadataView,
    Model: MetadataWidget.Model
  }
});
