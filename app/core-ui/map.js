//  Maps Core UI component
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
/*jshint multistr: true */


define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

  var template =  '<style>#pac-input { \
        background-color: #fff; \
        padding: 0 11px 0 13px; \
        width: 400px; \
        font-family: Roboto; \
        font-size: 15px; \
        font-weight: 300; \
        text-overflow: ellipsis; \
      } .controls { \
        margin-top: 16px; \
        border: 1px solid transparent; \
        border-radius: 2px 0 0 2px; \
        box-sizing: border-box; \
        -moz-box-sizing: border-box; \
        height: 32px; \
        outline: none; \
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); \
      } #pac-input:focus { \
        border-color: #4d90fe; \
        margin-left: -1px; \
        padding-left: 14px;  /* Regular padding-left + 1. */ \
        width: 401px; \
      } \
      </style> \
      <input id="pac-input" class="controls" type="text" placeholder="Search Box"><div style="height: 400px" id="map-canvas"/> \
  <input type="text" value="{{value}}" name="{{name}}" id="{{name}}" class="medium" readonly/>';

  //If ALIAS, only fills in fields set in options, if varchar, sets to {lat},{lng}
  var Input = UIView.extend({
    templateSource: template,
    events: {
    },

    //Called Once Map Script is loaded. Initializes the Map Element.
    initializeMap: function() {
      var that = this;
      var google = window.google;
      var center = new google.maps.LatLng(40.77, -73.98);

      //If we have a value (Representing lat and long), set center to that value
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

      var input = (document.getElementById('pac-input'));
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
      var searchBox = new google.maps.places.SearchBox((input));

      // Listen for the event fired when the user selects an item from the
      // pick list. Retrieve the matching places for that item.
      google.maps.event.addListener(searchBox, 'places_changed', function() {
        var places = searchBox.getPlaces();

        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < places.length; i++) {
          bounds.extend(places[i].geometry.location);
        }

        map.fitBounds(bounds);
      });

      // Bias the SearchBox results towards places that are within the bounds of the
      // current map's viewport.
      google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        searchBox.setBounds(bounds);
      });

      //Add A marker to value location if there is a value
      if(this.options.value) {
        var arr = this.options.value.split(',');
        if(arr) {
          var lng2 = arr.pop();
          var lat2 = arr.pop();
          this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat2, lng2),
            map:map
          });
        }
      }

      //On click, update value with click location
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

        var apiKey = that.getApiKey();
        //Query Geocode api to get street info about specified latlong
        $.get('https://maps.googleapis.com/maps/api/geocode/json', {latlng: latlngVal, key: apiKey, result_type:"street_address"}, function(data) {
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

            //Update the value for the specified fields on the editpage form
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

    getApiKey: function() {
      return this.options.settings.get('apiKey') || app.settings.get('global').get('google_api_key');
    },

    serialize: function() {
      var value = this.options.value || '';

      var data = {
        value: value,
        name: this.options.name
      };

      if(this.options.schema.get('type') == "ALIAS") {
        data.name = '';
      }

      return data;
    },

    afterRender: function() {
      this.$el.find('#map-canvas').css('height', this.options.settings.get('mapHeight'));
    },

    //Called when UI is first created
    initialize: function() {
      var that = this;
      //Include the Google JSAPI for using Maps
      require(['https://www.google.com/jsapi'], function() {
        //Load Maps API using provided key, and call initializeMap() when API is loaded
        google.load('maps', '3', { other_params: 'sensor=false&libraries=places&key=' + that.getApiKey(), callback: function() {that.initializeMap();}});
      });
    }
  });

  var Component = UIComponent.extend({
    id: 'map',
    dataTypes: ['VARCHAR', 'ALIAS'],
    variables: [
      //Google API Key (Provided by Google)
      {id: 'apiKey', ui: 'textinput', char_length:200},
      //column names to fill with respective item
      {id: 'street_number_field', ui: 'textinput', char_length:200},
      {id: 'street_field', ui: 'textinput', char_length:200},
      {id: 'city_field', ui: 'textinput', char_length:200},
      {id: 'postal_code_field', ui: 'textinput', char_length:200},
      {id: 'state_field', ui: 'textinput', char_length:200},
      {id: 'stateCode_field', ui: 'textinput', char_length:200},
      {id: 'country_field', ui: 'textinput', char_length:200},
      {id: 'countryCode_field', ui: 'textinput', char_length:200},
      //Height of Map Element in Pixels
      {id: 'mapHeight', ui: 'numeric', char_length: 4, def: '400', comment: 'Height in Pixels'},
      {id: 'showLatLng', ui: 'checkbox', comment: 'Display latlng Textbox below map'}
    ],
    settings: [{
      'collection': 'global',
      id: 'google_api_key',
      ui: 'textinput',
      char_length:200
    }],
    Input: Input,
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });

  return new Component();
});
