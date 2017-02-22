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

      data.online = this.model.isOnline();
      data.lastSeen = this.model.lastSeen();

      return data;
    }
  });
});
