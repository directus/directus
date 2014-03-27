define([
  "app",
  "backbone",
  "core/directus",
  'core/BasePageView'  
],

function(app, Backbone, Directus, BasePageView) {

  "use strict";

  var BodyView = Backbone.Layout.extend({

    tagName: 'tbody',

    template: Handlebars.compile(
      '{{#rows}}' +
      '<tr data-id="{{id}}" data-cid="{{cid}}">' +
      '<td class="status"></td>' +
      '<td>{{avatar}}</td>' +
      '<td>{{first_name}}</td>' +
      '<td>{{last_name}}</td>' +
      '<td>{{email}}</td>' +
      '<td>{{position}}</td>' +
      '<td>{{last_access}}</td>' +
      '</tr>' +
      '{{/rows}}'
    ),

    serialize: function() {
      var rows = this.collection.map(function(model) {      

        var data = {
          "id": model.get('id'),
          "cid": model.cid,
          'avatar': model.get('avatar'),
          'first_name': model.get('first_name'),
          'last_name': model.get('last_name'),
          'email': model.get('email'),
          'position': model.get('position'),
          'last_access': model.get('last_access')
        };

        if (data.avatar !== null) {
            //@todo this is a hack, maybe change avatar so it only includes a hash?
            var avatarSmall = data.avatar.replace('?s=100','?s=50');
            data.avatar = new Handlebars.SafeString('<img src="' + avatarSmall + '" style="max-width:none!important;"/>');
        }

        return data;

      });

      return {rows: rows};
    },

    initialize: function(options) {
      this.collection.on('sort', this.render, this);
    }

  });

  var ListView = Directus.Table.extend({

    TableBody: BodyView,

    navigate: function(id) {
      var user = app.users.getCurrentUser();
      var userGroup = user.get('group');

      //@todo fix this so it respects ACL instead of being hardcoded
      if (!(parseInt(id,10) === user.id || userGroup.id === 0)) {
        return;
      }

      app.router.go('#users', id);
    }
  });

  var View = BasePageView.extend({

    serialize: function() {
      var data = {title: 'Users'};

      if (this.collection.hasPermission('add')) {
        data.buttonTitle = 'Add New User';
      }

      return data;
    },

    events: {
      'click #btn-top': function() {
        app.router.go('#users','new');
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch();
    },

    initialize: function() {
      this.table = new ListView({collection:this.collection, toolbar: false, navigate: true, selectable:false, hideColumnPreferences: true, blacklist: ['group','active']});
    }
  });


  return View;

});