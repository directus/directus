//  Slug Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'app',
  'underscore',
  'core/UIComponent',
  'core/UIView',
  'core/t'
], function(app, _, UIComponent, UIView, __t) {

  'use strict';

  var template = '<input type="text" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/>'+
                 '<span class="char-count hide">{{characters}}</span>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      'change input': function() {
        this.$el.find('.char-count').show();
      }
    },

    bindEvents: function () {
      var mirroredField = this.getMirroredFieldName();

      if (this.canUpdateSlug()) {
        $('.fields #' + mirroredField).on('keyup', _.bind(this.onKeyUp, this));
      }
    },

    unbindEvents: function () {
      var mirroredField = this.getMirroredFieldName();

      if (this.canUpdateSlug()) {
        $('.fields #' + mirroredField).off('keyup', _.bind(this.onKeyUp, this));
      }
    },

    onKeyUp: function (event) {
      var slug = $(event.currentTarget).val();

      this.updateSlug(slug);
    },

    getSlugInput: function () {
      if (!this.$slugField) {
        this.$slugField = this.$el.find('input');
      }

      return this.$slugField;
    },

    getMirroredFieldName: function () {
      var settings = this.options.settings;

      return settings.get('mirrored_field');
    },

    canUpdateSlug: function () {
      var settings = this.options.settings;
      var mirroredField = this.getMirroredFieldName();

      if (!mirroredField) {
        return false;
      }

      return !(settings.get('only_on_creation') === true && !this.model.isNew());
    },

    updateSlug: function (slug) {
      var $slugInput = this.getSlugInput();

      slug = slug.replace(/^\s+|\s+$/g, ''); // trim
      slug = slug.toLowerCase();

      // TODO: Create a helper to remove tilde, accents, etc.
      // Remove accents, swap ñ for n, etc
      var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
      var to   = "aaaaaeeeeeiiiiooooouuuunc------";
      for (var i=0, l=from.length ; i<l ; i++) {
        slug = slug.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
      }

      slug = slug.replace(/[^a-z0-9 \-]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes

      $slugInput.val(slug);
    },

    afterRender: function () {
      var $slugInput = this.$('input');
      var value = this.options.value;
      var mirroredField = this.getMirroredFieldName();
      var model = this.options.model;

      if (this.options.settings.get('readonly') === true) {
        $slugInput.prop('readonly', true);
      }

      if (this.canUpdateSlug()) {
        this.updateSlug(value || model.get(mirroredField) || '');
        this.bindEvents();
      }
    },

    cleanup: function () {
      this.unbindEvents();
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';

      return {
        size: this.options.settings.get('size'),
        value: value,
        name: this.options.name,
        maxLength: length,
        comment: this.options.schema.get('comment'),
        readonly: this.options.settings.get('readonly') === true
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'slug',
    dataTypes: ['VARCHAR'],
    variables: [
      // Disables editing of the field while still letting users see the value
      {id: 'readonly', type: 'Boolean', default_value: true, ui: 'checkbox'},
      // Adjusts the max width of the input (Small, Medium, Large)
      {id: 'size', type: 'String', default_value:'large', ui: 'select', options: {options: {'large':__t('size_large'),'medium':__t('size_medium'),'small':__t('size_small')} }},
      // Enter the column name of the field the slug will pull it's value from
      {id: 'mirrored_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      // Whether to update slug only on creation
      {id: 'only_on_creation', type: 'Boolean', default_value: false, ui: 'checkbox', comment: __t('slug_only_on_creation_comment')}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return 'This field is required';
      }
    },
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return Component;
});
