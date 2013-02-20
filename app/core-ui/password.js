//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'password';
  Module.dataTypes = ['VARCHAR'];

  Module.variables = [];

  var template = '<label>Change Password</label>'+
                 '<input type="password" name="{{name}}" class="large"/>'+
                 '<label style="margin-top:12px">Confirm Password</label>'+
                 '<input type="password" value="{{value}}" class="large"/>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    serialize: function() {
      return { name: this.options.name };
    }

  });

  Module.validate = function(value) {
    return true;
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});