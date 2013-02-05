define([
  "handlebars",
  "plugins/backbone.layoutmanager",
  "plugins/bootstrap-dropdown",          //load anonomosly
  "plugins/jquery.timeago"               //load anonomosly
],

function(Handlebars) {

  // Provide a global location to place configuration settings and module
  // creation.
  var app = {
    API_URL: '/directus/api/1/',

    RESOURCES_URL: '/resources/',

    root: '/directus/',

    capitalize: function(string) {
      return _.map(string.split('_'), function(word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(' ');
    },

    bytesToSize: function(bytes, precision) {
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      var posttxt = 0;
      bytes = parseInt(bytes,10);
      if (bytes === 0) return 'n/a';
      while( bytes >= 1024 ) {
          posttxt++;
          bytes = bytes / 1024;
      }
      return bytes.toFixed(precision) + " " + sizes[posttxt];
    }
  };

  //Raw handlebars data, helpful with data types
  Handlebars.registerHelper('raw', function(data) {
    return data && new Handlebars.SafeString(data);
  });

  Handlebars.registerHelper('number', function(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  });

  Handlebars.registerHelper('resource', function(name) {
    return app.RESOURCES_URL + name;
  });

  Handlebars.registerHelper('capitalize', function(string) {
    return app.capitalize(string);
  });

  Handlebars.registerHelper('bytesToSize', function(bytes) {
    return app.bytesToSize(bytes, 0);
  });

  Handlebars.registerHelper('contextualDate', function(date) {
    return jQuery.timeago(date);
  });

  Handlebars.registerHelper('active', function(model) {
    switch (model.get('active')) {
      case 0:
        return 'deleted';
      case 1:
        return 'active';
      case 2:
        return 'inactive';
    }
  });


  //give forms the ability to serialize to objects

  $.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
  };

  // Localize or create a new JavaScript Template object.
  var JST = window.JST = window.JST || {};


  // Configure LayoutManager with Backbone Boilerplate defaults.
  Backbone.Layout.configure({
    // Allow LayoutManager to augment Backbone.View.prototype.
    manage: true,

    prefix: "app/templates/",

    fetch: function(path) {
      // Concatenate the file extension.

      // If template is not a path but instead Handlebars.Compile
      if (typeof path === 'function') {
        return path;
      }

      path = path + ".html";

      // If cached, use the compiled template.
      if (JST[path]) {
        return JST[path];
      }

      // Put fetch into `async-mode`.
      var done = this.async();

      // Seek out the template asynchronously.
      $.get(app.root + path, function(contents) {
        done(JST[path] = Handlebars.compile(contents));
      });
    }
  });

  // Mix Backbone.Events, modules, and layout management into the app object.
  return _.extend(app, {
    // Create a custom object with a nested Views object.
    module: function(additionalProps) {
      return _.extend({ Views: {} }, additionalProps);
    },

    // Helper for using layouts.
    useLayout: function(options) {
      // Create a new Layout with options.
      var layout = new Backbone.Layout(_.extend({
        el: "body"
      }, options));

      // Cache the refererence.
      return this.layout = layout;
    }

  }, Backbone.Events);
});