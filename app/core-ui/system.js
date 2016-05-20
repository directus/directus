//  System core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app','backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};


  //Temporarily disable styling since breaks this ui when in overlay
  /*var template = '<div class="custom-check"> \
    <input value="1" id="check1" name="status" type="radio" {{#if active}}checked{{/if}}> \
    <label for="check1"><span></span>Active</label> \
    <input value="2" id="check2" name="status" type="radio" {{#if inactive}}checked{{/if}}> \
    <label for="check2"><span></span>Inactive</label> \
    <input value="0" id="check3" name="status" type="radio" {{#if deleted}}checked{{/if}}> \
    <label for="check3"><span></span>Deleted</label> \
  <input type="hidden" name="{{name}}" value="{{#if value}}{{value}}{{/if}}">';*/

  var template = '<div class="status-group" style="padding: 12px 0;"> \
                  {{#mapping}} \
                    <label style="font-size:14px;margin-right:40px;display:inline-block;color:{{color}}" class="bold"><input style="display:inline-block;width:auto;margin-right:10px;" type="radio" {{#if ../readonly}}disabled{{/if}} name="{{../name}}" value="{{id}}" {{#if active}}checked{{/if}}>{{name}}</label> \
                  {{/mapping}} \
                  </div>';

  Module.id = 'system';
  Module.dataTypes = ['TINYINT'];

  Module.variables = [];

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',
    attributes: {
      'class': 'field'
    },
    template: Handlebars.compile(template),

    events: {
      'change input[type=radio]': function(e) {
        this.$el.find('input[type=hidden]').val($(e.target).val());
      }
    },

    serialize: function() {
      var data = {};

      var mapping = app.statusMapping.mapping;
      var value = this.options.value;

      data.mapping = [];

      for(var key in mapping) {
        //If new model, skip delete option
        if(this.model.isNew() && key == app.statusMapping.deleted_num) {
          continue;
        }

        var entry = mapping[key];
        entry.id = key;
        if(key == value) {
          entry.active = true;
        } else {
          entry.active = false;
        }
        data.mapping.push(entry);
      }

      data.mapping.sort(function(a, b) {
        if(a.sort < b.sort) {
          return -1;
        }
        if(a.sort > b.sort) {
          return 1;
        }
        return 0;
      });

      data.name = this.options.name;

      data.readonly = !this.options.canWrite;
      return data;
    }

  });

  Module.list = function(options) {
    var val = (options.value) ? '<input type="checkbox" checked="true" disabled>' : '<input type="checkbox" disabled>';
    //var val = options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100);
    return val;//val;
  };


  return Module;
});