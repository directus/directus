//  header..js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/header/header.toolsleftview'
],

function(app, Backbone, HeaderToolsLeftView) {

  "use strict";

  var Header = app.module();

  Header.HeaderModel = Backbone.Model.extend({
    optionsMappings: {
      'entries' : {
        leftToolbar: true,
      }
    },
    setRoute: function(title, breadcrumbs, options) {
      var data = {
        title: title,
        breadcrumbs: breadcrumbs
      };
      this.set({route: data});
      if(options === undefined) {
        options = {};
      }
      this.set({options: options});
    }
  });

  Header.HeaderView = Backbone.Layout.extend({

    template: 'header/header',

    tagName: 'div',

    attributes: {
      class: 'main-container'
    },

    serialize: function() {
      var data = this.model.get('route');

      if(data === undefined) {
        data = {
          title: "Directus"
        };
      }

      return data;
    },
    initialize: function(options) {
      this.options = options;

      this.model.on('change', function() {
        this.options = this.model.get('options');
        this.render();
      }, this);
    },

    beforeRender: function() {
      if(this.options) {
        if(this.options.leftToolbar) {
          this.leftToolbar = this.setView('#tools-left-insert', new HeaderToolsLeftView(this.options));
        } else if(this.leftToolbar) {
          this.leftToolbar.remove();
        }
      }
    }
  });

  return Header;
});