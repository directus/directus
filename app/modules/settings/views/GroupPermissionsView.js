//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'core/BasePageView',
  'modules/tables/views/EditView',
  'core/widgets/widgets',
  'core/t',
  'core/notification',
  'core/doubleConfirmation'
],

function(app, Backbone, _, Handlebars, BasePageView, EditView, Widgets, __t, Notification, DoubleConfirmation) {

  'use strict';

  var confirmDestroyGroup = function (groupName, callback, context) {
    context = context || this;

    DoubleConfirmation({
      value: groupName,
      emptyValueMessage: __t('invalid_group'),
      firstQuestion: __t('question_delete_this_group'),
      secondQuestion: __t('question_delete_this_group_confirm', {group_name: groupName}),
      notMatchMessage: __t('group_name_did_not_match'),
      callback: callback
    }, context);
  };

  var destroyGroup = function (model, callback) {
    var options = {
      wait: true
    };

    options.success = function(model, response) {
      if (response.success === true) {
        var groupName = model.get('name');

        Notification.success(__t('group_removed'), __t('group_x_was_removed', {
          group_name: groupName
        }), 3000);

        if (callback) {
          callback();
        }
      } else {
        Notification.error(response.error.message);
      }
    };

    model.destroy(options);
  };

  var GroupPermissions = {};

  GroupPermissions.Collection = Backbone.Collection.extend({

    parse: function(result) {
      return result.data;
    }
  });

  GroupPermissions.EditPage = EditView.extend({
    getHeaderOptions: function() {
      var options = EditView.prototype.getHeaderOptions.apply(this, arguments);

      return _.extend(options, {
        route: {
          breadcrumbs: [
            {title: __t('settings'), anchor: '#settings'},
            {title: __t('group_permissions'), anchor: '#settings/permissions'}
          ]
        },
        basicSave: true,
        className: 'header settings'
      });
    },

    leftToolbar: function () {
      var widgets = EditView.prototype.leftToolbar.apply(this, arguments);
      var self = this;

      widgets.push(new Widgets.ButtonWidget({
        widgetOptions: {
          buttonId: 'removeBtn',
          iconClass: 'close',
          buttonClass: 'serious',
          buttonText: __t('delete')
        },
        onClick: function(event) {
          confirmDestroyGroup(self.model.get('name'), function () {
            destroyGroup(self.model, function () {
              app.router.go(['settings', 'groups']);
            });
          });
        }
      }));

      return widgets;
    },

    rightPane: false
  });

  return GroupPermissions;
});
