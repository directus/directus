define(function(require, exports, module) {

  "use strict";

  var Backbone = require('backbone');

  require('plugins/backbone.layoutmanager');

  module.exports = Backbone.Layout.extend({

    tagName: 'div',

    name: null,

    columnSchema: null,

    model: null,

    settings: null,

   /**
    * Default constructor
    * @param options
    * @param options.model      The model *
    * @param options.name       The attribute of the model *
    * @param options.structure  The Column Collection for the table
    * @param options.schema     The Column Model for the attribute
    * @param options.value      The value of the attribtue
    * @param options.collection The collection that the model belong to
    * @param options.canWrite   Should the UI be writable?
    * @param options.settings   UI Settings
    */
    constructor: function UIView(options) {

      this.name = options.name;
      this.columnSchema = options.model.getStructure().get(this.name);
      this.settings = this.columnSchema.options;

      this.isRelational = (this.columnSchema.relationship !== undefined);

      // Default LayoutManager constructor
      UIView.__super__.constructor.call(this, options);

    }

  });

});