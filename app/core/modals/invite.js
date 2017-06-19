define([
  'app',
  'underscore',
  'backbone',
  'core/Modal',
  'schema/TableModel',
  'core/notification',
  'core/t'
], function(app, _, Backbone, Modal, TableModel, Notification, __t) {

  'use strict';

  return Modal.extend({
    template: 'modal/invite',

    attributes: {
      'id': 'modal',
      'class': 'modal invitation'
    },

    events: {
      'click #save': 'sendInvitation',
      'click .js-close-modal': 'close'
    },

    beforeRender: function() {
      this.setView('.form', this.editView);
    },

    sendInvitation: function() {
      // @TODO: Make sure it's a valid email(s)
      var data = this.$('form').serializeObject();
      // If something is returned
      // then something went wrong
      if (this.model.validate(data)) {
        return;
      }

      // @TODO: Do a request if it's not found locally
      var emails = data.email.split(',');
      var usedEmails = [];
      _.each(emails, function (email) {
        if (app.users.get(email, false)) {
          usedEmails.push(email);
        }
      });

      // whether or not some of the emails in the invitation are used
      if (usedEmails.length > 0) {
        Notification.warning(__t('directus_users_email_already_exists'));
        return;
      }

      app.request('POST', '/users/invite', {
        data: {
          email: data.email
        }
      }).success(_.bind(function() {
        this.close(true);
        Notification.success(__t('invitation'), __t('invitation_sent'));
      }, this));
    },

    getSchema: function() {
      var options = {};
      app.groups.each(function(group) {
        options[group.id] = group.get('name');
      });

      return {
        id: 'directus_users',
        table_name: 'directus_users',
        columns: [
          {
            id: 'email',
            column_name: 'email',
            type: 'VARCHAR',
            nullable: false,
            ui: 'text_input',
            required: true
          },
          {
            id: 'group',
            column_name: 'group',
            type: 'INT',
            nullable: false,
            ui: 'dropdown',
            required: true,
            options: {
              options: options
            }
          }
        ]
      };
    },

    initialize: function() {
      var UsersModel = require('modules/users/UsersModel');
      var EditView = require('core/edit');
      var structure = new TableModel(this.getSchema(), {parse: true});

      this.model = new UsersModel({}, {
        structure: structure.columns,
        table: structure
      });

      this.editView = new EditView({
        model: this.model,
        structure: structure.columns
      });
    }
  });
});
