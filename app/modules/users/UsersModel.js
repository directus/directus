define([
  "app",
  "backbone",
  "core/entries/EntriesModel"
],

function(app, Backbone, EntriesModel) {

  return EntriesModel.extend({
    
    initialize: function() {
      EntriesModel.prototype.initialize.apply(this, arguments);
    }
  
  });

});