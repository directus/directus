define(['app', 'backbone'] ,function(app, Backbone) {
  'use strict';

  return Backbone.Model.extend({

    url: function () {
      var url = app.API_URL + 'tables/directus_privileges/rows';

      if (!this.isNew()) {
        url += '/' + this.id;
      }

      return url;
    },

    parse: function(result) {
      return result.data ? result.data : result;
    }
  });

});
