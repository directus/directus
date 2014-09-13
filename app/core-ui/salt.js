//  Password Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'salt';
  Module.dataTypes = ['VARCHAR'];
  Module.skipSerializationIfNull = true;

  Module.variables = [
  ];

  var template = '<input type="text" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" class="medium" readonly/> \
                 <span class="label char-count hide">{{characters}}</span>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {},

    initialize: function(options) {
      this.options = options;
      this.value = this.options.value;
      if(_.isEmpty(this.options.value)) {
        this.value = this.uniqid();
        this.model.set(options.name, this.value);
      }
    },

    serialize: function() {
      var data = {
        value: this.value,
        name: this.options.name,
        comment: this.options.schema.get('comment')
      };
      return data;
    },

    // credit: http://phpjs.org/functions/uniqid/
    uniqid: function (prefix, more_entropy) {
      // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +    revised by: Kankrelune (http://www.webfaktory.info/)
      // %        note 1: Uses an internal counter (in php_js global) to avoid collision
      // *     example 1: uniqid();
      // *     returns 1: 'a30285b160c14'
      // *     example 2: uniqid('foo');
      // *     returns 2: 'fooa30285b1cd361'
      // *     example 3: uniqid('bar', true);
      // *     returns 3: 'bara20285b23dfd1.31879087'
      if (typeof prefix === 'undefined') {
        prefix = "";
      }

      var retId;
      var formatSeed = function (seed, reqWidth) {
        seed = parseInt(seed, 10).toString(16); // to hex str
        if (reqWidth < seed.length) { // so long we split
          return seed.slice(seed.length - reqWidth);
        }
        if (reqWidth > seed.length) { // so short we pad
          return [1 + (reqWidth - seed.length)].join('0') + seed;
        }
        return seed;
      };

      // BEGIN REDUNDANT
      if (!this.php_js) {
        this.php_js = {};
      }
      // END REDUNDANT
      if (!this.php_js.uniqidSeed) { // init seed with big random int
        this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
      }
      this.php_js.uniqidSeed++;

      retId = prefix; // start with prefix, add current milliseconds hex string
      retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
      retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
      if (more_entropy) {
        // for more entropy we add a float lower to 10
        retId += (Math.random() * 10).toFixed(8).toString();
      }

      return retId;
    }

  });

  Module.validate = function(value,options) {
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});