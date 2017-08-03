/* global $ */
define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'utils',
  './edit-fields-modal',
  'objects/linked-list/circular'
], function (app, _, Backbone, __t, Utils, EditFieldsModal, CircularLinkedList) {
  'use strict';

  // TODO: Create a API to handle multiple status actions

  var viewOptions = ['group', 'table'];

  return Backbone.Layout.extend({
    prefix: 'app/core/interfaces/_internals/permissions/',

    template: 'table-row',

    tagName: 'tr',

    attributes: function () {
      var className = ['js-permission'];

      if (this.hasWorkflowEnabled()) {
        className.push('workflow-enabled');
      }

      return {
        class: className.join(' '),
        'data-table': this.table.id,
        'data-id': this.table.id,
        'data-cid': this.getPrivilege(null).cid
      };
    },

    events: {
      'click .js-status-toggle': 'onClickWorkflow',
      'click .js-add-full-permissions': 'addFullPermissions',
      'click .js-remove-full-permissions': 'removeFullPermissions',
      'click .js-permission-toggle': 'togglePermission',
      'click .js-write.choose-column-blacklist': 'editWriteFields',
      'click .js-read.choose-column-blacklist': 'editReadFields'
    },

    onClickWorkflow: function () {
      if (!this.supportsWorkflow()) {
        return;
      }

      this.toggleWorkflow();
    },

    addFullPermissions: function (event) {
      var $button = $(event.currentTarget);
      var $row = $button.closest('tr');
      var permissions = {
        allow_add: 1,
        allow_edit: 2,
        allow_delete: 2,
        allow_alter: 1,
        allow_view: 2
      };

      this.fullUpdate($row.data('cid'), permissions, {wait: false});
    },

    removeFullPermissions: function (event) {
      var $button = $(event.currentTarget);
      var $row = $button.closest('tr');
      var permissions = {
        allow_add: 0,
        allow_edit: 0,
        allow_delete: 0,
        allow_alter: 0,
        allow_view: 0
      };

      this.fullUpdate($row.data('cid'), permissions, {wait: false});
    },

    fullUpdate: function (id, attributes, options) {
      var statuses;
      if (this.hasWorkflowEnabled()) {
        statuses = this.getStatuses();
      } else {
        statuses = [{value: null}];
      }

      _.each(statuses, function (status) {
        var privilege = this.getPrivilege(status.value);

        this.updateModel(privilege.cid, attributes, options);
      }, this);
    },

    togglePermission: function (event) {
      event.preventDefault();
      event.stopPropagation();

      var $toggle = $(event.currentTarget);
      var permission = $toggle.closest('.js-permission-name').data('name');
      var permissionName = 'allow_' + permission;
      var $row = $toggle.closest('.js-permission');
      var privilege = this.collection.get($row.data('cid'));
      var attributes = {};
      var currentPermissionValue;

      currentPermissionValue = privilege.get(permissionName);
      // NOTE: if currentPermissionValue is undefined set the current value to 0
      if (Utils.isNothing(currentPermissionValue)) {
        currentPermissionValue = 0;
      }

      attributes[permissionName] = this.getNextPermissionValue(permission, currentPermissionValue);

      this.updateModel(privilege.cid, attributes, {wait: false});
    },

    editReadFields: function (event) {
      var cid = $(event.currentTarget).closest('.js-permission').data('cid');

      this.editFields('read', cid);
    },

    editWriteFields: function (event) {
      var cid = $(event.currentTarget).closest('.js-permission').data('cid');

      this.editFields('write', cid);
    },

    editFields: function (type, cid) {
      var privilege = this.collection.get(cid);

      // TODO: link real col
      app.router.openViewInModal(new EditFieldsModal({
        type: type,
        model: privilege
      }));
    },

    hasWorkflowEnabled: function () {
      var privileges = this.getPrivileges();

      return this.supportsWorkflow() && privileges && privileges.length > 1;
    },

    enableWorkflow: function () {
      var globalPrivilege = this.getPrivilege(null);
      var statuses;

      if (!globalPrivilege) {
        return;
      }

      var globalAttributes = _.omit(globalPrivilege.toJSON(), 'id', 'status_id');

      statuses = this.getStatuses();
      _.each(statuses, function (status) {
        var privilege = this.getPrivilege(status.value);
        this.updateModel(privilege.cid, _.extend(globalAttributes, {
          group_id: this.group.id,
          status_id: status.value
        }));
      }, this);

      this.destroyModel(globalPrivilege.cid);
    },

    disableWorkflow: function () {
      var statuses = this.getStatuses();

      _.each(statuses, function (status) {
        var privilege = this.getPrivilege(status.value);
        this.destroyModel(privilege.cid);
      }, this);
    },

    toggleWorkflow: function () {
      if (this.hasWorkflowEnabled()) {
        app.router.openModal({
          type: 'confirm',
          text: __t('permissions_are_you_sure_you_want_to_reset_workflow'),
          callback: _.bind(this.disableWorkflow, this)
        });
      } else {
        this.enableWorkflow();
      }
    },

    // All statuses except the hard delete ones
    tableStatuses: function (tableName, fn, context) {
      context = context || this;

      app.statusMapping.get(tableName, true).get('mapping').each(function (status) {
        if (status.get('hard_delete') !== true) {
          fn.apply(context, [status]);
        }
      }, context);
    },

    getStatuses: function () {
      var tableName = this.table.id;
      var statuses = [];

      this.tableStatuses(tableName, function (status) {
        statuses.push({
          name: status.get('name'),
          value: status.get('id')
        });
      });

      return statuses;
    },

    getPrivilege: function (statusId) {
      var tableName = this.table.id;
      var privilege;

      privilege = this.collection.findWhere({
        table_name: tableName,
        status_id: statusId
      });

      if (!privilege) {
        privilege = this.getDefaultPrivilege(statusId);
        this.collection.add(privilege);
      }

      return privilege;
    },

    getPrivileges: function () {
      return this.collection.where({
        table_name: this.table.id
      });
    },

    getDefaultPrivilege: function (statusId) {
      var privileges = app.schemaManager.getDefaultPrivileges(this.table.id, statusId);

      privileges.set('group_id', this.group.id);

      return privileges;
    },

    getNextPermissionValue: function (name, current) {
      var maxValue = this.getPermissionMaxValue(name);
      var list = this.getPermissionsValueList(maxValue);
      var node;

      if (!list) {
        list = this.createPermissionsValueList(maxValue);
      }

      node = list.get(current);

      return node ? node.next.value : 0;
    },

    getPermissionMaxValue: function (name) {
      var value = 0;

      switch (name) {
        case 'view':
        case 'edit':
        case 'delete':
          value = 2;
          break;
        case 'add':
          value = 1;
          break;
        default:
          break;
      }

      return value;
    },

    getPermissionsValueList: function (maxValue) {
      return this.permissionsValueList[maxValue];
    },

    createPermissionsValueList: function (maxValue) {
      var range = [];

      for (var i = 0; i <= maxValue; i++) {
        range.push(i);
      }

      return new CircularLinkedList(range);
    },

    constructPermissionsValueList: function () {
      this.permissionsValueList = {};

      _.each(['view', 'add', 'edit', 'delete'], function (permission) {
        var maxValue = this.getPermissionMaxValue(permission);

        if (!this.permissionsValueList[maxValue]) {
          this.permissionsValueList[maxValue] = this.createPermissionsValueList(maxValue);
        }
      }, this);
    },

    getPermissions: function (model) {
      var permissions = [
        // View
        {
          name: 'view',
          maxValue: 2,
          view: model.has('allow_view') && model.get('allow_view') > 0,
          bigView: model.has('allow_view') && model.get('allow_view') === 2,
          onlyMine: model.has('allow_view') && model.get('allow_view') === 1,
          cannot: (function (model) {
            return !model.has('allow_view') || !(model.get('allow_view') > 0);
          })(model)
        },
        // Add
        {
          name: 'add',
          maxValue: 1,
          title: this.permissionTitle(model),
          add: (model.has('allow_add') && model.get('allow_add') > 0),
          onlyMine: false, // You either can or cannot add items
          cannot: (function (model) {
            return !model.has('allow_add') || !(model.get('allow_add') > 0);
          })(model)
        },
        // Edit
        {
          name: 'edit',
          maxValue: 2,
          edit: (model.has('allow_edit') && model.get('allow_edit') > 0),
          bigEdit: (model.has('allow_edit') && model.get('allow_edit') === 2),
          onlyMine: model.has('allow_edit') && model.get('allow_edit') === 1,
          cannot: (function (model) {
            return !model.has('allow_edit') || !(model.get('allow_edit') > 0);
          })(model)
        },
        // Delete
        {
          name: 'delete',
          maxValue: 2,
          delete: (model.has('allow_delete') && model.get('allow_delete') > 0),
          bigDelete: (model.has('allow_delete') && model.get('allow_delete') === 2),
          onlyMine: model.has('allow_delete') && model.get('allow_delete') === 1,
          cannot: (function (model) {
            return !model.has('allow_delete') || !(model.get('allow_delete') > 0);
          })(model)
        }
        // Alter
        // {
        //   alter: (model.has('allow_alter') && model.get('allow_alter') > 0),
        // },
      ];

      return permissions.map(function (permission) {
        permission.title = this.permissionTitle(model, permission.name);

        return permission;
      }, this);
    },

    permissionTitle: function (model, name) {
      var title;
      var permission;

      permission = 'allow_' + name;
      if (model.get(permission) > 1) {
        title = __t('permissions_can_' + name + '_any_items');
      } else if (model.get(permission) === 1) {
        title = __t('permissions_can_' + name + '_their_items');
      } else if (!model.has(permission)) { // eslint-disable-line no-negated-condition
        title = __t('permissions_can_' + name + '_items');
      } else {
        title = __t('permissions_can_not_' + name + '_items');
      }

      return title;
    },

    formatBlacklist: function (list) {
      list = list || '';

      if (list) {
        list = list.split(',').join(', ');
      }

      return list;
    },

    // Gets the table privilege information of the given permission
    parsePrivilegePermission: function (tableName, permissionName, statusId) {
      var privilege = this.getPrivilege(statusId);
      var data = this.getPermissions(privilege);

      data = _.findWhere(data, {name: permissionName});
      data.table_name = tableName;
      data.id = privilege.id;
      data.cid = privilege.cid;
      data.statusId = statusId;

      return data;
    },

    supportsWorkflow: function () {
      // NOTE: disable workflow icon
      // this.table.hasStatusColumn();
      return false;
    },

    serialize: function () {
      var hasWorkflowEnabled = this.hasWorkflowEnabled();
      var globalPrivilege = this.getPrivilege(null);
      var tableName = this.table.id;
      var data = {};

      data.table_name = this.table.id;
      data.isSystemTable = this.table.isSystemTable();
      data.supportsWorkflow = this.supportsWorkflow();
      data.permissions = this.getPermissions(globalPrivilege);

      if (data.supportsWorkflow && hasWorkflowEnabled) {
        data.hasWorkflowEnabled = true;
        data.statuses = data.supportsWorkflow ? this.getStatuses() : [];
        data.permissions = this.getPermissions(globalPrivilege);

        _.each(data.permissions, function (permission) {
          var statuses = [];

          this.tableStatuses(tableName, function (status) {
            statuses.push(this.parsePrivilegePermission(tableName, permission.name, status.get('id')));
          });

          permission.statuses = statuses;
        }, this);

        data.statusesReadBlacklist = [];
        data.statusesWriteBlacklist = [];

        // Gets all over the statuses and get ech blacklist information
        this.tableStatuses(tableName, function (status) {
          var privilege = this.getPrivilege(status.get('id'));
          data.statusesReadBlacklist.push({
            cid: privilege.cid,
            list: this.formatBlacklist(privilege.get('read_field_blacklist'))
          });
          data.statusesWriteBlacklist.push({
            cid: privilege.cid,
            list: this.formatBlacklist(privilege.get('write_field_blacklist'))
          });
        });
      } else {
        data.permissions = this.getPermissions(globalPrivilege);
        data.readBlacklist = this.formatBlacklist(globalPrivilege.get('read_field_blacklist'));
        data.writeBlacklist = this.formatBlacklist(globalPrivilege.get('write_field_blacklist'));
      }

      return data;
    },

    syncModel: function (method, id, attributes, options) {
      var model = this.collection.get(id);

      options = options || {};

      if (!model) {
        throw new Error('Permission model (' + id + ') not found.');
      }

      options = _.extend({
        wait: true,
        patch: true
      }, options);

      model[method](attributes, options);
    },

    updateModel: function (id, attributes, options) {
      this.syncModel('save', id, attributes, options);
    },

    destroyModel: function (id, attributes, options) {
      this.syncModel('destroy', id, attributes, options);
    },

    toggleWorkflowFlag: function () {
      if (this.hasWorkflowEnabled()) {
        this.$el.addClass('workflow-enabled');
      } else {
        this.$el.removeClass('workflow-enabled');
      }
    },

    _configure: function (options) {
      Backbone.Layout.prototype._configure.apply(this, arguments);

      _.extend(this, _.pick(options, viewOptions));
    },

    initialize: function () {
      this.constructPermissionsValueList();

      this.listenTo(this.collection, 'change', this.render);
      this.listenTo(this.collection, 'change remove', this.toggleWorkflowFlag);
    }
  });
});
