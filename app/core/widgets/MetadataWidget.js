define([
  'app',
  'backbone',
  'underscore',
  'handlebars'
],
function(app, Backbone, _, Handlebars) {

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
      var model = this.model ? this.model.toJSON() : {};
      var itemModel = this.options.itemModel ? this.options.itemModel.toJSON() : {};
      var table = this.model.table ? this.model.table : null;
      // @TODO: Add Timezone
      var dateFormat = 'MMM Mo, YYYY @ H:mma';
      var previewUrl = table ? table.get('preview_url') : null;
      var metadata = {
        createdBy: this.model.get('created_by'),
        createdByIsOnline: false,
        createdOn: this.model.get('created_on'),
        updatedBy: this.model.get('updated_by'),
        updatedOn: this.model.get('updated_on'),
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
        previewUrl = Handlebars.compile(previewUrl)(itemModel);
      }

      return {
        dateFormat: dateFormat,
        model: model,
        previewUrl: previewUrl,
        meta: metadata
      }
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

      this.listenTo(this.model, 'sync', this.render);
      if (this.model.isNew()) {
        this.model.fetch();
      }
    }
  });

  return {
    View: MetadataView,
    Model: MetadataModel
  }
});
