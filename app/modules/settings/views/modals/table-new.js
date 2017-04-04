define([
  'app',
  'core/Modal',
  'helpers/schema',
  'core/t',
  'core/notification',
  'underscore'
], function (app, Modal, SchemaHelper, __t, Notification, _) {

  'use strict';

  return Modal.extend({

    template: 'modal/table-new',

    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    events: {
      'click .js-cancel': '_close',

      'click .js-save': 'save'
    },

    _close: function () {
      // change Modal.close to Modal._close
      // change this._close to this.close
      // closing the modal should close it from their container
      this.container.close();
    },

    save: function () {
      var data = this.$('form').serializeObject();
      var tableName = data.name;
      var columns = data.columns;

      // @TODO: better error message.
      if (!tableName) {
        app.trigger('alert:error', __t('empty_table_name'), '', true, {
          timeout: 5000
        });
        return;
      }

      var rawTableName = tableName;
      tableName = SchemaHelper.cleanTableName(tableName);

      // Make sure it's an alphanumeric table name
      // and it has at least one character or one number
      if (!(/[a-z0-9]+/i.test(tableName) && /[_-]*/i.test(tableName))) {
        app.trigger('alert:error',
          __t('you_must_enter_an_valid_table_name'),
          'letters_az_numbers_andor_underscores_and_dashes',
          true, {
            timeout: 5000
          });
        return;
      }

      if (app.schemaManager.getPrivileges(tableName)) {
        app.trigger('alert:error', 'Error', 'This table already exists!', true, {
          timeout: 5000
        });
        return;
      }

      // @TODO: make this save a table info rather than permissions.
      app.schemaManager.addTableWithSystemColumns(tableName, columns, function (tableModel) {
        if (rawTableName !== tableName) {
          Notification.success(__t('this_table_was_saved_as_x', {table_name: tableName}));
        } else {
          Notification.success(__t('table_x_was_created', {table_name: tableName}));
        }

        // @TODO: listen to a tables collection
        // to add or remove table from sidebar
        app.router.bookmarks.addTable(tableModel);
      });

      this._close();
    }
  });
});
