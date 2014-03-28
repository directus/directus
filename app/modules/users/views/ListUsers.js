define([
  "app",
  "backbone",
  "core/directus",
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, Backbone, Directus, BasePageView, Widgets) {

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

  var ListBodyView = Backbone.Layout.extend({

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

    TableBody: ListBodyView,

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

    headerOptions: {
      route: {
        title: "Users"
      }
    },
    leftToolbar: function() {
      return [
        new Widgets.AddWidget({widgetOptions: {button: {title: 'Add User'}}})
      ];
    },
    rightToolbar: function() {
      return [
        new Widgets.SearchWidget(),
        new Widgets.ListWidget({widgetOptions: {active: this.viewList}}),
        new Widgets.GridWidget({widgetOptions: {active: !this.viewList}})
      ];
    },
    events: {
      'click #addBtn': function() {
        app.router.go('#users','new');
      },
      'click #gridBtn': function() {
        if(this.viewList) {
          this.viewList = false;
          $('#listBtn').parent().removeClass('active');
          $('#gridBtn').parent().addClass('active');
          this.table = new BodyView({collection:this.collection});
          this.render();
        }
      },
      'click #listBtn': function() {
        if(!this.viewList) {
          this.viewList = true;
          $('#listBtn').parent().addClass('active');
          $('#gridBtn').parent().removeClass('active');
          this.table = new ListView({collection:this.collection});
          this.render();
        }
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch();
    },

    initialize: function() {
      this.viewList = false;
      this.table = new BodyView({collection:this.collection});
    }
  });


  return View;

});