/* eslint-disable */

(function directusConfig() {
  const config = {
    // The API URLs the user can connect to using this instance of the application.
    // Object values are used as project name in the app
    // Don't forget to add the API environment!
    api: {
      "../_/": "Directus Demo API"
    },

    // Allow the user to connect to any API by entering a URL in a text field
    //   instead of selecting from a dropdown
    allowOtherAPI: false,

    // Controls the way the application routes. By default, routing is done using
    //   hashes (#) to ensure the app works without any server url rewrites.
    //
    // If you're using the application and have the correct URL rewrites in place
    //   (everything to /index.html), you can change this to "history" to make
    //   the urls in the app a little prettier
    routerMode: "hash", // hash | history

    // When using history mode, the application will make all the routes "pretty"
    // by using absolute paths. If you are serving the application from a folder
    // like /admin, this will cause the routes to be wrong (eg /collection instead
    // of /admin/collections). To combat this, set the routerBaseUrl to the path
    // you're serving the application from
    routerBaseUrl: "/"
  };

  window.__DirectusConfig__ = config;
})();
