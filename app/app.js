define(function (require, exports, module) {

  'use strict';

  // Load dependent Modules
  var Handlebars     = require('handlebars'),
      Backbone       = require('backbone'),
      config         = new Backbone.Model(require('core/config')),
      moment         = require('moment'),
      Utils          = require('utils'),
      _              = require('underscore'),
      __t            = require('core/t'),
      Notification   = require('core/notification'),
      typetools      = require('typetools');

  // Globally load Handlebars helpers
  require('helpers');

  // Load layout manager so it can be configured
  require('plugins/backbone.layoutmanager');

  // Load Backbone Model Track it plugin
  // Track Model changes
  require('plugins/backbone.trackit');

  // Load Backbone Model Stick it plugin
  // Sync changes between views and model
  require('plugins/backbone.stickit');

  // hotfix: add isTracking function to all models
  // TODO: Implement this into the Directus base model object
  _.extend(Backbone.Model.prototype, {
    isTracking: function () {
      return this._isTracking;
    }
  });

  // Globally load Bootstrap plugins
  require('plugins/bootstrap-dropdown');
  require('plugins/typeahead');

  var locked = false;

  var app = {

    config: config,

    progressView: undefined,

    alertViews: [],

    lock: function () {
      this.lockScreen();
      locked = true;
    },

    unlock: function () {
      this.unlockScreen();
      locked = false;
    },

    isLocked: function () {
      return locked === true;
    },

    lockScreen: function () {
      this.noScroll = true;
    },

    unlockScreen: function () {
      this.noScroll = false;
    },

    startMessagesPolling: function () {
      this.pollingMessages = true;
      this.checkMessages();
    },

    checkMessages: function () {
      if (this.pollingMessages !== true) {
        return;
      }

      var updateFrequency = 10000; // 10 seconds

      this.fetchMessages();

      window.setTimeout(this.checkMessages.bind(this), updateFrequency);
    },

    stopMessagesPolling: function () {
      var waitToRestart = 30000; // 30 seconds

      this.pollingMessages = false;
      window.setTimeout(this.startMessagesPolling.bind(this), waitToRestart);
    },

    fetchMessages: function () {
      var self = this;
      var data = {
        'max_id': this.messages.maxId
      };

      var onSuccess = function (collection, response) {
        if (response != null && response.data) {
          var messages = response.data;

          if (!_.isArray(messages)) {
            messages = [messages];
          }

          messages.forEach(function (data) {
            var message_excerpt = (data.message && data.message.length > 50) ? data.message.substr(0, 50) : data.message;

            Notification.show('New Message — <i>' + data.subject + '</i>', message_excerpt + '<br><br><i>View message</i>', {
              timeout: 5000,
              callback: {
                onCloseClick: function () {
                  var path = '/messages/' + data.id;
                  var reply;

                  if (data.responses) {
                    reply = data.responses.first();
                    if (reply) {
                      path += '/response/' + reply.id;
                    }
                  }

                  Backbone.history.navigate(path, true);
                }
              }
            });
          });

          self.trigger('messages:new', messages);
        }
      };

      var onError = function () {
        // self.trigger('error:polling');
        // Notification.error('Directus can\'t reach the server', '<i>A new attempt will be made in 30 seconds</i>');
        self.stopMessagesPolling();
      };

      this.messages.fetch({
        data: data,
        parse: true,
        remove: false,
        global: false,
        silent: true,
        success: onSuccess,
        error: onError
      });

    },

    request: function (type, url, options) {
      options = options || {};

      var params = {
        type: type,
        url: url,
        dataType: options.dataType || 'json'
      };

      if (options.path !== true) {
        // the parameter url by default is a path/endpoint of the Directus API
        // if path is specified it means it's a full url being passed
        // Also, making sure the path has not leading slash
        // app.API_URL has a trailing slash
        // TODO: Remove the trailing slash of app.API_URL :)
        params.url = (params.url || '');
        if (!params.url.startsWith(app.API_URL)) {
          params.url = app.API_URL + params.url.replace(/^\//, '');
        }
      }

      return Backbone.$.ajax(_.extend(params, options));
    },

    // bInactive true if logged out because inactive
    logOut: function (bInactive, force) {
      var url = app.API_URL + 'auth/logout';

      this.lock();

      // if bInactive pass url parameter
      if (bInactive) {
        url += '/inactive';
      }

      if (force) {
        window.onbeforeunload = null;
      }

      window.location.href = url;
    },

    getCorsOptions: function () {
      return this.options.cors || {};
    },

    getCors: function (key) {
      var options = this.getCorsOptions() || {};

      return options[key];
    },

    getCorsTargets: function () {
      var origins = this.getCors('origin');

      return Utils.parseCSV(origins);
    },

    //  TODO: implement this into a new logger
    //logErrorToServer: function(type, message, details) {
    //  var user = app.user, email = 'n/a';
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

    checkUserEditingConflict: function () {
      var users = app.users.clone();
      var currentPagePath = Backbone.history.fragment;

      users.clearFilter();
      users.setFilter({
        limit: -1,
        columns: ['id', 'first_name', 'last_name', 'last_page'],
        filters: {
          id: {
            neq: app.user.id
          },
          last_access: {
            gte: moment.utc().subtract(3, 'minutes').format('YYYY-MM-DD HH:mm:ss')
          }
        }
      });

      var onSuccess = function (collection) {
        var editingThisPage = [];
        var fullNames = [];

        collection.each(function (user) {
          var lastPage;

          try {
            lastPage = JSON.parse(user.get('last_page'));
          } catch (ex) {
            lastPage = {};
          }

          if (lastPage && lastPage.path == currentPagePath) {
            editingThisPage.push(user);
          }
        });

        if (editingThisPage.length > 0) {
          fullNames = _.map(editingThisPage, function (user) {
            return user.getFullName();
          });

          var localeKey = 'warning_x_is_editing_same_page';
          if (fullNames.length > 1) {
            localeKey = 'warning_x_are_editing_same_page';
            fullNames = Utils.joinList(fullNames, ', ', __t('and'));
          } else {
            fullNames = fullNames.join(', ');
          }

          Notification.warning(__t(localeKey, {
            full_names: fullNames
          }))
        }
      };

      users.fetch({success: onSuccess, global: false});
    },

    evaluateExpression: function (a, operator, b) {
      switch (operator) {
        case '==':
          return (a == b);
        case '===':
          return (a === b);
      }
    },

    getCurrentGroup: function () {
      var user = app.user;
      return user.get('group');
    },

    getBookmarks: function () {
      return app.bookmarks;
    },

    deepClone: function (data) {
      return JSON.parse(JSON.stringify(data));
    },

    affix: function () {
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

  app.sendFiles = function (files, callback, progressCallback) {
    var formData = new FormData();

    var success = function(responseData) {
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
      error: function () {
        app.trigger('alert','upload failed', arguments);
        callback.apply(this, []);
      },
      xhr: function () {  // custom xhr
        var myXhr = $.ajaxSettings.xhr();
        if(myXhr.upload && progressCallback){ // check if upload property exists
          myXhr.upload.addEventListener('progress',progressCallback, false); // for handling the progress of the upload
        }
        return myXhr;
      }
    });
  };

  app.sendLink = function (link, callback) {
    var success = function (responseData) {
      callback.apply(this, [responseData]);
    };

    $.ajax({
      url: app.API_URL + 'upload/link',
      type: 'POST',
      data: {
        'link': link
      },
      success: success,
      error: function (err1, err2, err3) {
        app.trigger('alert','upload failed', arguments);
      }
    });
  };

  // check if string has this format "D, d M Y H:i:s"
  app.isStringADate = function (date) {
    return (typeof date === 'string') ? !!date.match(/^([a-zA-Z]{3})\, ([0-9]{2}) ([a-zA-Z]{3}) ([0-9]{4}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/) : false;
  };

  // Agnus Croll:
  // http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  Object.toType = function (obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  };


  //Give forms the ability to serialize to objects
  $.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
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

    prefix: 'app/templates/',


    fetchTemplate: function (path) {
      // Concatenate the file extension.

      // If template is not a path but instead Handlebars.Compile
      if (typeof path === 'function') {
        return path;
      }

      path = path + '.handlebars';

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
        // FIXME: make all calls async
        async: false,
        success: function (contents) {
          contents = contents ? contents.replace(/(\r\n|\n|\r|\t)/gm, '') : contents;
          done(JST[path] = Handlebars.compile(contents));
        }
      });

    }
  });

  // source: http://stackoverflow.com/a/6491621
  _.findStringKey = function (object, string) {
    string = string.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    string = string.replace(/^\./, '');           // strip a leading dot
    var a = string.split('.');

    for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in object) {
        object = object[k];
      } else {
        return;
      }
    }

    return object;
  };

  // Mix Backbone.Events, modules, typetools, and layout management into the app object.
  app = _.extend(app, {
    // Create a custom object with a nested Views object.
    module: function (additionalProps) {
      return _.extend({ Views: {} }, additionalProps);
    },

    // Helper for using layouts.
    useLayout: function (options) {
      // Create a new Layout with options.
      var layout = new Backbone.Layout(_.extend({
        el: 'body'
      }, options));

      // Cache the refererence.
      this.layout = layout;
      return this.layout;
    }

  }, Backbone.Events, typetools);

  module.exports = app;
});
