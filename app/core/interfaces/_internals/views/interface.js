define([
  'app',
  'underscore',
  'core/UIComponent',
  'core/UIView'
], function(app, _, UIComponent, UIView) {

  'use strict';

  var Input = UIView.extend({

    template: '_internals/views/interface',

    events: {
      'click .js-view': 'updateViews'
    },

    updateViews: function (event) {
      var viewId = $(event.currentTarget).val();
      var value = _.compact(this.value); // clears the empty values
      var index = value.indexOf(viewId);
      var csv = '';

      if (index >= 0) {
        value.splice(index, 1);
      } else {
        value.push(viewId);
      }

      if (value.length > 0) {
        csv = ',' + value.join(',') + ',';
      }

      this.$('.js-value').val(csv);
    },

    serialize: function () {
      return {
        tilesSelected: this.value.indexOf('tiles') >= 0,
        calendarSelected: this.value.indexOf('calendar') >= 0,
        mapSelected: this.value.indexOf('map') >= 0,
        value: this.options.value,
        name: this.options.name
      }
    },

    initialize: function (options) {
      this.value = (this.options.value || '').split(',');
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_views',

    Input: Input
  });

  return Component;
});
