define([
  'backbone'
],
function(Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <span for="status" {{#unless isUpToDate}} class="saved"{{/unless}}> \
        <span type="button" class="tool-item large-circle"> \
          <span class="icon icon-check"></span> \
        </span> \
        <span class="simple-select"> \
          {{#if isUpToDate}} \
            All Changes Saved \
          {{else}} \
            Save Changes \
          {{/if}} \
        </span> \
        <span class="icon icon-triangle-down"></span> \
        <select id="saveSelect" name="status"> \
          <option selected></option> \
          <option value="save-form-stay">Save And Stay</option> \
          <option value="save-form-add">Save And Add</option> \
          <option value="save-form-copy">Save As Copy</option> \
        </select> \
      </span>'
    ),

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },
    serialize: function() {
      return this.options.widgetOptions;
    },
    setSaved: function(isSaved) {
      this.options.widgetOptions.isUpToDate = isSaved;
      this.render();
    },
    initialize: function(options) {
      if(!options.widgetOptions) {
        this.options.widgetOptions = {isUpToDate: true};
      }
    }
  });
});