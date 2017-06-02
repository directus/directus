define(['app', 'core/Modal'], function(app, Modal) {

  'use strict';

  return Modal.extend({
    template: 'modal/file',

    attributes: {
      'id': 'modal',
      'class': 'modal file'
    },

    serialize: function() {
      var data = {};

      if (this.model) {
        data = this.model.toJSON();
        data.url = this.model.makeFileUrl(false);
      }

      return data;
    },

    initialize: function(options) {
      if (!this.model && options.fileId) {
        var FilesModel = require('modules/files/FilesModel');
        this.model = new FilesModel({
          id: options.fileId
        }, {
          urlRoot: app.API_URL + 'files',
          structure: app.schemaManager.getColumns('tables', 'directus_files')
        });

        this.listenTo(this.model, 'sync', function() {
          this.render();
        });
        this.model.fetch();
      }
    }
  });
});
