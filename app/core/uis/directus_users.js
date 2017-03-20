define([
  'app',
  'underscore',
  'core/t',
  'core/overlays/overlays',
  'core/table/table.view',
  'core/modals/invite',
  'core/uis/one_to_many'
], function (app, _, __t, Overlays, TableView, InviteModal, OneToMany) {

  'use strict';
  var interfaceId = 'directus_users';

  var Input = OneToMany.prototype.Input.extend({
    templateSource: undefined,
    template: 'directus_users',
    events: {
      'click .js-create-user': 'createUser',
      'click .js-choose-user': 'chooseUser',
      'click .js-invite-user': 'invitationPrompt'
    },

    createUser: function () {
      var EditView = require('modules/tables/views/EditView');
      var collection = this.relatedCollection;
      var model = new collection.model({}, {
        collection: collection,
        parse: true,
        structure: collection.structure,
        table: collection.table,
        privileges: collection.privileges
      });
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var id = this.model.id;
      var view = new EditView({
        model: model,
        collectionAdd: true,
        hiddenFields: [columnName],
        parentField: {
          name: columnName,
          value: id
        },
        skipFetch: true
      });

      view.headerOptions.route.isOverlay = true;
      view.headerOptions.route.breadcrumbs = [];
      view.headerOptions.basicSave = true;

      view.events['click .saved-success'] = function() {
        this.save();
      };
      view.events['click #removeOverlay'] = function() {
        app.router.removeOverlayPage(this);
      };

      app.router.overlayPage(view);

      view.save = function() {
        var data = view.editView.data();
        data[columnName] = id;
        model.set(data);

        if (model.isValid()) {
          app.router.removeOverlayPage(this);
          collection.add(model, {nest: true});
        }
      };
    },

    chooseUser: function () {
      var self = this;
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var collection = app.getEntries(this.relatedCollection.table.id);
      var view = new Overlays.ListSelect({collection: collection});

      app.router.overlayPage(view);
      view.save = function() {
        _.each(view.table.selection(), function (id) {
          var user = self.relatedCollection.get(id);
          var data = {};

          if (!user) {
            user = collection.get(id);
          }

          // data[columnName] = self.model.get('id');
          var group;
          if (user) {
            // data = user.toJSON();
            group = self.model.clone();
            group.unset('permissions');
            group.unset('users');
            user.set(columnName, group);
            self.relatedCollection.add(user, {nest: true});
          }
        }, this);

        app.router.removeOverlayPage(this);
      };

      collection.fetch();
    },

    invitationPrompt: function() {
      app.router.openViewInModal(new InviteModal());
    }
  });

  return OneToMany.extend({
    id: interfaceId,
    Input: Input
  })
});
