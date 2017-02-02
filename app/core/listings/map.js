define([
  'app',
  'underscore',
  'backbone',
  'moment',
  'async!https://maps.googleapis.com/maps/api/js?key=AIzaSyBmNpZfwjrxJ0zHEwYxgQ0_eKyfSexbZdQ&libraries=places'
], function(app, _, Backbone, moment) {

  return {
    id: 'map',

    View: Backbone.Layout.extend({

      template: 'core/listings/map',

      attributes: {
        class: 'view-map js-listing-view'
      },

      afterRender: function() {
        this.initMap();
      },

      pinSymbol: function (color) {
        return {
          path: 'M7,0 C3.13,0 0,3.13 0,7 C0,12.25 7,20 7,20 C7,20 14,12.25 14,7 C14,3.13 10.87,0 7,0 Z M7,9.5 C5.62,9.5 4.5,8.38 4.5,7 C4.5,5.62 5.62,4.5 7,4.5 C8.38,4.5 9.5,5.62 9.5,7 C9.5,8.38 8.38,9.5 7,9.5 Z',
          fillColor: color,
          fillOpacity: 1,
          strokeColor: color,
          strokeWeight: 1,
          scale: 2,
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(7, 20),
          animation: google.maps.Animation.DROP
        };
      },

      initMap: function() {
        var mapOptions = {
          zoom: 14,
          center: new google.maps.LatLng(40.720, -73.953),
          styles: [
            {
              'featureType': 'administrative',
              'elementType': 'labels.text.fill',
              'stylers': [{'color':'#444444'}]
            },
            {
              'featureType': 'landscape',
              'elementType': 'all',
              'stylers': [{'color':'#f2f2f2'}]
            },
            {
              'featureType': 'poi',
              'elementType': 'all',
              'stylers': [{'visibility':'off'}]
            },
            {
              'featureType': 'poi',
              'elementType': 'labels.text',
              'stylers': [{'visibility':'off'}]
            },
            {
              'featureType': 'road',
              'elementType': 'all',
              'stylers': [{'saturation':-100},{'lightness':45}]
            },
            {
              'featureType': 'road.highway',
              'elementType': 'all',
              'stylers': [{'visibility':'simplified'}]
            },
            {
              'featureType': 'road.arterial',
              'elementType': 'labels.icon',
              'stylers': [{'visibility':'off'}]
            },
            {
              'featureType': 'transit',
              'elementType': 'all',
              'stylers': [{'visibility':'off'}]
            },
            {
              'featureType': 'water',
              'elementType': 'all',
              'stylers': [{'color':'#dbdbdb'},{'visibility':'on'}]
            }
          ]
        };

        var mapElement = this.$('.map')[0];
        var map = this.map = new google.maps.Map(mapElement, mapOptions);
        var marker = this.marker = new google.maps.Marker({
          position: new google.maps.LatLng(40.720, -73.953),
          map: map,
          draggable: true,
          title: 'Select a Location',
          icon: this.pinSymbol('#3498DB')
        });

        var input = this.input = this.$('#map-search')[0];
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        var autocomplete = this.autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);

        // var infowindow = new google.maps.InfoWindow();
        autocomplete.addListener('place_changed', _.bind(function() {
          var place = autocomplete.getPlace();
          this.state.place = place;
          this.state.search = this.input.value;
          this.changePlace(place);
        }, this));

        // set to last location
        if (this.state.loaded && this.state.place) {
          $(this.input).val(this.state.search);
          this.changePlace(this.state.place);
        }

        //////////////////////////////////////////////////////////////////////////////

        google.maps.event.addListener(marker, 'dragstart', function (event) {
          marker.setAnimation(3); // Raise
          $('#map-search').val('');
        });

        google.maps.event.addListener(marker, 'drag', function (event) {
          $('.lat-long').html('Latitude: '+ event.latLng.lat().toFixed(3) +'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Longitude: '+ event.latLng.lng().toFixed(3));
        });

        google.maps.event.addListener(marker, 'dragend', function (event) {
          marker.setAnimation(4); // Bounce
          $('.lat-long').html('Latitude: '+ event.latLng.lat().toFixed(3) +'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Longitude: '+ event.latLng.lng().toFixed(3));
        });

        map.setOptions({
          draggable: true,
          zoomControl: true,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          streetViewControl: false,
          disableDefaultUI: true
        });

        google.maps.event.addDomListener(window, 'resize', function() {
          var center = map.getCenter();
          google.maps.event.trigger(map, 'resize');
          map.setCenter(center);
        });

        this.state.loaded = true;
      },

      changePlace: function(place) {
        var marker = this.marker;
        var map = this.map;

        // infowindow.close();
        marker.setVisible(false);

        if (!place.geometry) {
          // User entered the name of a Place that was not suggested and
          // pressed the Enter key, or the Place Details request failed.
          // window.alert('Please select a result from the menu below.');
          return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }

        marker.setPosition(place.geometry.location);
        marker.setVisible(true);

        var address = '';
        if (place.address_components) {
          address = [
            (place.address_components[0] && place.address_components[0].short_name || ''),
            (place.address_components[1] && place.address_components[1].short_name || ''),
            (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
        }

        $('.lat-long').html('Latitude: ' + place.geometry.location.lat().toFixed(3) + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Longitude: ' + place.geometry.location.lng().toFixed(3) + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(' + place.name + ')'); // address

      },

      initialize: function() {
        this.state = {
          loaded: false,
          search: null
        }
      }
    })
  }
});
