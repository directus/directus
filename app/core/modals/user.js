define(['core/Modal', 'moment'], function(Modal, moment) {

  'use strict';

  return Modal.extend({
    template: 'modal/user',

    attributes: {
      'id': 'modal',
      'class': 'modal profile'
    },

    serialize: function() {
      var data = this.model.toJSON();
      var lastAccess = this.model.get('last_access');

      data.online = moment(lastAccess).add('m', 5) > moment();
      data.lastSeen = moment(lastAccess).fromNow();

      return data;
    }
  });
});
