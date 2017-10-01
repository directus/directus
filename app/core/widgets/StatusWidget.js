define([
  'app',
  'underscore',
  'backbone',
  'utils',
  'core/t'
],
function(app, _, Backbone, Utils, __t) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/status',

    tagName: 'div',

    attributes: {
      class: 'status'
    },

    state: {
      open: false
    },

    events: {
      'click .js-status': function (event) {
        this.$el.toggleClass('expanded');
        this.state.open = !this.state.open;
      },

      'click li': function (event) {
        if (this.state.open) {
          this.$('li').removeClass('active');
          var $status = $(event.currentTarget);
          $status.addClass('active');

          this.model.set(this.getStatusColumnName(), $status.data('id'));
        }
      }
    },

    getStatusColumnName: function () {
      var table = this.model.table;

      return table.getStatusColumnName();
    },

    parseStatusItem: function (status, currentStatus) {
      var item = status.toJSON();

      // NOTE: do not strictly compare as status can (will) be string
      item.selected = status.get('id') == currentStatus;
      item.model = status;
      item.color = item.background_color || item.color;

      return item;
    },

    getStatusList: function () {
      var statuses = [];
      var model = this.model;
      var foundMatch = false;
      var structure = model.structure;
      var statusColumnName = this.getStatusColumnName();
      var currentStatus = this.model.get(statusColumnName);

      if (Utils.isNothing(currentStatus) && structure.get(statusColumnName)) {
        currentStatus = structure.get(statusColumnName).get('default_value');
      }

      // Go through all the statuses and add to the list all visible or a selected one
      model.getTableStatusesMapping().each(function (status) {
        var item = this.parseStatusItem(status, currentStatus);

        if (item.selected) {
          foundMatch = true;
        }

        if (item.selected || model.isStatusVisible(status)) {
          statuses.push(item);
        }
      }, this);

      // if there's not a match, we add the status as selected and name it "unknown"
      if (!foundMatch) {
        statuses.push({
          id: currentStatus,
          name: __t('unknown'),
          selected: true
        })
      }

      statuses = _.sortBy(statuses, function(item) {
        return item.sort;
      });

      return statuses;
    },

    serialize: function () {
      return {
        model: this.model,
        readonly: typeof this.model.canEdit === 'function'
                    ? this.model.canEdit(this.getStatusColumnName())
                    : true,
        statuses: this.getStatusList()
      };
    },

    initialize: function () {
      if (this.getStatusColumnName()) {
        this.model.on('change:' + this.getStatusColumnName(), this.render, this);
      }
    }
  });
});
