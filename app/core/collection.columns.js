define([
  "app",
  "backbone"
],

function(app, Backbone) {

  var Structure = {};

  Structure.UI = Backbone.Model.extend({

    url: function() {
      return this.parent.url() + '/' + this.id;
    },

    //@todo: This is code repetition. Almost identical to entries.model. Create a mixin?
    validate: function(attributes, options) {
      var errors = [];

      //only validates attributes that are part of the schema
      attributes = _.pick(attributes, this.structure.pluck('id'));

      _.each(attributes, function(value, key, list) {
        var mess = ui.validate(this, key, value);
        if (mess !== undefined) {
          errors.push({attr: key, message: ui.validate(this, key, value)});
        }
      }, this);

      console.log(errors);

      if (errors.length > 0) return errors;
    }

  });

  Structure.Column = Backbone.Model.extend({

      parse: function(result) {
        var options = result.options || {};
        options.id = result.ui;
        this.options = new Structure.UI(options);
        this.options.parent = this;
        if (result.master) result.header = true;
        result.header = (result.header === "true" || result.header === true || result.header === 1 || result.header === "1") ? true : false;
        delete result.options;
        return result;
      },

      getOptions: function() {
        return this.options.get(this.attributes.ui);
      },

      getRelated: function() {
        return (this.get('ui') === 'many_to_one') ? this.options.get('table_related') : this.get('table_related');
      },

      getRelationshipType: function() {
        var type = this.get('type');
        var ui = this.get('ui');

        if (_.contains(['MANYTOMANY', 'ONETOMANY'], type)) return type;
        if (ui === 'many_to_one') return 'MANYTOONE';
      },

      hasRelated: function() {
        return this.getRelated() !== undefined;
      },

      toJSON: function(options) {
        if (options && options.columns) {
          return _.pick(this.attributes, options.columns);
        }
        return _.clone(this.attributes);
      }

  });

  //The equivalent of a MySQL columns Schema
  Structure.Columns = Backbone.Collection.extend({

    model: Structure.Column,

    comparator: function(row) {
      return row.get('sort');
    },

    save: function(attributes, options) {
      options = options || {};
      var collection = this;
      var success = options.success;

      options.success = function(model, resp, xhr) {
        collection.reset(model);
        if (success !== undefined) {
          success();
        }
      };

      $result = Backbone.sync('update', this, options);
      return $result;
    }
  });
  return Structure;
});