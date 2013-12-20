define(function(require) {

  "use strict";
  var SchemaManager = require("schema/SchemaManager"),
      EntriesCollection = require("core/entries/EntriesCollection");

  var table = SchemaManager.getTable('albums'),
	  defaultOptions = SchemaManager.getFullSchema('albums');

  describe("EntriesCollection", function() {

    var entries = new EntriesCollection([], defaultOptions);

    console.log(entries.getNewInstance());

  });

});
