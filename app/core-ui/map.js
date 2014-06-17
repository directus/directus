//  Maps core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Attribute          Type              Contains                                Example
// -------------------------------------------------------------------------------------------------------------------------------------
// options.schema     Backbone.Model    Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
// options.model      Backbone.Model    Data/Model for this table row           options.model.get('id') [any column in current table row]
// options.value      String            Value for this field
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('length') [any key from this UI options]
// options.name       String            Field name


define(['app', 'backbone', 'moment'], function(app, Backbone, moment) {

  "use strict";

  var Module = {};

  Module.id = 'map';
  Module.dataTypes = ['VARCHAR'];

  Module.variables = [
    {id: 'apiKey', ui: 'textinput', char_length:200},
    {id: 'street_number_field', ui: 'textinput', char_length:200},
    {id: 'street_field', ui: 'textinput', char_length:200},
    {id: 'city_field', ui: 'textinput', char_length:200},
    {id: 'postal_code_field', ui: 'textinput', char_length:200},
    {id: 'state_field', ui: 'textinput', char_length:200},
    {id: 'stateCode_field', ui: 'textinput', char_length:200},
    {id: 'country_field', ui: 'textinput', char_length:200},
    {id: 'countryCode_field', ui: 'textinput', char_length:200},
    {id: 'mapHeight', ui: 'numeric', char_length: 4, def: '400', comment: 'Height in Pixels'}
  ];

  var template =  '<div style="height: 400px" id="map-canvas"/> \
  <input type="text" value="{{value}}" name="{{name}}" id="{{name}}" class="medium" readonly/>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',
    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
    },

    initializeMap: function() {
      var that = this;
      var google = window.google;
      var center = new google.maps.LatLng(40.77, -73.98);

      if(this.options.value) {
        var array = this.options.value.split(',');
        if(array) {
          var lng = array.pop();
          var lat = array.pop();
          if(!isNaN(lat) && !isNaN(lng)) {
            center = new google.maps.LatLng(lat, lng);
          }
        }
      }

      var mapOptions = {
        center: center,
        zoom: 12
      };
      var map = new google.maps.Map(this.$el.find("#map-canvas").get(0), mapOptions);

      if (navigator.geolocation && !this.options.value) {
        navigator.geolocation.getCurrentPosition(function (position) {
          var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          map.setCenter(initialLocation);
        });
      }

      if(this.options.value) {
        var array = this.options.value.split(',');
        if(array) {
          var lng = array.pop();
          var lat = array.pop();
          this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map:map
          });
        }
      }

      google.maps.event.addListener(map, 'click', function(e) {
        if(that.marker) {
          that.marker.setPosition(e.latLng);
        } else {
          that.marker = new google.maps.Marker({
            position: e.latLng,
            map:map
          });
        }
        var latlngVal = e.latLng.lat() + "," + e.latLng.lng();
        that.$el.find('input').val(latlngVal);

        $.get('https://maps.googleapis.com/maps/api/geocode/json', {latlng: latlngVal, key: that.options.settings.get('apiKey'), result_type:"street_address"}, function(data) {
          if(data.results && data.results.length > 0) {
            data = data.results[0].address_components;
            var address = {};
            data.forEach(function(part) {
              switch(part.types[0]) {
                case 'street_number':
                  address.street_number = part.long_name;
                  break;
                case 'route':
                  address.street = part.long_name;
                  break;
                case 'locality':
                  address.city = part.long_name;
                  break;
                case 'postal_code':
                  address.postal_code = part.long_name;
                  break;
                case 'administrative_area_level_1':
                  address.state = part.long_name;
                  address.stateCode = part.short_name;
                  break;
                case 'country':
                  address.country = part.long_name;
                  address.countryCode = part.short_name;
                  break;
              }
            });
            for(var key in address) {
              var field = that.options.settings.has(key + '_field') ? that.options.settings.get(key + '_field') : false;
              if(field) {
                var $fieldInput = that.$el.closest('form').find('input[name='+field+']');
                if($fieldInput.length) {
                  $fieldInput.val(address[key]);
                }
              }
            }
          }
        });
      });
    },

    serialize: function() {
      if(this.options.schema.get('type') == "ALIAS") {
        return false;
      }

      var value = this.options.value || '';

      return {
        value: value,
        name: this.options.name
      };
    },

    afterRender: function() {
      this.$el.find('#map-canvas').css('height', this.options.settings.get('mapHeight'));
    },

    initialize: function() {
      var that = this;
      require(['https://www.google.com/jsapi'], function() {
        google.load('maps', '3', { other_params: 'sensor=false&key=' + that.options.settings.get('apiKey'), callback: function() {that.initializeMap()}});
      });
    }

  });

  Module.validate = function(value) {
    //
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});