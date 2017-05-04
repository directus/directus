define([
  'app',
  'underscore',
  'core/t',
  'core/overlays/overlays',
  'core/table/table.view',
  'core/modals/invite',
  'core/interfaces/one_to_many/component'
], function (app, _, __t, Overlays, TableView, InviteModal, OneToMany) {
  'use strict';

  return OneToMany.prototype.Input.extend({
    template: '_internals/directus_users/input',
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

      view.events['click .saved-success'] = function () {
        this.save();
      };
      view.events['click #removeOverlay'] = function () {
        app.router.removeOverlayPage(this);
      };

      app.router.overlayPage(view);

      view.save = function () {
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
      view.save = function () {
        _.each(view.table.selection(), function (id) {
          var user = self.relatedCollection.get(id);
          var data = {};

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
        deleteColumn: this.canEdit && this.showRemoveButton,
        hideColumnPreferences: true,
        hideEmptyMessage: true,
        tableHead: false,
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

      this.listenTo(relatedCollection, 'add change', function () {
        // Check if any rendered objects in collection to show or hide header
        if (this.relatedCollection.filter(function (d) {
          return d.get(app.statusMapping.status_name) !== app.statusMapping.deleted_num;
        }).length > 0) {
          this.nestedTableView.tableHead = true;
        } else {
          this.nestedTableView.tableHead = false;
        }
        this.nestedTableView.render();
      }, this);

      this.listenTo(relatedCollection, 'remove', function () {
        this.nestedTableView.render();
      }, this);

      this.relatedCollection = relatedCollection;
    }
  });
});
