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
      'click .js-invite-user': 'invitationPrompt'
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
