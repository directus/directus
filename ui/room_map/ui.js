define(['app', 'backbone', 'core/table/table.view', 'schema/SchemaManager', 'core/UIView'], function(app, Backbone, TableView, SchemaManager, UIView) {

  "use strict";

  var Module = {};

  Module.id = 'room_map';
  Module.dataTypes = ['ONETOMANY'];

  Module.variables = [];

  var template = '<label>{{{capitalize title}}}</label>\
                  <style type="text/css"> \
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
                    {{#each room}} \
                    <tr> \
                      {{#each this}} \
                      <td><input class="position serialize-exclude {{#unless isLegal}}warning{{/unless}}" type="text" maxlength="4" name="room_map[0][0]" data-x="{{x}}" data-y="{{y}}" data-id="{{id}}" data-cid="{{cid}}" value="{{value}}" placeholder="X{{x}} Y{{y}}"></td> \
                      {{/each}} \
                    </tr> \
                    {{/each}} \
                    </tbody> \
                  </table> \
                  <div class="btn-row"> \
                    <button class="btn btn-small btn-primary update-room-size" type="button">Update room size</button> \
                  </div>';


  Module.Input = UIView.extend({

    tagName: 'fieldset',
  
    template: Handlebars.compile(template),
  
    events: {
      'click .update-room-size': 'updateRoomSize',
      'blur .position': 'updateSeatValue'
    },

    updateRoomSize: function() {
      this.roomWidth = parseInt($('[name="' + this.widthAttr + '"]').val(),10);
      this.roomDepth = parseInt($('[name="' + this.depthAttr + '"]').val(),10);
      this.render();
    },

    updateSeatValue: function(e) {
      var $el = $(e.target),
          id = $el.data('id'),
          cid = $el.data('cid'),
          x = $el.data('x'),
          y = $el.data('y'),
          value = $el.val();

      var seatHasId = (cid !== ''),
          model;

      var Model = this.relatedCollection.model;

      if (value === '') {
        value = null;
      }

      var values = {
        'value': value
      };

      // Update existing model
      if (seatHasId) {
        model = this.relatedCollection.get(cid);
        model.set(values);
        
      // Add a new model
      } else {
        
        // Don't add empty values
        if (value === null) {
          return;
        }

        values.x = x;
        values.y = y;
        values.active = 1;
        values[this.joinColumn] = this.model.id;      

        //@todo Make this easier
        model = new Model(values, {
          collection: this.relatedCollection, 
          parse: true, 
          structure: this.relatedCollection.structure, 
          table: this.relatedCollection.table, 
          privileges: this.relatedCollection.privileges
        });

        this.relatedCollection.add(model);
      }

    },

    valueIsLegal: function(value) {

      // Numbers are legal      
      if (!isNaN(value)) {
        return true;
      }

      var allowedNonNumericValues = ['fan', 'inst', 'FAN', 'INST'];
      
      return _.contains(allowedNonNumericValues, value)
    },

    getMaxAttr: function(attr) {
      if (this.relatedCollection.length === 0) {
        return -1;
      }

      var max = this.relatedCollection.max(function(model) { 
        console.log(model);
        return model.get(attr);
      });

      return max.get(attr);
    },

    dimensionRoomMap: function() {
      var room = [];

      for (var x = 0; x < this.roomDepth; x++) {
        var col = [];
        for (var y = 0; y < this.roomWidth; y++) {
          col.push({x: x, y: y, id: null, value: null, isLegal: true});
        }
        room.push(col);
      }

      return room;
    },

    serialize: function() {
      var self = this;
      var room = this.dimensionRoomMap();

      this.relatedCollection.forEach(function(model) {
        var x = model.get('x');
        var y = model.get('y');

        if (x > -1 && 
            y > -1 && 
            x < self.roomDepth && 
            y < self.roomWidth) {
              room[x][y] = model.toJSON();
              room[x][y].isLegal = self.valueIsLegal(room[x][y].value);
              room[x][y].cid = model.cid;
        }
      });

      return {
        title: this.name,
        room: room
      };

    },

    initialize: function (options) {

      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
           'ONETOMANY' !== this.columnSchema.relationship.get('type')) {
        throw "The column " + this.columnSchema.id + " need to have a relationship of the type ONETOMANY inorder to use the room map ui";
      }

      this.joinColumn = this.columnSchema.relationship.get('junction_key_right');
      this.relatedCollection = this.model.get(this.name);

      this.widthAttr = 'room_width';
      this.depthAttr = 'room_depth';

      this.roomWidth = this.model.get(this.widthAttr);
      this.roomDepth = this.model.get(this.depthAttr);

      this.listenTo(this.relatedCollection, 'change add', this.render, this);
    }

  });

  Module.list = function() {
    return '-';
  };

  return Module;
});