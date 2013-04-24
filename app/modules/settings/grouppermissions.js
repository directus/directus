//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus',
  'core/panes/pane.saveview'
],

function(app, Directus, PaneSaveView) {

  var Permissions = Backbone.Layout.extend({

    template: 'settings-grouppermissions',

    events: {
      'click .toggleFields': 'expandTableFields'
    },

    afterRender: function() {
      // this.$el.find('.table-fields').hide();
      app.affix();
    },

    expandTableFields: function(e){
      var $clickedCaret = this.$(e.target);
      var tableName = $clickedCaret.parent().parent().data('tableName');
      $clickedCaret.toggleClass('active');
      this.$el.find("[data-table-group='" + tableName + "']").toggleClass('active');
    }

  });

  var GroupPermissions = Backbone.Layout.extend({

    template: 'page',

    serialize: {
      title: 'XXX',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Permissions', anchor: '#settings/permissions'}],
      sidebar: true
    },

    beforeRender: function() {
      this.setView('#page-content', new Permissions({collection: this.collection}));
      //this.insertView('#sidebar', new PaneSaveView({model: this.model, single: this.single}));
    },

    afterRender: function() {
      //this.setView('#sidebar', new)
    }

  });

  return GroupPermissions;
});