//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Directus) {

  var Permissions = Backbone.Layout.extend({

    template: 'settings-grouppermissions',

    events: {
      'click .toggleFields': 'expandTableFields'
    },

    afterRender: function() {
      // this.$el.find('.table-fields').hide();
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
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Permissions', anchor: '#settings/permissions'}]
    },
    beforeRender: function() {
      this.setView('#page-content', new Permissions({collection: this.collection}));
    }
  });

  return GroupPermissions;
});