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

  var template = '<label>{{capitalize name}}<span class="note">{{comment}}</span></label> \
                              {{#if cb_list}} \
                                {{#options}} \
                                        <input style="margin-top:1px;" name="{{key}}" type="checkbox" {{#if selected}}checked{{/if}}/> {{value}} \
                                {{/options}}</select> \
                              {{else}} \
                                <select multiple> \
                                    {{#options}} \
                                        <option value="{{key}}" {{#if selected}}selected{{/if}}>{{value}}</option> \
                                    {{/options}}</select> \
                              {{/if}} \
                              <input type="hidden" name="{{name}}">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'click select': function(e) {
        var values = this.$el.find('select').val();
        var out = "";
        for (var i=0; i<values.length; i++) {
          out += values[i] + this.options.settings.get('delimiter');
        }

        out = out.substr(0, out.length - 1);

        this.$el.find('input').val(out);
      },
      'change input[type=checkbox]': function(e) {
        var values = this.$el.find('input[type=checkbox]:checked');
        var out = "";
        for (var i=0; i<values.length; i++) {
          out += $(values[i]).attr('name') + this.options.settings.get('delimiter');
        }

        out = out.substr(0, out.length - 1);

        this.$el.find('input').val(out);
      }
    },

    serialize: function() {
      var value = this.options.value || '';

      var values = value.split(this.options.settings.get('delimiter'));

      var options = this.options.settings.get('options');

      var cb_list = this.options.settings.get('type') == "cb_list";

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

      return {
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        options: options,
        cb_list: cb_list
      };
    }
  });

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});