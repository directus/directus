define(['core/extensions', 'backbone', 'moment'], function (Extension, Backbone, moment) {
  var Model = Backbone.Model.extend({
    url: '/api/extensions/example/time'
  });

  return Extension.View.extend({
    template: 'example/templates/example',

    serialize: function () {
      return {
        datetime: moment(this.model.get('datetime')).format('YY-MM-DD hh:mm:ss')
      }
    },

    initialize: function () {
      this.model = new Model();
      this.listenTo(this.model, 'sync', this.render);
      this.model.fetch();
    }
  });
});
