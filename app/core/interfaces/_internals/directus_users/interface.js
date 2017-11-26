define([
  'app',
  'underscore',
  'core/overlays/overlays',
  'core/table/table.view',
  'core/modals/invite',
  'core/interfaces/one_to_many/component',
  'core/t'
], function (app, _, Overlays, TableView, InviteModal, OneToMany, __t) {
  'use strict';

  return OneToMany.prototype.Input.extend({
    template: '_internals/directus_users/input',

    events: {
      'click table tr': 'openUserModal',
      'click .js-create-user': 'createUser',
      'click .js-choose-user': 'chooseUser',
      'click .js-invite-user': 'invitationPrompt'
    },

    openUserModal: function (event) {
      var userId = $(event.currentTarget).data('id');

      app.router.openUserModal(userId);
    },

    createUser: function () {
      var OverlayEditView = require('modules/tables/views/OverlayEditView'); // eslint-disable-line import/no-unresolved
      var collection = this.relatedCollection;
      var model = new collection.model({}, { // eslint-disable-line new-cap
        collection: collection,
        parse: true,
        structure: collection.structure,
        table: collection.table,
        privileges: collection.privileges
      });
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var id = this.model.id;

      var view = new OverlayEditView({
        model: model,
        collectionAdd: true,
        hiddenFields: [columnName],
        parentField: {
          name: columnName,
          value: id
        },
        skipFetch: true,
        onSave: function () {
          model.set(columnName, id);

          if (model.isValid()) {
            app.router.removeOverlayPage(this);
            collection.add(model, {nest: true});
          }
        }
      });

      app.router.overlayPage(view);

    },

    chooseUser: function () {
      var self = this;
      var columnName = this.columnSchema.relationship.get('junction_key_right');
      var collection = app.getEntries(this.relatedCollection.table.id);
      var view = new Overlays.ListSelect({collection: collection});

      app.router.overlayPage(view);
      view.save = function () {
        _.each(view.table.selection(), function (id) {
          var user = self.relatedCollection.get(id);

          if (!user) {
            user = collection.get(id);
          }

          // Data[columnName] = self.model.get('id');
          var group;
          if (user) {
            // Data = user.toJSON();
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

    invitationPrompt: function () {
      app.router.openViewInModal(new InviteModal());
    },

    // NOTE: Duplicated from O2M
    // TODO: Need to be merged into a base interface for any O2M
    triggerModelChange: function () {
      var value = this.model.get(this.name);

      // NOTE: setting the value again to mark the changes
      this.model.set(this.name, value);
    },

    onCollectionChange: function () {
      this.triggerModelChange();

      this.nestedTableView.tableHead = this.relatedCollection.visibleCount() > 0;
      this.nestedTableView.render();
    },

    // @TODO: Hotfix: solve the problem of fetching new users
    // when we already have it on the users collection
    // but the new ones for some reason few are missing group information
    initialize: function (options) {
      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
        this.columnSchema.relationship.get('type') !== 'ONETOMANY') {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'ONETOMANY',
          ui: 'directus_users'
        });
      }

      this.canEdit = !(options.inModal || false);

      var relatedCollection = this.model.get(this.name);
      var joinColumn = this.columnSchema.relationship.get('junction_key_right');

      _.each(relatedCollection.models, function (model) {
        return model.startTracking();
      });

      this.showRemoveButton = this.columnSchema.options.get('remove_button') === true;
      this.showAddButton = this.columnSchema.options.get('add_button') === true;
      this.showChooseButton = this.columnSchema.options.get('choose_button') === true;

      this.nestedTableView = new TableView({
        collection: relatedCollection,
        selectable: false,
        sortable: false,
        footer: false,
        saveAfterDrop: true,
        showRemoveButton: false,
        hideColumnPreferences: true,
        hideEmptyMessage: true,
        tableHead: false,
        blacklist: this.getBlacklistedColumnsName(),
        whitelist: this.getWhitelistedColumnsName(),
        filters: {
          booleanOperator: '&&',
          expressions: [
            // @todo, make sure that this can also nest
            {column: joinColumn, operator: '===', value: this.model.id}
          ]
        }
      });

      if (relatedCollection.structure.get('sort')) {
        relatedCollection.setOrder('sort', 'ASC', {silent: true});
      }

      this.listenTo(relatedCollection, 'add change remove', this.onCollectionChange);
      this.relatedCollection = relatedCollection;
    }
  });
});
