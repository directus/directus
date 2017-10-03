define([
  'app',
  'backbone',
  'core/widgets/widgets',
  'helpers/file',
  'moment'
], function(app, Backbone, Widgets, FileHelper, moment) {

  var FilesCardView = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      class: 'file-listing',
      id: 'file-listing'
    },

    events: {
      'click .js-file': function(event) {
        var id = $(event.currentTarget).data('id');

        app.router.go('#files', id);
      }
    },

    template: 'modules/files/card-view',

    serialize: function() {
      var rows = this.collection.map(function (model) {
        var statusValue = model.table.getStatusColumnName();
        var title = model.get('title') || '';
        var data = {
          id: model.get('id'),
          inactive: (statusValue !== model.table.getStatusDefaultValue()),
          cid: model.cid,
          title: title,
          title_short: (title.length > 35)? title.substr(0,32) + "..." : title,
          date_uploaded: model.get('date_uploaded'),
          size: model.get('size'),
          type: model.getSubType(true),
          dimensions: model.get('width') + "×" + model.get('height')
        };

        var type = model.get('type').substring(0, model.get('type').indexOf('/'));
        var subtype = model.getSubType(true);

        if (data.id && (type == 'image' || type === 'embed' || subtype === 'pdf') && model.makeFileUrl(true)) {
          data.thumbnailUrl = model.makeFileUrl(true);
        }

        if(!model.get('width') || !model.get('height')){
          data.dimensions = "";
        }

        if(type === "embed") {
          data.size = app.seconds_convert(data.size);
          data.dimensions = "";
          data.embed = true;
        } else {
          data.size = app.bytesToSize(data.size, 0);
          data.embed = false;
        }

        return data;
      });
      return {rows: rows};
    },

    afterRender: function() {
      // Show fallback image if file missing
      FileHelper.hideOnImageError(this.$('.js-image img'));
    },

    initialize: function(options) {
      this.collection.setOrder('date_uploaded', 'DESC');
      this.collection.on('sort', this.render, this);
      this.collection.on('sync', this.render, this);
    }

  });

  return FilesCardView;

});
