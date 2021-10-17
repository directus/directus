# End-to-End (e2e) Tests

This folder contains the end-to-end tests to go over the whole suite. Unit/integration tests per package can be found in
the individual packages.

The schema can be viewed at `./schema.png`. Some fields allow broader data to be inserted in them than is their intended
use. These include:

- events:

  - 'tags' insert csv content

- users:

  - 'search_radius' insert geoPoly

- tours
  - 'route' insert geoLine
  - 'map_of_stops' insert geoMultiPoint
  - 'area_of_reach' insert geoMultiPoly
  - 'revenue_of_shows_by_month' insert multilineString
