define([
  'app',
  'underscore',
  'backbone',
  'handlebars',
  'core/PreferenceModel'
],
function(app, _, Backbone, Handlebars, PreferenceModel) {

  "use strict";

  return Backbone.Layout.extend({

    template: 'core/widgets/visibility',

    tagName: 'div',

    attributes: {
      'class': 'select-container',
      'id': 'batchStatus'
    },

    events: {
      'change #visibilitySelect': function (event) {
        var $target = $(event.target).find(':selected');

        if ($target.attr('data-status') !== undefined && $target.attr('data-status') !== false) {
          var value = $(event.target).val();
          var name = {currentPage: 0};

          name['status'] = value;

          this.collection.setFilter(name);

          this.listenToOnce(this.collection.preferences, 'sync', function() {
            if (this.basePage) {
              this.basePage.removeHolding(this.cid);
            }

            if (this.defaultId) {
              this.collection.preferences.set({title:null, id: this.defaultId});
            }
          });
        }
      }
    },

    serialize: function() {
      var data = {hasActiveColumn: this.options.hasActiveColumn, mapping: []};
      var statusSelected = this.collection.getFilter('status');
      var keys = [];

      // @note: duplicate code, same as Selection Action Widget
      _.each(this.collection.getStatusVisible(), function (status) {
        var item = status.toJSON();

        item.isSelected = statusSelected == status.get('id');
        data.mapping.push(status.toJSON());
        keys.push(status.get('id'));
      });

      data.mapping.sort(function (a, b) {
        return a.sort > b.sort;
      });

      data.allKeys = keys.join(',');

      return data;
    },

    afterRender: function() {
      if (this.options.hasActiveColumn) {
        $('#visibilitySelect').val(this.collection.preferences.get('status'));
      }

      // Adjust dropdown width dynamically
      // var sel = this.$el.find('#visibilitySelect');
      // this.$el.find('#templateOption').text( sel.find(":selected").text() );
      // sel.width( this.$el.find('#template').width() * 1.03 + 10 ); // +10 is for arrow on right
    },
    initialize: function() {
      var table = this.collection.table;

      this.basePage = this.options.basePage;

      this.collection.on('sync', this.render, this);

      // if (this.collection.table.columns.get(app.statusMapping.status_name)) {
      if (table.hasStatusColumn()) {
        this.options.hasActiveColumn = true;
      }

      var options = {};
      if (app.router.loadedPreference) {
        options = {newTitle: app.router.loadedPreference};
      }

      this.listenToOnce(this.collection.preferences, 'sync', function() {
        if (this.basePage) {
          this.basePage.removeHolding(this.cid);
        }

        if (this.defaultId) {
          this.collection.preferences.set({title:null, id: this.defaultId});
        }
      });

      this.defaultId = this.collection.preferences.get('id');
      this.collection.preferences.fetch(options);
      if (this.basePage) {
        this.basePage.addHolding(this.cid);
      }
    }
  });
});
