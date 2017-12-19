define([
  'app',
  'backbone',
  'underscore',
  'moment',
  'core/t',
  'core/UIComponent',
  'core/UIView'
], function (app, Backbone, _, moment, __t, UIComponent, UIView) {

  'use strict';

  return UIComponent.extend({
    id: 'comments_count',
    system: true,
    Input: UIView,
    list: function (interfaceOptions) {
      var collection = interfaceOptions.value;
      var latest;
      var output = 0;

      if (collection instanceof Backbone.Collection && collection.length > 0) {
        collection.each(function (model) {
          latest = _.max([latest, model], function (model) {
            return model ? moment(model.get('datetime')) : -1;
          });
        });

        var count = collection.length;
        var time = moment(latest.get('datetime')).timeAgo('small');
        var author = app.users.get(latest.get('from')).getFullName();

        output = '<span class="tag">' + count + '</span> ' + __t('x_time_by_y', {
          time: time,
          by: author
        });
      }

      return output;
    }
  });
});
