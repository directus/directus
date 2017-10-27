define(function (require, exports, module) {
  'use strict';

  var Backbone = require('backbone');
  var _ = require('underscore');
  var Handlebars = require('handlebars');

  require('plugins/backbone.layoutmanager');

  module.exports = Backbone.Layout.extend({
    // base template route
    prefix: 'app/core/interfaces/',
    // Handlebars template source
    templateSource: null,
    templateCompileOptions: {},
    // Base Tag that the template resides within
    tagName: 'div',
    // Attributes applied to the base tag
    attributes: {
      class: 'interface-field'
    },
    name: null,
    columnSchema: null,
    model: null,
    settings: null,

    // null: do not force visibility
    // false: hidden
    // true: visible
    visible: null,

    // Adding a `unsavedChange` method into any interface
    // will allow the interface to inject value before saving
    // this changes won't trigger the unsaved changes event on leaving the form
    _beforeSaving: function () {
      var value = _.result(this, 'unsavedChange');

      if (value !== undefined) {
        this.model.set(this.name, value);
      }
    },

    isRequired: function () {
      return this.columnSchema.get('required') === true;
    },

    // Parent field view additional classes
    fieldClass: function () {},

    hideLabel: false,

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
      var structure = _.result(options.model, 'getStructure') || options.model.structure || options.structure;

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

      this.listenTo(this.model, 'save:before', this._beforeSaving);
    }
  });
});
