define([
  'app',
  'backbone',
  'core/widgets/widgets',
  'moment'
],

function(app, Backbone, Widgets, moment) {

  var FilesCardView = Backbone.Layout.extend({

    tagName: 'ul',

    attributes: {
      class: "cards row"
    },

    events: {
      'click li': function(e) {
        var id = $(e.target).closest('li').attr('data-id');

        var user = app.users.getCurrentUser();
        var userGroup = user.get('group');

        app.router.go('#files', id);
      }
    },

    template: 'modules/files/filescardview',

    serialize: function() {
      var rows = this.collection.map(function(model) {
        var statusValue = model.get(app.statusMapping.status_name);

        var data = {
          "id": model.get('id'),
          "inactive": (statusValue !== app.statusMapping.active_num),
          "cid": model.cid,
          'title': model.get('title'),
          'title_short': (model.get('title').length > 35)? model.get('title').substr(0,32) + "..." : model.get('title'),
          'date_uploaded': moment(model.get('date_uploaded')).fromNow(),
          'size': model.get('size'),
          'type': (model.has('type')) ? model.get('type').split('/').pop() : '',
          'dimensions': model.get('width') + "×" + model.get('height')
        };

        var type = model.get('type').substring(0, model.get('type').indexOf('/'));
        var subtype = model.get('type').split('/').pop();

        // While loading
        if (!data.id) {
          data.thumbnail = '<div class="default-loading"><span class="icon icon-three-dots"></span></div>';
        } else if ((type == 'image' || type === 'embed' || subtype === 'pdf') && model.makeFileUrl(true)) {
          data.thumbnail = '<img src="'+model.makeFileUrl(true)+'">';
        } else {
          data.thumbnail = '<div class="default-info">' +data.type.toUpperCase()+'</div>';
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
      $('.header-image > img', this.$el).error(function() {
        $(this).off('error');
        $(this).attr('src', app.root + 'assets/img/missing-image-placeholder.jpg');
      });
    },

    initialize: function(options) {
      this.collection.setOrder('date_uploaded', 'DESC');
      this.collection.on('sort', this.render, this);
      this.collection.on('sync', this.render, this);
    }

  });

  return FilesCardView;

});
