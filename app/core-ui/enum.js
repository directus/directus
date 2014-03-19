//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'],function(app, Backbone) {

  "use strict";

  var Module = {};

  var template = '<label>{{{capitalize name}}} <span class="note">{{comment}}</span></label> \
                  <textarea rows="{{rows}}" name="{{name}}" id="{{name}}" {{#if readonly}}readonly{{/if}}>{{value}}</textarea>';

  Module.id = 'enum';
  Module.dataTypes = ['ENUM','SET'];

  Module.variables = [];

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    serialize: function() {
      console.log(this.options.name, this.options.schema);

      return {
        value: this.options.value,
        name: this.options.name,
        rows: (this.options.settings && this.options.settings.has('rows')) ? this.options.settings.get('rows') : '5',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }

  });

  Module.list = function(options) {
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    return val;
  };

  return Module;
});