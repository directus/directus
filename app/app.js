define([
  "handlebars",
  "plugins/backbone.layoutmanager",
  "plugins/bootstrap-dropdown",          //load anonomosly
  "plugins/bootstrap-typeahead",          //load anonomosly
  "plugins/jquery.timeago"               //load anonomosly
],

function(Handlebars) {

  // Provide a global location to place configuration settings and module
  // creation.
  var app = {

    lastXhrError: undefined,

    getLastXhrError: function() {
      var xhrError;
      if(undefined !== this.lastXhrError) {
        xhrError = this.lastXhrError;
        this.lastXhrError = undefined;
      }
      return xhrError;
    },

    evaluateExpression: function(a, operator, b) {
      switch (operator) {
        case '==':
          return (a == b);
        case '===':
          return (a === b);
      }
    },

    getCurrentUser: function() {
       var authenticatedUser = window.directusData.authenticatedUser;
       var user = app.users.get(authenticatedUser.id);
       return user;
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
    },

    contextualDate: function(value) {
      return jQuery.timeago(value+'Z');
    },

    affix: function() {
      var sidebarOffset = $('.container-sidebar').offset();
      var navbarHeight = $('.navbar').height();
      var stickyHeight = parseInt(sidebarOffset.top,10) - parseInt(navbarHeight,10) - 20;
      var stuck = false;
      $(window).scroll(function(e){
        var scrollTop = $(window).scrollTop();
        if(!stuck && scrollTop >= stickyHeight){
          //console.log("stuck");
          stuck = true;
          $(".container-sidebar").addClass('affix-sidebar');
        } else if(stuck && scrollTop < stickyHeight){
          //console.log("unstuck");
          stuck = false;
          $(".container-sidebar").removeClass('affix-sidebar');
        }
      });
    },

    numberWithCommas: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    summarizeArray: function(array) {
      return _.reduce(array, function(memo, num){ return memo + parseInt(num,10); }, 0);
    },

    capitalize: function(string, seperator) {
      var idIndex;

      if (!string) return '';

      if (seperator === undefined) {
        seperator = "_";
      }

      directusIndex = string.indexOf("directus_");

      if (directusIndex === 0) {
        string = string.substring(9);
      }

      idIndex = string.lastIndexOf("_id");

      if (string.length > 2 && string.length - idIndex === 3) {
        string = string.substring(0, idIndex);
      }

      var output = _.map(string.split(seperator), function(word) { return word.charAt(0).toUpperCase() + word.slice(1); }).join(' ');

      // var output2 = output;
      // output.toLowerCase();
      // output = (output + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
      //   return $1.toUpperCase();
      // });
      // output.trim();
      // output = output.replace(new RegExp("!\s+!", "g")," ");

      // Replace all custom capitalization here
      _.each(app.caseSpecial, function(correctCase) {
        output = output.replace(new RegExp("\\b"+correctCase+"\\b", "gi"), correctCase);
      });

      // Make all prepositions and conjunctions lowercase, except for the first word
      _.each(app.caseLower, function(correctCase) {
        output = output.replace(new RegExp(" "+correctCase+"\\b", "gi"), " "+correctCase);
      });

      return output;
    },

    caseSpecial: [
      'CMS',
      'FAQ',
      'iPhone',
      'iPad',
      'iPod',
      'iOS',
      'iMac',
      'PDF',
      'PDFs',
      'URL',
      'IP',
      'UI',
      'FTP',
      'DB',
      'WYSIWYG',
      'CV',
      'ID',
      'pH',
      'PHP',
      'HTML',
      'JS',
      'CSS',
      'SKU',
      'DateTime',
      'RNGR',
      'CC',
      'CCV',
      'SoulCycle'
    ],

    // Conjunctions and prepositions should be lowercase
    caseLower: [
      'a',
      'an',
      'the',
      'and',
      'of',
      'but',
      'or',
      'for',
      'nor',
      'with',
      'on',
      'at',
      'to',
      'from',
      'by'
    ],

    actionMap: {
      'ADD': 'added',
      'DELETE': 'deleted',
      'UPDATE': 'updated'
    },

    prepositionMap: {
      'ADD': 'to',
      'DELETE': 'from',
      'UPDATE': 'within'
    }

  };

  app.sendFiles = function(files, callback) {
    var formData = new FormData();

    if (files instanceof File) files = [files];

    _.each(files, function(file, i) {
      formData.append('file'+i, file);
    });

    $.ajax({
      url: app.API_URL + 'upload',
      type: 'POST',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: callback,
      error: function(err1, err2, err3) {
        console.log('ERRRRRROOOORRR!!', err1, err2, err3);
      }
    });
  };

  // Agnus Croll:
  // http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
  Object.toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  };


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
      // ASYNC is causing render-order trouble, use sync now since it will be compiled anyway

      //$.get(app.root + path, function(contents) {
      //  done(JST[path] = Handlebars.compile(contents));
      //});

      $.ajax({
        url: app.root + path,
        async: false,
        success: function(contents) {
          done(JST[path] = Handlebars.compile(contents));
        }
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