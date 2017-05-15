define(['./interface', 'app', 'core/UIComponent'], function (Input, app, UIComponent) {
  return UIComponent.extend({
    id: 'directus_file',
    system: true,
    Input: Input,
    list: function (options) {
      var model = options.model;

      // Force model To be a Files Model
      var FileModel = require('modules/files/FilesModel');
      if (!(model instanceof FileModel)) {
        model = new FileModel(model.attributes, {collection: model.collection});
      }

      var orientation = (parseInt(model.get('width'), 10) > parseInt(model.get('height'), 10)) ? 'landscape' : 'portrait';
      var url = model.makeFileUrl(true);
      var isImage = _.contains(['image/jpeg', 'image/png', 'embed/youtube', 'embed/vimeo'], model.get('type'));
      var thumbUrl = isImage ? url : app.PATH + 'assets/img/document.png';

      return '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';
    }
  });
});
