define([
  'app',
  'backbone',
  'core/widgets/widgets'
],

function(app, Backbone, Widgets) {

  var MediaCardView = Backbone.Layout.extend({

    tagName: 'ul',

    attributes: {
      class: "cards row"
    },

    events: {
      'click li': function(e) {
        var id = $(e.target).closest('li').attr('data-id');

        var user = app.users.getCurrentUser();
        var userGroup = user.get('group');

        //@todo fix this so it respects ACL instead of being hardcoded
        if (!(parseInt(id,10) === user.id || userGroup.id === 0)) {
          return;
        }

        app.router.go('#media', id);
      }
    },

    template: 'modules/media/mediacardview',

    serialize: function() {
      var rows = this.collection.map(function(model) {
        var data = {
          "id": model.get('id'),
          "cid": model.cid,
          'title': model.get('title'),
          'date_uploaded': moment(model.get('date_uploaded')).fromNow(),
          'size': model.get('size'),
          'type': model.get('type').split('/').pop(),
          'dimensions': model.get('width') + "x" + model.get('height')
        };

        var type = model.get('type').substring(0, model.get('type').indexOf('/'));
        if(type == 'image') {
          data.thumbnail = '<img src="'+model.makeMediaUrl(true)+'">';
        } else {
          data.thumbnail = '<div class="default-info">' +data.type.toUpperCase()+'</div>';
        }
        return data;
      });
      return {rows: rows};
    },

    initialize: function(options) {
      this.collection.on('sort', this.render, this);
      this.collection.on('sync', this.render, this);
    }

  });

  return MediaCardView;

});
