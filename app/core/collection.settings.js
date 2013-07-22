define([
  "app",
  "backbone",
  "core/collection"
],

function(app, Backbone, Collection) {

	var Settings = Collection.extend({

		model: Backbone.Model.extend({
			getStructure: function() {
				return this.structure;
			}
		}),

		//Convert from nested object to Collection
		parse: function(result) {
			return _.map(result, function(value, key) { value.id = key; return value; });
		}

	});

	return Settings;

});
