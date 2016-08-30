//  Files Title Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var template = '{{#unless readonly}}<div class="char-count-container"><input type="text" value="{{value}}" name="{{name}}" id="{{name}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/> \
                  <span class="char-count hide">{{characters}}</span></div>{{else}}<span>{{value}}</span>{{/unless}}';

  var Input = UIView.extend({
    templateSource: template,

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
        size: this.options.settings.get('size'),
        value: value,
        name: this.options.name,
        maxLength: length,
        characters: length - value.toString().length,
        comment: this.options.schema.get('comment'),
        readonly: readonly
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_file_title',
    system: true,
    variables: [
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {'large':__t('size_large'),'medium':__t('size_medium'),'small':__t('size_small')} }}
    ],
    Input: Input,
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return Component;
});
