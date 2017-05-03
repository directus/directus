//  global.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus',
  'core/basePageView',
  'core/widgets/widgets',
  'core/t',
],

function(app, Backbone, Directus, BasePageView, Widgets, __t) {

  "use strict";

  var Global = BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('settings'),
        breadcrumbs: [{ title: __t('settings'), anchor: '#settings'}]
      },
    },

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget({widgetOptions: {basicSave: true}});
      this.saveWidget.setSaved(true);
      return [
        this.saveWidget
      ];
    },

    events: {
      'click .saved-success': function() {
        var data = this.editView.data();
        var success = function() { app.router.go('settings'); };
        this.model.save(data, {success: success});
      },
      'change select': 'checkDiff',
      'keyup input, textarea': 'checkDiff'
    },
    checkDiff: function(e) {
      this.saveWidget.setSaved(false);
    },

    beforeRender: function() {
      this.setView('#page-content', this.editView);
      BasePageView.prototype.beforeRender.call(this);
    },

    initialize: function(options) {
      this.editView = new Directus.EditView({model: this.model, structure: options.structure});
      this.headerOptions.route.title = this.options.title;
    }

  });

  return Global;

});
