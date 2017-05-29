//  JSONEditor core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// JSONEditor Docs: https://github.com/josdejong/jsoneditor/blob/master/docs/api.md


define(['app', 'core/UIComponent', 'core/UIView', 'core/t', 'core/uis/jsoneditor/jsoneditor'], function (app, UIComponent, UIView, __t, JSONEditor) {
  'use strict';


  var Input = UIView.extend({
    template: 'jsoneditor/input',
    events: {},
    serialize: function () {
      var value = this.options.value || '';
      return {
        name: this.options.name,
        value: value
      }
    },

    afterRender: function () {
      this.createEditor();
    },

    createEditor: function () {
      var that = this;
      var json, text;

      // try to parse if it fails it's bogus json
      try {
        json = JSON.parse(that.options.value);
      } catch (e) {
        json = that.options.value;
      }

      var value = that.options.value !== null ? json : [{"key": "value"}];
      var jsonEditorName = "jsoneditor_" + that.options.name;

      var hiddenField = document.getElementById(jsonEditorName + '_value');
      var container = document.getElementById(jsonEditorName);

      var modes = that.options.settings.get('readonly') === true ? ['view'] : ['code', 'tree', 'text'];

      var options = {
        mode: modes[0], //default
        modes: modes, // allowed modes
        onError: function (err) {
          console.log(err.toString());
        },
        onChange: function () {
          hiddenField.value = that.editor.getText();
        }
      };

      // init the editor
      that.editor = new JSONEditor(container, options);

      if (typeof value === "string") {
        that.editor.setText(value);
      } else {
        that.editor.set(value);
      }

    }
  });

  var Component = UIComponent.extend({
    id: 'jsoneditor',
    dataTypes: ['VARCHAR', 'TEXT'],
    variables: [
      // Disables editing of the field while still letting users see the value
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'}
    ],
    Input: Input,
    /**
     * This is sent before the row is saved and is used to validate any form values
     * @param {obj} value - the value of the field
     * @param {obj} options - global options object
     */
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    /**
     * This is what is shown in list views
     */
    list: function (options) {
      // Just return back some lines we really don't want to show the content
      return '<span class="silver">' + options.value.slice(0, 50) + '</span>';
    }
  });


  return Component;
});
