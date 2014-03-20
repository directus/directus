//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'multi_select';
  Module.dataTypes = ['VARCHAR', 'TEXT'];

  Module.variables = [
    {id: 'type', ui: 'select', options: {options: {'select_list':'Select List','cb_list':'Checkbox List'} }},
    {id: 'delimiter', ui: 'textinput', char_length:1, required: true  },
    {id: 'options', ui: 'textarea', options:{'rows': 25}  }
  ];

  var select_list_template = '<label>{{capitalize name}}<span class="note">{{comment}}</span></label> \
                              <select multiple name="{{name}}" {{#if readonly}}disabled{{/if}}> \
                                  {{#options}} \
                                      <option value="{{key}}" {{#if selected}}selected{{/if}}>{{value}}</option> \
                                  {{/options}}</select>';

  var cb_list_template = '<label>{{capitalize name}}<span class="note">{{comment}}</span></label> \
                 <input type="text" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/> \
                 <span class="label char-count hide">{{characters}}</span>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(select_list_template),

    serialize: function() {
      var value = this.options.value || '';

      var values = value.split(this.options.settings.get('delimiter'));

      console.log(values);

      var options = this.options.settings.get('options');

      if (_.isString(options)) {
        options = $.parseJSON(options);
      }

      options = _.map(options, function(value, key) {
        var item = {};
        item.value = value;
        item.key = key;
        item.selected = ($.inArray(item.key, values) != -1);
        return item;
      });

      console.log(options);

      return {
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        options: options
      };
    }
  });

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});