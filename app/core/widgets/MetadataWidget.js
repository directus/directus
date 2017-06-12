define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'core/t'
],
function(app, Backbone, _, Handlebars, __t) {

  'use strict';

  var MetadataModel = Backbone.Model.extend({
    urlRoot: function () {
      return app.API_URL + 'tables/' + this.table.id + '/meta/' + this.recordId
    },

    parse: function (data) {
      return data.data;
    },

    initialize: function (attributes, options) {
      this.recordId = options.recordId;
      this.table = options.table;
    }
  });

  var MetadataView = Backbone.Layout.extend({

    template: 'core/widgets/metadata',

    tagName: 'div',

    attributes: {
      class: 'metadata'
    },

    events: function () {
      return _.extend(this.getEvents(), {
        'click .js-user': 'openUserModal'
      });
    },

    openUserModal: function (event) {
      var $target = $(event.currentTarget);
      var userId = $target.data('user-id');

      return app.router.openUserModal(userId);
    },

    serialize: function () {
      var itemModel = this.options.itemModel ? this.options.itemModel.toJSON() : {};
      var table = this.model.table ? this.model.table : null;
      // TODO: Add Timezone
      var dateFormat = 'MMM Mo, YYYY @ H:mma';
      var previewUrl = table ? table.get('preview_url') : null;
      var metadata = {
        createdBy: this.getCreatedBy(),
        createdByIsOnline: false,
        createdOn: this.getCreatedOn(),
        updatedBy: this.getUpdatedBy(),
        updatedOn: this.getUpdatedOn(),
        updatedByIsOnline: false
      };

      var createdByUser = metadata.createdBy ? app.users.get(metadata.createdBy) : null;
      if (createdByUser) {
        metadata.createdByIsOnline = createdByUser.isOnline();
      }

      var updatedByUser = metadata.updatedBy ? app.users.get(metadata.updatedBy) : null;
      if (updatedByUser) {
        metadata.updatedByIsOnline = updatedByUser.isOnline();
      }

      if (previewUrl) {
        try {
          previewUrl = Handlebars.compile(previewUrl)(itemModel);
          this.invalidPreviewUrl = false;
        } catch (e) {
          if (this.invalidPreviewUrl) {
            app.trigger('alert:error', __t('error'), __t('invalid_preview_url_template'));
          }

          this.invalidPreviewUrl = true;
          previewUrl = '';
        }
      }

      return {
        isNew: this.options.itemModel.isNew(),
        dateFormat: dateFormat,
        model: this.model ? this.model.toJSON() : {},
        previewUrl: previewUrl,
        meta: metadata
      }
    },

    getMetaData: function (meta, column) {
      var model = this.model;
      var itemModel = this.options.itemModel;
      var table = model.table;
      var data = model.get(meta);

      if (table && itemModel.get(table.get(column))) {
        data = itemModel.get(table.get(column));
      }

      return data;
    },

    getCreatedBy: function () {
      return this.getMetaData('created_by', 'user_create_column');
    },

    getUpdatedBy: function () {
      return this.getMetaData('updated_by', 'user_update_column');
    },

    getCreatedOn: function () {
      return this.getMetaData('created_on', 'date_create_column');
    },

    getUpdatedOn: function () {
      return this.getMetaData('updated_on', 'date_update_column');
    },

    afterRender: function () {
      if (this.options.widgetOptions && this.options.widgetOptions.active) {
        $(this.el).addClass('active');
      }
    },

    getEvents: function () {
      return this._events;
    },

    initialize: function (options) {
      this._events = {};

      if (_.isFunction(options.onClick)) {
        this._events['click .js-action-button'] = options.onClick;
      }

      this.invalidPreviewUrl = false;
      this.listenTo(this.model, 'sync', this.render);

      var privileges = app.schemaManager.getPrivileges('directus_activity');
      if (!this.options.itemModel.isNew() && privileges && privileges.can('view')) {
        this.model.fetch();
      }

      this.listenTo(this.options.itemModel, 'sync', this.render);
    }
  });

  return {
    View: MetadataView,
    Model: MetadataModel
  }
});
