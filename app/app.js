define(function(require, exports, module) {

  "use strict";

  // Load dependent Modules
  var Handlebars     = require('handlebars'),
      typetools      = require("typetools");

  // Globally load Handlebars helpers
  require('helpers');

  // Load layout manager so it can be configured
  require('plugins/backbone.layoutmanager');

  // Load Backbone Model Track it plugin
  // Track Model changes
  require('plugins/backbone.trackit');

  // Globally load Bootstrap plugins
  require('plugins/bootstrap-dropdown');
  require('plugins/typeahead');

  var app = {

    progressView: undefined,

    alertViews: [],

    lockScreen: function() {
      this.noScroll = true;
    },

    unlockScreen: function() {
      this.noScroll = false;
    },

    //bInactive true if logged out because inactive
    logOut: function(bInactive) {
      //if binactive pass url parameter
      if(bInactive) {
        window.location.href = app.API_URL + "auth/logout/inactive";
      } else {
        window.location.href = app.API_URL + "auth/logout";
      }
    },

    //  @TODO: remove this
    //logErrorToServer: function(type, message, details) {
    //  var user = app.users.getCurrentUser(), email = 'n/a';
    //
    //  if (user) {
    //    email = user.get('email');
    //  }
    //
    //  var data = {
    //    type: type,
    //    message: message,
    //    details: details,
    //    page: location.href,
    //    user_email: email
    //  };
    //
    //  $.post(app.API_URL + 'exception', JSON.stringify(data))
    //    .done(function(response) {
    //      console.log(response.response);
    //    })
    //    .error(function(obj) {
    //      console.log('FAILED TO LOG ERROR'+obj.responseText);
    //    });
    //},

    // http://stackoverflow.com/a/1830844
    isNumber: function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },

    evaluateExpression: function(a, operator, b) {
      switch (operator) {
        case '==':
          return (a == b);
        case '===':
          return (a === b);
      }
    },

    getCurrentGroup: function() {
      var user = app.users.getCurrentUser();
      return user.get('group');
    },

    getBookmarks: function() {
      return app.bookmarks;
    },

    deepClone: function(data) {
      return JSON.parse(JSON.stringify(data));
    },

    affix: function() {
      var sidebarOffset = $('#sidebar').offset();
      var navbarHeight = $('.navbar').height();
      var stickyHeight = parseInt(sidebarOffset.top,10) - parseInt(navbarHeight,10) - 20;
      var stuck = false;
      $(window).scroll(function(e){
        var scrollTop = $(window).scrollTop();
        if(!stuck && scrollTop >= stickyHeight){
          //console.log("stuck");
          stuck = true;
          $("#sidebar").addClass('affix-sidebar');
        } else if(stuck && scrollTop < stickyHeight){
          //console.log("unstuck");
          stuck = false;
          $("#sidebar").removeClass('affix-sidebar');
        }
      });
    }

  };

  app.sendFiles = function(files, callback, progressCallback) {
    var formData = new FormData();

    var success = function(responseData) {

      //Parse response date
      responseData = _.map(responseData, function(item) {
        // Safari hates dashes apparently
        // http://stackoverflow.com/a/5646753/1772076
        item.date_uploaded = new Date(item.date_uploaded.replace(/-/g, '/'));
        return item;
      });

      callback.apply(this, [responseData]);
    };

    if (files instanceof File) files = [files];
    _.each(files, function(file, i) {
      formData.append('file'+i, file);
    });

    //app.trigger('progress', 'Uploading');

    $.ajax({
      url: app.API_URL + 'upload',
      type: 'POST',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: success,
      error: function(err1, err2, err3) {
        app.trigger('alert','upload failed', arguments);
        //console.log('ERRRRRROOOORRR!!', err1, err2, err3);
      },
      xhr: function() {  // custom xhr
        var myXhr = $.ajaxSettings.xhr();
        if(myXhr.upload && progressCallback){ // check if upload property exists
          myXhr.upload.addEventListener('progress',progressCallback, false); // for handling the progress of the upload
        }
        return myXhr;
      },
    });
  };

  app.sendLink = function(link, callback) {
    var success = function(responseData) {
      callback.apply(this, [responseData]);
    };

    $.ajax({
      url: app.API_URL + 'upload/link',
      type: 'POST',
      data: {
        'link': link
      },
      success: success,
      error: function(err1, err2, err3) {
        app.trigger('alert','upload failed', arguments);
        //console.log('ERRRRRROOOORRR!!', err1, err2, err3);
      }
    });
  };

  // TODO: Move to a Directus backbone model
  // change status or delete item
  app.changeItemStatus = function(model, value, options) {
    var hasStatusColumn = model.has(app.statusMapping.status_name);
    var goingToDelete = value == app.statusMapping.deleted_num;

    if (goingToDelete && !hasStatusColumn) {
      // https://github.com/RNGR/Directus/issues/960
      // Pass {wait: true} if you'd like to wait for the server to respond
      // before removing the model from the collection.
      model.destroy(options);
    } else {
      var attributes = {};
      attributes[app.statusMapping.status_name] = value;
      model.save(attributes, options);
    }
  };

  app.changeCollectionStatus = function(collection, value, options) {
    var model = collection.at(0);
    var hasStatusColumn = model.has(app.statusMapping.status_name);
    var goingToDelete = value == app.statusMapping.deleted_num;

    if (goingToDelete && !hasStatusColumn) {
      collection.destroyAll(options);
    } else {
      collection.saveAll(options);
    }
  };

  // check if string has this format "D, d M Y H:i:s"
  app.isStringADate = function(date) {
    return (typeof date === "string") ? !!date.match(/^([a-zA-Z]{3})\, ([0-9]{2}) ([a-zA-Z]{3}) ([0-9]{4}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/) : false;
  };

  // Agnus Croll:
  // http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  Object.toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  };


  //Give forms the ability to serialize to objects
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


    fetchTemplate: function(path) {
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
      // ASYNC is causing render-order trouble, use sync now since it will be compiled anyway

      //$.get(app.root + path, function(contents) {
      //  done(JST[path] = Handlebars.compile(contents));
      //});

      $.ajax({
        url: app.root + path,
        global: false,
        async: false,
        success: function(contents) {
          done(JST[path] = Handlebars.compile(contents));
        }
      });

    }
  });

  window.app = app;

  // Mix Backbone.Events, modules, typetools, and layout management into the app object.
  app = _.extend(app, {
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
      this.layout = layout;
      return this.layout;
    }

  }, Backbone.Events, typetools);

  module.exports = app;

});
