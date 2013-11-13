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
                      <td><input class="position serialize-exclude" type="text" maxlength="4" placeholder="A1" name="room_map[0][0]" data-x="0" data-y="0"></td> \
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

    // Just can't count on afterRender.
    reestablishRoomFields: function() {
      this.$roomWidth = $('#room_width');
      this.$roomDepth = $('#room_depth');
      this.$roomMap = this.$('.room_map');
      this.$roomBody = this.$roomMap.find('tbody');
      this.$roomRows = this.$roomBody.children('tr');
      this.$cellTpl = $('<td><input class="position serialize-exclude" type="text" maxlength="4" placeholder=""></td>');
      this.$roomDimensions = $([this.$roomWidth, this.$roomDepth]);
    },

    // Warning: at depth 51, 'ZZZ' is returned instead of 'ZZ',
    // however this depth is out of scope of our use case.
    integerToAlphaSequence: function(depth) {
      var charQty = 1;
      if(depth >= 25) {
        charQty = Math.ceil(depth / 25);
        depth = (depth % 26);
      }
      charQty++;
      var chr = String.fromCharCode(65 + depth),
        seq = new Array(charQty).join(chr);
      return seq;
    },

    updateUiFieldValue: function() {
      var value = this.serializeGrid();
      this.options.value = value;
      this.$el.find('input[name="Room Map"]').val(value);
    },

    updateRoomSize: function(e) {
      this.reestablishRoomFields();
      var r = undefined == e ? null : confirm("Are you sure?")
      if(false == r) {
        if('change' === e.type) {
          var $input = $(e.target),
            lastValue = this.lastValues[$input.attr('name')];
          $input.val(lastValue);
          return;
        }
      } else {

        // Maintain a copy of the latest values so we can revert them if the update prompt is declined.
        if(e && 'change' === e.type) {
          var $input = $(e.target);
          this.lastValues[$input.attr('name')] = $input.val();
        }

        var targetWidth = parseInt(this.$roomWidth.val()),
          targetDepth = parseInt(this.$roomDepth.val()),
          currentWidth = this.$roomRows.first().children('td').length,
          currentDepth = this.$roomRows.length;

        /** Update Width */
        var diff = currentWidth - targetWidth;

        // Remove the trailing width per row
        if(diff > 0) {
          this.$roomRows.each(function(index, row) {
            var $rowCells = $(row).children();
            var $latterRowCells = $rowCells.slice(-diff);
            $latterRowCells.remove();
          });
        }

        // Add trailing width per row
        else if(diff < 0) {
          this.$roomRows.each(_.bind(function(index, row) {
            var $row = $(row);
            for(var i = diff + 1; i < 1; i++) {
              var $cell = this.$cellTpl.clone(),
               position = targetWidth + i,
               alpha = this.integerToAlphaSequence(index),
               coord = alpha + position,
               $input = $cell.find('input'),
               name = 'room_map['+index+']['+(position-1)+']';
              $input.attr('placeholder', coord);
              $input.attr('name', name);
              $input.attr('data-x', index);
              $input.attr('data-y', position-1);
              $cell.appendTo($row);
            }
          }, this));
        }

        /** Update Depth */
        var diff = currentDepth - targetDepth;

        // Remove the trailing rows
        if(diff > 0) {
          this.$roomRows.slice(-diff).remove();
        }

        // Add trailing rows
        else if(diff < 0) {
          var $lastRow = this.$roomRows.last();
          for(var i = diff; i < 0; i++) {
            $row = $lastRow.clone();
            $row.find('input').val('').removeClass("fan instructor seat warning");
            $row.children().each(_.bind(function(index, cell) {
              var $cell = $(cell),
               position = targetDepth + i,
               alpha = this.integerToAlphaSequence(position),
               coord = alpha + (index + 1),
               $input = $cell.find('input'),
               name = 'room_map['+position+']['+index+']';
              $input.attr('placeholder', coord);
              $input.attr('name', name);
              $input.attr('data-x', position);
              $input.attr('data-y', index);
            }, this));
            $row.appendTo(this.$roomBody);
          }
        }
      }
      this.updateUiFieldValue();
    },

    clearAllValues: function(e) {
      var r=confirm("Are you sure?")
      if (r==true){
        this.$roomMap.find('input').val('').removeClass("fan instructor seat warning");
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

    loadSeatData: function() {
      this.seats.each(_.bind(function(seat, index){
        if(seat.get('room_id') == this.model.id) {
          var x = seat.get('x'),
            y = seat.get('y'),
            value = seat.get('value');
          var $cell = this.$roomBody.find('input[name="room_map['+x+']['+y+']"]');
          $cell.val(value).trigger('keyup');
        }
      }, this));
    },

    afterRender: function() {
      this.reestablishRoomFields();

      //if (this.options.settings.get("readonly") === "on") this.$("input").prop("readonly",true);
      // Maintain a copy of the latest values so we can revert them if the update prompt is declined.
      var View = this;
      this.lastValues = {};
      this.$roomDimensions.each(function(){
        View.lastValues[$(this).attr('name')] = $(this).val();
      });

      this.updateRoomSize = _.bind(this.updateRoomSize, this);
      $('#room_width, #room_depth').change(this.updateRoomSize);
      this.updateRoomSize();

      this.seats = app.getEntries('seats');
      if(0 == this.seats.length) {
        this.seats.once('sync', _.bind(function() {
          this.loadSeatData();
        }, this));
        this.seats.fetch();
      } else {
        this.loadSeatData();
      }

      // Hack, since this isn't actually a relational field:
      // Fetch seats rows &
      // Update the seats UI in this room edit view once our room syncs
      this.model.once('all', _.bind(function(e){
        this.seats.once('sync', _.bind(function() {
          this.loadSeatData();
        }, this));
        this.seats.fetch();
      }, this));
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