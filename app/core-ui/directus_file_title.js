//  Files Title Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIView'], function(app, UIView) {

  'use strict';

  var Module = {};

  Module.id = 'directus_file_title';
  Module.system = true;

  Module.variables = [
    {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }}
  ];

  var template = '{{#unless readonly}}<div class="char-count-container"><input type="text" value="{{value}}" name="{{name}}" id="{{name}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/> \
                  <span class="char-count hide">{{characters}}</span></div>{{else}}<span>{{value}}</span>{{/unless}}';

  Module.Input = UIView.extend({
    template: Handlebars.compile(template),

    events: {
      'focus input': function() { this.$el.find('.char-count').removeClass('hide'); },
      'input input': 'updateMaxLength',
      'blur input': function() { this.$el.find('.char-count').addClass('hide'); }
    },

    updateMaxLength: function(e) {
      var length = this.options.schema.get('char_length') - e.target.value.length;
      this.$el.find('.char-count').html(length);
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';
      var readonly = false;

      return {
        size: (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large',
        value: value,
        name: this.options.name,
        maxLength: length,
        characters: length - value.toString().length,
        comment: this.options.schema.get('comment'),
        readonly: readonly
      };
    }
  });

  Module.validate = function(value, options) {
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;
});
