define([
  "app",
  "backbone",
  "core/directus",
  'core/BasePageView'
],

function(app, Backbone, Directus, BasePageView) {

  "use strict";

  var BodyView = Backbone.Layout.extend({

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

        app.router.go('#users', id);
      }
    },

    template: Handlebars.compile(
      '{{#rows}}' +
      '<li class="card col-2 gutter-bottom {{#if online}}active{{/if}}" data-id="{{id}}" data-cid="{{cid}}">' +
        '<div class="header-image primary-border-color">' +
          '{{avatar}} <div class="tool-item large-circle"><span class="icon icon-pencil"></span></div></div>' +
        '<div class="info">' +
          '<div class="featured">' +
            '<div class="primary-info">' +
              '<div>{{first_name}}</div>' +
              '<div>{{last_name}}</div>' +
            '</div>' +
            '<div class="secondary-info">{{position}}</div>' +
          '</div>' +
          '<ul class="extra">' +
            '<li>{{address}}<span class="icon icon-home"></span></li>' +
            '<li>{{phone_number}}<span class="icon icon-phone"></span></li>' +
            '<li>{{email}}<span class="icon icon-mail"></span></li>' +
          '</ul>' +
        '</div>' +
      '</li>' +
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
          'address': model.get('address'),
          'phone_number': model.get('phone'),
          'online': (moment(model.get('last_access')).add('m', 5) > moment())
        };

        if (data.avatar !== null) {
            //@todo this is a hack, maybe change avatar so it only includes a hash?
            var avatarSmall = data.avatar.replace('?s=100','?s=200');
            data.avatar = new Handlebars.SafeString('<img src="' + avatarSmall + '" style="width:200px;height:200px"/>');
        }

        return data;

      });

      return {rows: rows};
    },

    initialize: function(options) {
      this.collection.on('sort', this.render, this);
    }

  });

  var View = BasePageView.extend({

    headerOptions: {
      route: {
        title: "Users"
      }
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
      this.table = new BodyView({collection:this.collection});
    }
  });


  return View;

});