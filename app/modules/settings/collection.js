define([
  "app",
  "backbone",
  "core/collection"
],

function(app, Backbone, Collection) {

	"use strict";

	var Settings = Collection.extend({

		model: Backbone.Model.extend({
			getStructure: function() {
				return this.structure;
			}
		})

	});

	return Settings;

});
