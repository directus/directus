//  main.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

require([
  "app",
  "router",
  "backbone"
],

function(app, Router, Backbone) {

    // Define your master router on the application namespace and trigger all
    // navigation from this instance.
    app.router = new Router({data: window.directusData});

    // Trigger the initial route and enable HTML5 History API support, set the
    // root folder to '/' by default.  Change in app.js.
    Backbone.history.start({ pushState: true, root: app.root });



    // All navigation that is relative should be passed through the navigate
    // method, to be processed by the router. If the link has a `data-bypass`
    // attribute, bypass the delegation completely.
    $(document).on("click", "a[href]:not([data-bypass])", function(evt) {
      // Get the absolute anchor href.
      var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
      // Get the absolute root.
      var root = location.protocol + "//" + location.host + app.root;

      // Ensure the root is part of the anchor href, meaning it's relative.
      if (href.prop.slice(0, root.length) === root) {
        // Stop the default event to ensure the link will not cause a page
        // refresh.
        evt.preventDefault();

        // Don't follow empty links
        if (href.attr === '#') return;

        // `Backbone.history.navigate` is sufficient for all Routers and will
        // trigger the correct events. The Router's internal `navigate` method
        // calls this anyways.  The fragment is sliced from the root.

        Backbone.history.navigate(href.attr, true);
      }
    });

    //Override backbone sync for custom error handling
    var sync = Backbone.sync;

    Backbone.sync = function(method, model, options) {
      options.error = function(xhr, status, thrown) {
        alert(status.responseText);
      }
      sync(method, model, options);

    };

    //Cancel default file drop
    $(document).on('drop dragover', function(e) {
      e.preventDefault();
    });

    //Cancel default CMD + S;
    $(window).keydown(_.bind(function(e) {
      if (e.keyCode === 83 && e.metaKey) {
        e.preventDefault();
      }
    }, this));
});
