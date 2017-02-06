define([
  'app',
  'underscore',
  'backbone',
  'core/table/table.view',
  'core/listings/baseView'
], function(app, _, Backbone, TableView, BaseView) {

  var View = BaseView.extend(TableView.prototype, {
  });

  return {
    id: 'table',

    icon: 'menu',

    View: View.extend({
      optionsStructure: function() {
        var options = {};

        _.each(app.config.get('spacings'), function(name) {
          options[name] = name;
        });

        return [
          {
            id: 'spacing',
            type: 'String',
            required: true,
            ui: 'select',
            options: {
              options: options
            }
          }
        ]
      },

      onEnable: function() {
        this.on('preferences:updated', this.updateTableSpacing, this);
      },

      onDisable: function() {
        this.off('preferences:updated', this.updateTableSpacing, this);
      },

      updateTableSpacing: function() {
        var viewOptions = this.getViewOptions();
        this.setSpacing(viewOptions.spacing);
      },

      constructor: function() {
        View.prototype.constructor.apply(this, arguments);
        BaseView.prototype.constructor.apply(this, arguments);
      }
    })
  }
});
