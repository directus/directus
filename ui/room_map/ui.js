//  Room Map Extended UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'room_map';
  Module.dataTypes = ['ALIAS'];

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
                    <tbody> \
                    <tr> \
                      <td><input class="position serialize-exclude" type="text" maxlength="4" placeholder="A1" name="position[0][0]" data-x="0" data-y="0"></td> \
                    </tr> \
                    </tbody> \
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
      'keyup .room_map input': 'updatePosition',
      'blur .room_map input': 'validateRoom',
      'click .update-room-size': 'updateRoomSize',
      'click .clear-all-values': 'clearAllValues'
    },

    updatePosition: function(e) {
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
      this.updateUiFieldValue();
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

    // Warning: at depth 51, 'ZZZ' is returned instead of 'ZZ',
    // however this depth is out of scope of our use case.
    integerToAlphaSequence: function(depth) {
      // console.log('-----------------');
      // console.log('ITAS depth:', depth);
      var charQty = 1;
      if(depth >= 25) {
        charQty = Math.ceil(depth / 25);
        depth = (depth % 26);
        // console.log('new charQty (ceil:' + depth + ' / 25):', charQty);
        // console.log('new depth ('+depth+' % 26):', depth);
      }
      charQty++;
      var chr = String.fromCharCode(65 + depth),
        seq = new Array(charQty).join(chr);
      // console.log('charQty:',charQty);
      // console.log('chr:',chr);
      // console.log('seq:',seq);
      return seq;
    },

    updateUiFieldValue: function() {
      var value = this.serializeGrid();
      this.options.value = value;
      this.$el.find('input[name="Room Map"]').val(value);
    },

    updateRoomSize: function(e) {
      // console.log('updateRoomSize', e);
      var r = false == e ? null : confirm("Are you sure?\nThis will delete this rooms current setup")
      if(false == r) {
        if('change' === e.type) {
          var $input = $(e.target),
            lastValue = this.lastValues[$input.attr('name')];
          $input.val(lastValue);
          return;
        }
      } else if (false == e || r == true) {
        if('change' === e.type) {
          // Maintain a copy of the latest values so we can revert them if the update prompt is declined.
          var $input = $(e.target);
          this.lastValues[$input.attr('name')] = $input.val();
        }
        var targetWidth = parseInt($('#room_width').val()),
          targetDepth = parseInt($('#room_depth').val()),
          $roomMap = this.$('.room_map'),
          $roomBody = $roomMap.find('tbody'),
          $roomRows = $roomBody.children('tr'),
          currentWidth = $roomRows.first().children('td').length,
          currentDepth = $roomRows.length,
          $cellTpl = $('<td><input class="position serialize-exclude" type="text" maxlength="4" placeholder=""></td>');
        /** Update Width */
        var diff = currentWidth - targetWidth;
        if(diff > 0) {
          // Remove the trailing width per row
          $roomRows.each(function(index, row) {
            $(row).children().slice(-diff).remove();
          });
        } else if(diff < 0) {
          // Add trailing width per row
          var View = this;
          $roomRows.each(function(index, row) {
            var $row = $(row),
              $lastCell = $row.children().last();
            for(var i = diff + 1; i < 1; i++) {
              var $cell = $cellTpl.clone(),
               position = targetWidth + i,
               alpha = View.integerToAlphaSequence(index),
               coord = alpha + position,
               $input = $cell.find('input'),
               name = 'room_map['+index+']['+(position-1)+']';
              $input.attr('placeholder', coord);
              $input.attr('name', name);
              $input.attr('data-x', index);
              $input.attr('data-y', position-1);
              $cell.appendTo($row);
            }
          });
        }
        /** Update Depth */
        var diff = currentDepth - targetDepth;
        if(diff > 0) {
          // Remove the trailing rows
          $roomRows.slice(-diff).remove();
        } else if(diff < 0) {
          // Add trailing rows
          var $lastRow = $roomRows.last();
          var View = this;
          for(var i = diff; i < 0; i++) {
            $row = $lastRow.clone();
            $row.children().each(function(index, cell) {
              var $cell = $(cell),
               position = targetDepth + i,
               alpha = View.integerToAlphaSequence(position),
               coord = alpha + (index + 1),
               $input = $cell.find('input'),
               name = 'room_map['+position+']['+index+']';
              $input.attr('placeholder', coord);
              $input.attr('name', name);
              $input.attr('data-x', position);
              $input.attr('data-y', index);
            });
            $row.appendTo($roomBody);
          }
        }
      }
      this.updateUiFieldValue();
    },

    clearAllValues: function(e) {
      var r=confirm("Are you sure?")
      if (r==true){
        this.$el.find('.room_map input').val('').removeClass("fan instructor seat warning");
      }
    },

    serializeGrid: function() {
      var value = {},
        $positions = this.$('input.position');
      $positions.each(function(){
        var x = $(this).data('x'),
         y = $(this).data('y');
        if(!value.hasOwnProperty(x))
          value[x] = {};
        value[x][y] = $(this).val();
      });
      value = JSON.stringify(value);
      return value;
    },

    afterRender: function() {
      this.lastValues = {};
      var View = this;
      // Maintain a copy of the latest values so we can revert them if the update prompt is declined.
      $('#room_depth, #room_width').each(function(){
        View.lastValues[$(this).attr('name')] = $(this).val();
      });
      //if (this.options.settings.get("readonly") === "on") this.$("input").prop("readonly",true);
      this.updateRoomSize = _.bind(this.updateRoomSize, this);
      $('#room_depth, #room_width').change(this.updateRoomSize);
      this.updateRoomSize(false);
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';
      return {
        height: (this.options.settings && this.options.settings.has('height')) ? this.options.settings.get('height') : '100',
        value: value,
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