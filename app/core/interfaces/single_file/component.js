define([
  'app',
  'underscore',
  'backbone',
  'core/UIComponent',
  './interface',
  'core/t'
], function (app, _, Backbone, UIComponent, Input, __t) {

  'use strict';

  // Attribute            Type                   Contains                                Example
  // -------------------------------------------------------------------------------------------------------------------------------------
  // options.model        Backbone.Model         Data/Model for this table row           options.model.get('id') [any column in current table row]
  // options.collection   Backbone.Collection    Collection where the model belongs to   options.collection.get(<id>) [any id in the collection]
  // options.schema       Backbone.Model         Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
  // options.settings     Backbone.Model         Saved values for current UI options     options.settings.get('length') [any key from this UI options]
  // options.value        String                 Value for this field
  // options.view         Backbone.View          Component Input view - Only on validation

  return UIComponent.extend({
    // Interface unique name
    id: 'single_file',

    // List of data type this Interface will support
    dataTypes: ['INT'],

    // Interface options
    // These are schema structures object
    variables: [
      {id: 'allowed_filetypes', type: 'String', default_value: '', ui: 'text_input', char_length: 200, options: {placeholder: 'Allow all filetypes'}}
    ],

    // Interface View
    Input: Input,

    // This is execute before saving a model
    // to make sure this Interface has valid data.
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value.attributes)) {
        return __t('this_field_is_required');
      }
    },

    _avatarList: function (options) {
      var model = options.model;
      var table = options.collection.table.id;

      if (table === 'directus_users') {
        return model.get('avatar');
      }
    },

    // Interface representation on table listing
    list: function (options) {
      var model = options.value;

      var orientation = (parseInt(model.get('width'), 10) > parseInt(model.get('height'), 10)) ? 'landscape' : 'portrait';
      var type = (model.get('type')) ? model.get('type').substring(0, model.get('type').indexOf('/')) : '';
      var subtype = model.getSubType(true);

      var isImage = _.contains(['image', 'embed'], type) || _.contains(['pdf'], subtype);
      var thumbUrl = isImage ? model.makeFileUrl(true) : (this._avatarList(options) || app.PATH + 'assets/img/document.png');

      return '<div class="media-thumb"><img src="' + thumbUrl + '" class="img ' + orientation + '"></div>';
    }

    // Value that represent the interface
    // Ex: user id, instead of user image url
    //     date timestamp instead of a formatted date
    // value: function() {},

    // Value used to sort the interface
    // Ex: user id, instead of user image url
    //     date timestamp instead of a formatted date
    // sort: function() {}
  });
});
