define(['underscore', 'core/UIView'], function (_, UIView) {

  'use strict';

  return UIView.extend({
    template: 'slug/input',

    events: {
      'input input': 'onInputChange'
    },

    onInputChange: function (event) {
      var target = event.currentTarget;

      this.$('.char-count').show();
      this.model.set(this.name, target.value);
    },

    bindEvents: function () {
      var mirroredField = this.getMirroredFieldName();

      if (this.canUpdateSlug()) {
        $('.fields #' + mirroredField).on('keyup', _.bind(this.onKeyUp, this));
      }
    },

    unbindEvents: function () {
      if (this.canUpdateSlug()) {
        $('.fields #' + this.getMirroredFieldName()).off('keyup', _.bind(this.onKeyUp, this));
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

      return !(settings.get('only_creation') === true && !this.model.isNew());
    },

    updateSlug: function (slug) {
      var $slugInput = this.getSlugInput();

      slug = slug.replace(/^\s+|\s+$/g, ''); // Trim
      slug = slug.toLowerCase();

      var from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
      var to = 'aaaaaeeeeeiiiiooooouuuunc------';
      for (var i = 0, l = from.length; i < l; i++) {
        slug = slug.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
      }

      slug = slug.replace(/[^a-z0-9 \-]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // Collapse whitespace and replace by -
        .replace(/-+/g, '-'); // Collapse dashes

      $slugInput.val(slug);
      this.model.set(this.name, slug);
    },

    afterRender: function () {
      var $slugInput = this.$('input');
      var value = this.options.value;
      var mirroredField = this.getMirroredFieldName();
      var model = this.options.model;

      if (this.options.settings.get('read_only') === true) {
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

    serialize: function () {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';

      return {
        size: this.options.settings.get('size'),
        value: value,
        name: this.options.name,
        maxLength: length,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      };
    }
  });
});
