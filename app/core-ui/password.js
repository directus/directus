//  Password Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'password';
  Module.dataTypes = ['VARCHAR'];

  Module.variables = [
    {id: 'require_confirmation', ui: 'checkbox', def: '1'}
  ];

  var template = '<label>Change Password <span class="note">{{comment}}</span></label> \
                 <input type="password" name="{{name}}" class="medium"/> \
                 {{#if require_confirmation}} \
                 <label style="margin-top:12px">Confirm Password</label> \
                 <input type="password" value="{{value}}" class="medium password-confirm"/> \
                 {{/if}}';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    serialize: function() {
      return {
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        require_confirmation: (this.options.settings && this.options.settings.has('require_confirmation') && this.options.settings.get('require_confirmation') == '0') ? false : true
      };
    }

  });

  Module.validate = function(value) {
    // We need a way to validate the value against the CONFIRM value... but we don't have access to that CONFIRM value here
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});