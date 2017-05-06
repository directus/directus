define(['app', 'core/UIComponent', 'core/UIView'], function (app, UIComponent, UIView) {
  'use strict';

  return UIView.extend({
    template: 'salt/input',

    initialize: function (options) {
      this.options = options;
      this.value = this.options.value;

      if (_.isEmpty(this.options.value)) {
        this.value = this.uniqid();
        this.model.set(options.name, this.value);
      }
    },

    serialize: function () {
      return {
        value: this.value,
        name: this.options.name,
        comment: this.options.schema.get('comment')
      };
    },

    /**
     * Generates an unique ID
     * Uses an internal counter (in php_js global) to avoid collision
     * uniqid(); // 'a30285b160c14'
     * uniqid('foo'); // 'fooa30285b1cd361'
     * uniqid('bar', true); // 'bara20285b23dfd1.31879087'
     */
    uniqid: function (prefix, moreEntropy) {
      if (typeof prefix === 'undefined') {
        prefix = '';
      }

      var retId;
      var formatSeed = function (seed, reqWidth) {
        seed = parseInt(seed, 10).toString(16); // To hex str
        if (reqWidth < seed.length) { // Too long; we split
          return seed.slice(seed.length - reqWidth);
        }

        if (reqWidth > seed.length) { // Too short; we pad
          return [1 + (reqWidth - seed.length)].join('0') + seed;
        }

        return seed;
      };

      // BEGIN REDUNDANT
      if (!this.phpJS) {
        this.phpJS = {};
      }

      // END REDUNDANT
      if (!this.phpJS.uniqidSeed) { // Init seed with big random int
        this.phpJS.uniqidSeed = Math.floor(Math.random() * 0x75BCD15);
      }

      this.phpJS.uniqidSeed++;

      retId = prefix; // Start with prefix, add current milliseconds hex string
      retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
      retId += formatSeed(this.phpJS.uniqidSeed, 5); // Add seed hex string
      if (moreEntropy) {
        // For more entropy we add a float lower to 10
        retId += (Math.random() * 10).toFixed(8).toString();
      }

      return retId;
    }
  });
});
