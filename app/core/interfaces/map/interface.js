/* global $ google */
define([
  './interface',
  'app',
  'core/UIView',
  'core/t'
], function (Input, app, UIView) {
  'use strict';

  return UIView.extend({
    template: 'map/input',

    // Called Once Map Script is loaded. Initializes the Map Element.
    initializeMap: function () {
      var that = this;
      var google = window.google;
      var center = new google.maps.LatLng(40.77, -73.98);

      // If we have a value (Representing lat and long), set center to that value
      if (this.options.value) {
        var array = this.options.value.split(',');

        if (array) {
          var lng = array.pop();
          var lat = array.pop();
          if (!isNaN(lat) && !isNaN(lng)) {
            center = new google.maps.LatLng(lat, lng);
          }
        }
      }

      var mapOptions = {
        center: center,
        zoom: 12,
        disableDefaultUI: this.options.settings.get('read_only') || !this.options.canWrite,
        // Using **cooperative gesture handling** lets the user control the panning and scrolling behavior
        // of a map when viewed on a mobile device.
        gestureHandling: 'cooperative',
      };

      var map = new google.maps.Map(this.$el.find('#map-canvas').get(0), mapOptions);

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
      google.maps.event.addListener(searchBox, 'places_changed', function () {
        var places = searchBox.getPlaces();

        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < places.length; i++) {
          bounds.extend(places[i].geometry.location);
        }

        map.fitBounds(bounds);
      });

      // Bias the SearchBox results towards places that are within the bounds of the
      // current map's viewport.
      google.maps.event.addListener(map, 'bounds_changed', function () {
        var bounds = map.getBounds();
        searchBox.setBounds(bounds);
      });

      // Add A marker to value location if there is a value
      if (this.options.value) {
        var arr = this.options.value.split(',');
        if (arr) {
          var lng2 = arr.pop();
          var lat2 = arr.pop();
          this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat2, lng2),
            map: map
          });
        }
      }

      // On click, update value with click location
      google.maps.event.addListener(map, 'click', function (event) {
        if (that.marker) {
          that.marker.setPosition(event.latLng);
        } else {
          that.marker = new google.maps.Marker({
            position: event.latLng,
            map: map
          });
        }

        var latlngVal = event.latLng.lat() + ',' + event.latLng.lng();
        that.$el.find('input').val(latlngVal);
        that.model.set(that.name, latlngVal);

        var apiKey = that.getApiKey();
        // Query Geocode api to get street info about specified latlong
        $.get('https://maps.googleapis.com/maps/api/geocode/json', {latlng: latlngVal, key: apiKey, result_type: 'street_address'}, function (data) {
          if (data.results && data.results.length > 0) {
            data = data.results[0].address_components;
            var address = {};
            data.forEach(function (part) {
              switch (part.types[0]) {
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
                  address.state_code = part.short_name;
                  break;
                case 'country':
                  address.country = part.long_name;
                  address.country_code = part.short_name;
                  break;
                default:
                  break;
              }
            });

            // Update the value for the specified fields on the editpage form
            for (var key in address) {
              if (Object.prototype.hasOwnProperty.call(address, key)) {
                var field = that.options.settings.get(key + '_field') || false;
                if (field) {
                  var $fieldInput = that.$el.closest('form').find('input[name=' + field + ']');
                  if ($fieldInput.length > 0) {
                    $fieldInput.val(address[key]);
                    that.model.set(field, address[key]);
                  }
                }
              }
            }
          }
        });
      });
    },

    getApiKey: function () {
      return this.options.settings.get('google_api_key') || app.settings.get('global').get('google_api_key');
    },

    serialize: function () {
      var value = this.options.value || '';

      var data = {
        value: value,
        name: this.options.name,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      };

      if (this.options.schema.get('type') === 'ALIAS') {
        data.name = '';
      }

      return data;
    },

    afterRender: function () {
      this.$el.find('#map-canvas').css('height', this.options.settings.get('map_height'));
    },

    // Called when UI is first created
    initialize: function () {
      var that = this;
      // Include the Google JSAPI for using Maps
      require(['https://www.google.com/jsapi'], function () {
        // Load Maps API using provided key, and call initializeMap() when API is loaded
        google.load('maps', '3', {other_params: 'libraries=places&key=' + that.getApiKey(), callback: function () {
          that.initializeMap();
        }});
      });
    }
  });
});
