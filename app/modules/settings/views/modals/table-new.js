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
      'class': 'modal table-create'
    },

    state: {},

    DOM: {
      name: 'input#table_name'
    },

    events: {
      'submit': 'onSubmit',

      'change input#strictNaming': 'onChangeStrictNaming',

      'change input#table_name': 'onChangeInputName',
      'keypress input#table_name': 'onChangeInputName',
      'focus input#table_name': 'onChangeInputName',
      'textInput input#table_name': 'onChangeInputName',
      'input input#table_name': 'onChangeInputName',

      'click .js-cancel': '_close',

      'click .js-save': 'save'
    },

    onSubmit: function (event) {
      event.preventDefault();
    },

    onChangeStrictNaming: function (event) {
      this.state.strictNaming = $(event.currentTarget).is(':checked');

      if (this.state.strictNaming) {
        this.updateNameWith(this.$(this.DOM.name).val());
      }
    },

    onChangeInputName: function (event) {
      var input = event.currentTarget;
      var $input = $(input);
      var name = $input.val();
      var start = input.selectionStart;
      var end = input.selectionEnd;


      this.updateNameWith(name);

      input.setSelectionRange(start, end);
    },

    updateNameWith: function (name) {
      if (this.state.strictNaming) {
        name = SchemaHelper.cleanTableName(name);
      }

      this.$(this.DOM.name).val(name);
    },

    afterRender: function () {
      this.$(this.DOM.name).focus();
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
      var isStrict = this.state.strictNaming;

      // @TODO: better error message.
      if (!tableName) {
        app.trigger('alert:error', __t('empty_table_name'), '', true, {
          timeout: 5000
        });
        return;
      }

      var rawTableName = tableName;

      if (this.state.strictNaming) {
        tableName = SchemaHelper.cleanTableName(tableName);
      }

      // Make sure it's an alphanumeric table name
      // and it has at least one character or one number
      if (isStrict && !(/[a-z0-9]+/i.test(tableName) && /[_-]*/i.test(tableName))) {
        app.trigger('alert:error',
          __t('you_must_enter_an_valid_table_name'),
          'letters_az_numbers_andor_underscores_and_dashes',
          true, {
            timeout: 5000
          });
        return;
      }

      if (app.schemaManager.getPrivileges(tableName)) {
        var title = __t('error');
        var message = __t('table_x_already_exists', {table_name: tableName});

        app.trigger('alert:error', title, message, true, {
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
    },

    initialize: function () {
      this.state.strictNaming = true;
    }
  });
});
