define(function(require, exports, module) {

  'use strict';

  var Backbone = require('backbone');

  require('plugins/backbone.layoutmanager');

  module.exports = Backbone.Layout.extend({
    // Handlebars template source
    templateSource: null,
    templateCompileOptions: {},
    // Base Tag that the template resides within
    tagName: 'div',
    // Attributes applied to the base tag
    attributes: {
      class: 'field'
    },
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
      var structure = options.model.getStructure() || options.model.structure || options.structure;
      this.name = options.name;
      this.columnSchema = structure.get(this.name);
      this.settings = this.columnSchema.options;
      this.isRelational = (this.columnSchema.relationship !== undefined);
     this.templateCompileOptions = this.templateCompileOptions || {};
      if (this.templateSource) {
        this.template = Handlebars.compile(this.templateSource, this.templateCompileOptions);
      }

      // Default LayoutManager constructor
      UIView.__super__.constructor.call(this, options);
    }
  });
});
