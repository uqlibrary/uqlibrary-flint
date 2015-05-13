(function () {
  //var mapMarkerIconActive = '//chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FE7569';
  //var mapMarkerIcon = '//chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|CCCCCC';

  // Small hack to define if this is a touchscreen device
  function is_touch_device() {
    return 'ontouchstart' in window // works on most browsers
      || 'onmsgesturechange' in window; // works on ie10
  }

  Polymer({
    /**
     * Initialisation
     */
    created: function () {
      this.items = null;
      //this.initialMapMarkerIcon = mapMarkerIconActive;
      this.openedMarker = null;
      this.isTouchDevice = is_touch_device();
    },

    /**
     * Look through all the elements and return a
     * lat lng bounds enclosing them all
     *
     * @returns {google.maps.LatLngBounds}
     */
    getLatLngBounds: function () {
      var mapMarkers = this.getMapMarkers();
      var bounds = new google.maps.LatLngBounds();

      for (var i = 0, l = mapMarkers.length; i < l; i++) {
        var ll = new google.maps.LatLng(mapMarkers[i].latitude, mapMarkers[i].longitude);
        bounds.extend(ll);
      }

      return bounds;
    },

    /**
     * Return a HTML element group of current map markers
     *
     * @returns {NodeList|*}
     */
    getMapMarkers: function () {
      return this.shadowRoot.querySelectorAll('google-map-marker');
    },

    /**
     * Run the map initialisation
     */
    mapReady: function () {
      var allowedBounds = this.getLatLngBounds();
      var lastValidCenter = this.$.gmap.map.getCenter();
      var that = this;

      this.$.gmap.map.set('overviewMapControl', true);
      this.$.gmap.map.set('overviewMapControlOptions', {opened: true});

      // listen for event, currently triggered from map tab header
      document.addEventListener('uqlibrary-flint-map-center-tap', function () {
        that.recenterMap();
      });

      // ensure that Yury can't scroll all the way to Belarus
      google.maps.event.addListener(this.$.gmap.map, 'center_changed', function () {
        if (allowedBounds.contains(this.getCenter())) {
          // still within valid bounds, so save the last valid position
          lastValidCenter = this.getCenter();
          return;
        }

        // not valid anymore => return to last valid position
        this.panTo(lastValidCenter);
      });
    },

    mapMarkerClicked: function (e, sender, marker) {
      var showDetails = true;
      var index = e.path[0].getAttribute('data-index');

      if (this.isTouchDevice) {
        if (this.openedMarker == null || this.openedMarker.getAttribute('data-index') != index) {
          this.openedMarker = e.target;
          showDetails = false;
        }
      }
      if (marker.marker.info != null) {
        this.openedMarker = marker;
      }
      //this.setActiveMapMarker(e.target);
      if (showDetails) {
        this.fire("category-selected", this.items[index]);
      }

    },

    markerHoverHandler: function (e, sender, marker) {
      if (!this.isTouchDevice && marker.info != null) {
        this.openedMarker = e.target;
      }
    },

    openedMarkerChanged: function (oldValue, newValue) {
      if (oldValue || newValue == null) {
        oldValue.info.close(oldValue.map, oldValue.marker);
      }
      if (newValue) {
        newValue.info.open(newValue.map, newValue.marker);
      }
    },

    /**
     * Set map back to initial state
     */
    recenterMap: function () {
      this.$.gmap.map.fitBounds(this.getLatLngBounds());
    },

    resizeMap: function () {
      this.$.gmap.resize();
    },

    setActiveMapMarker: function (activeMapMarker) {
      var mapMarkers = this.getMapMarkers();

      for (var i = 0, l = mapMarkers.length; i < l; i++) {
        mapMarkers[i].icon = {
          url: mapMarkers[i] === activeMapMarker ? mapMarkerIconActive : mapMarkerIcon
        };
      }
    },

    showDetails: function (el) {
      var item = el.parent.parent();
      if (item != null) {
        item.fire('google-map-marker-click');
      }
    }

  });
})();
