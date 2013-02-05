define([
  "app",
  "backbone",
  "core/collection.entries"
],

function(app, Backbone, Entries) {


  // OK! This is great. We only need to override models. Collections are kinda simplistic.

  var Model = Entries.Model.extend({

    uploader: true,

    parse: function(response) {
      return response;
    },

    sync: function(method, model, options) {

      var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'patch':  'PATCH',
        'delete': 'DELETE',
        'read':   'GET'
      };

      var type = methodMap[method];

      var data = new FormData();
      _.each(this.attributes, function(value, key) {
        data.append(key, value);
      });

      options.data = data;
      options.cache = false;
      options.contentType = false;
      options.processData = false;
      options.type = 'POST';

      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
      };

      return Backbone.sync.apply(this, [method, model, options]);
    }

  });

  var Collection = Entries.Collection.extend({
    model: Model
  });

  return Collection;
});