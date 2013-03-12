//  Room Map Extended UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'room_map';
  Module.dataTypes = ['TEXT'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'}
  ];

  var template =  '<label>{{capitalize name}} <span class="note">{{note}}</span></label>'+
                  '<style type="text/css"> \
                  table.room_map { \
                    width:84%; \
                    text-align:center; \
                    border: 1px solid #cccccc; \
                    border-spacing:0; \
                    border-collapse:collapse; \
                    margin-bottom: 13px; \
                  } \
                  .room_map tr, \
                  .room_map td { \
                    height: 40px; \
                    padding: 0; \
                    border-style: inset; \
                    border: 1px solid #cccccc; \
                  } \
                  .room_map td input { \
                    height: 100%; \
                    width: 100% !important; \
                    text-align: center; \
                    padding: 0; \
                    border: none !important; \
                    -webkit-border-radius: 0 !important; \
                    -moz-border-radius: 0 !important; \
                    border-radius: 0 !important; \
                    text-shadow: none; \
                  } \
                  .room_map td input:focus, \
                  .room_map td input:hover { \
                    -webkit-box-shadow: none; \
                    box-shadow: none; \
                    border: none; \
                  } \
                  input.fan { \
                    background-color: #CCCCCC; \
                    color: #ffffff; \
                    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2) !important; \
                  } \
                  input.instructor { \
                    background-color: #FDC030; \
                    color: #ffffff; \
                    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2) !important; \
                  } \
                  input.seat { \
                    background-color: #8BC53F; \
                    color: #ffffff; \
                    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2) !important; \
                  } \
                  input.warning { \
                    background-color: #EB2A49 !important; \
                    color: #ffffff !important; \
                    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2) !important; \
                  } \
                  </style> \
                  <table class="room_map"> \
                    <tr> \
                      <td><input type="text" maxlength="4" placeholder="A1"></td> \
                      <td><input type="text" maxlength="4" placeholder="A2"></td> \
                      <td><input type="text" maxlength="4" placeholder="A3"></td> \
                      <td><input type="text" maxlength="4" placeholder="A4"></td> \
                      <td><input type="text" maxlength="4" placeholder="A5"></td> \
                      <td><input type="text" maxlength="4" placeholder="A6"></td> \
                      <td><input type="text" maxlength="4" placeholder="A7"></td> \
                      <td><input type="text" maxlength="4" placeholder="A8"></td> \
                      <td><input type="text" maxlength="4" placeholder="A9"></td> \
                      <td><input type="text" maxlength="4" placeholder="A10"></td> \
                    </tr> \
                    <tr> \
                      <td><input type="text" maxlength="4" placeholder="B1"></td> \
                      <td><input type="text" maxlength="4" placeholder="B2"></td> \
                      <td><input type="text" maxlength="4" placeholder="B3"></td> \
                      <td><input type="text" maxlength="4" placeholder="B4"></td> \
                      <td><input type="text" maxlength="4" placeholder="B5"></td> \
                      <td><input type="text" maxlength="4" placeholder="B6"></td> \
                      <td><input type="text" maxlength="4" placeholder="B7"></td> \
                      <td><input type="text" maxlength="4" placeholder="B8"></td> \
                      <td><input type="text" maxlength="4" placeholder="B9"></td> \
                      <td><input type="text" maxlength="4" placeholder="B10"></td> \
                    </tr> \
                    <tr> \
                      <td><input type="text" maxlength="4" placeholder="C1"></td> \
                      <td><input type="text" maxlength="4" placeholder="C2"></td> \
                      <td><input type="text" maxlength="4" placeholder="C3"></td> \
                      <td><input type="text" maxlength="4" placeholder="C4"></td> \
                      <td><input type="text" maxlength="4" placeholder="C5"></td> \
                      <td><input type="text" maxlength="4" placeholder="C6"></td> \
                      <td><input type="text" maxlength="4" placeholder="C7"></td> \
                      <td><input type="text" maxlength="4" placeholder="C8"></td> \
                      <td><input type="text" maxlength="4" placeholder="C9"></td> \
                      <td><input type="text" maxlength="4" placeholder="C10"></td> \
                    </tr> \
                    <tr> \
                      <td><input type="text" maxlength="4" placeholder="D1"></td> \
                      <td><input type="text" maxlength="4" placeholder="D2"></td> \
                      <td><input type="text" maxlength="4" placeholder="D3"></td> \
                      <td><input type="text" maxlength="4" placeholder="D4"></td> \
                      <td><input type="text" maxlength="4" placeholder="D5"></td> \
                      <td><input type="text" maxlength="4" placeholder="D6"></td> \
                      <td><input type="text" maxlength="4" placeholder="D7"></td> \
                      <td><input type="text" maxlength="4" placeholder="D8"></td> \
                      <td><input type="text" maxlength="4" placeholder="D9"></td> \
                      <td><input type="text" maxlength="4" placeholder="D10"></td> \
                    </tr> \
                    <tr> \
                      <td><input type="text" maxlength="4" placeholder="E1"></td> \
                      <td><input type="text" maxlength="4" placeholder="E2"></td> \
                      <td><input type="text" maxlength="4" placeholder="E3"></td> \
                      <td><input type="text" maxlength="4" placeholder="E4"></td> \
                      <td><input type="text" maxlength="4" placeholder="E5"></td> \
                      <td><input type="text" maxlength="4" placeholder="E6"></td> \
                      <td><input type="text" maxlength="4" placeholder="E7"></td> \
                      <td><input type="text" maxlength="4" placeholder="E8"></td> \
                      <td><input type="text" maxlength="4" placeholder="E9"></td> \
                      <td><input type="text" maxlength="4" placeholder="E10"></td> \
                    </tr> \
                    <tr> \
                      <td><input type="text" maxlength="4" placeholder="F1"></td> \
                      <td><input type="text" maxlength="4" placeholder="F2"></td> \
                      <td><input type="text" maxlength="4" placeholder="F3"></td> \
                      <td><input type="text" maxlength="4" placeholder="F4"></td> \
                      <td><input type="text" maxlength="4" placeholder="F5"></td> \
                      <td><input type="text" maxlength="4" placeholder="F6"></td> \
                      <td><input type="text" maxlength="4" placeholder="F7"></td> \
                      <td><input type="text" maxlength="4" placeholder="F8"></td> \
                      <td><input type="text" maxlength="4" placeholder="F9"></td> \
                      <td><input type="text" maxlength="4" placeholder="F10"></td> \
                    </tr> \
                    <tr> \
                      <td><input type="text" maxlength="4" placeholder="G1"></td> \
                      <td><input type="text" maxlength="4" placeholder="G2"></td> \
                      <td><input type="text" maxlength="4" placeholder="G3"></td> \
                      <td><input type="text" maxlength="4" placeholder="G4"></td> \
                      <td><input type="text" maxlength="4" placeholder="G5"></td> \
                      <td><input type="text" maxlength="4" placeholder="G6"></td> \
                      <td><input type="text" maxlength="4" placeholder="G7"></td> \
                      <td><input type="text" maxlength="4" placeholder="G8"></td> \
                      <td><input type="text" maxlength="4" placeholder="G9"></td> \
                      <td><input type="text" maxlength="4" placeholder="G10"></td> \
                    </tr> \
                  </table> \
                  <div class="btn-row"> \
                    <button class="btn btn-small btn-primary update-room-size" data-action="add" type="button">Update room size</button> \
                    <button class="btn btn-small btn-primary clear-all-values" data-action="add" type="button">Clear all values</button> \
                  </div> \
                  <input type="hidden" name="{{name}}" value="{{value}}">';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'keyup .room_map input': 'updateRoom',
      'blur .room_map input': 'validateRoom',
      'click .update-room-size': 'updateRoomSize',
      'click .clear-all-values': 'clearAllValues'
    },

    updateRoom: function(e) {
      var value = e.target.value;
      var type = false;
      var intRegex = /^\d+$/;

      $(e.target).removeClass("fan instructor seat");

      if(value.toLowerCase() == 'fan'){
        type = 'fan';
      } else if(value.toLowerCase() == 'inst') {
        type = 'instructor';
      } else if(intRegex.test(value)){
        type = 'seat';
      }

      if(type){
        $(e.target).addClass(type);
      }
    },

    validateRoom: function(e) {
      var value = e.target.value;
      var intRegex = /^\d+$/;
      var warning = false;
      var counts = {};
      var roomArray = this.$el.find('.room_map input').map(function(){
        return $(this).val();
      }).get();

      $(e.target).removeClass('warning');

      for(var i = 0; i< roomArray.length; i++) {
          var type = roomArray[i];
          counts[type] = counts[type] ? counts[type]+1 : 1;
          if(type != 'fan' && type != '' && counts[type] > 1){
            if(value == type){
              if(type == 'inst'){
                alert("You seem to have more than one instructor!\nPlease resolve this before proceeding.");
              } else {
                alert("You seem to have duplicates of bike position "+type+"!\nPlease resolve this before proceeding.");
              }
              $(e.target).addClass('warning');
            }
          }
      }
    },

    updateRoomSize: function(e) {
      var r=confirm("Are you sure?\nThis will delete this rooms current setup")
      if (r==true){
        var roomWidth = this.$('#room_width').val();
        $(".room_map tr").append('<td><input type="text" maxlength="4" placeholder="E1"></td>');
      }
    },

    clearAllValues: function(e) {
      var r=confirm("Are you sure?")
      if (r==true){
        this.$el.find('.room_map input').val('').removeClass("fan instructor seat warning");
      }
    },

    afterRender: function() {
      //if (this.options.settings.get("readonly") === "on") this.$("input").prop("readonly",true);
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';
      console.log('NEW',value);
      return {
        height: (this.options.settings && this.options.settings.has('height')) ? this.options.settings.get('height') : '100',
        value: new Handlebars.SafeString(value),
        name: this.options.name,
        maxLength: length,
        characters: length - value.length,
        note: this.options.schema.get('comment')
      };
    },

    initialize: function() {
      //
    }

  });

  Module.validate = function(value) {

  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});