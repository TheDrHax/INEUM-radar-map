var locations = [
  'Улан-Удэ',
  'Иркутск',
  'Красноярск',
  'Павлодар'
];

var stations = [
  // [inner, outer, cost]
  [150, 400, 400],
  [200, 400, 300],
  [100, 200, 200],
  [000, 150, 100]
];

/* ------------------------------------------------------------------------- */

var map;
var price_button;

function station(xy, r1, r2, cost) {
  var station = new ymaps.GeoObjectCollection({}, {
    draggable: true,
    strokeOpacity: 0.8,
    strokeWidth: 1,
  });

  var inner = new ymaps.Circle([xy, r1 * 1000], {}, {
    fillColor: "#FF000080",
    strokeColor: "#FF0000",
    zIndex: 2
  });

  var outer = new ymaps.Circle([xy, r2 * 1000], {}, {
    fillColor: "#00FF0080",
    strokeColor: "#00FF00",
    zIndex: 1
  });

  outer.events.add('drag', event => {
    inner.geometry.setCoordinates(outer.geometry.getCoordinates());
  });

  inner.events.add('drag', event => {
    outer.geometry.setCoordinates(inner.geometry.getCoordinates());
  });

  station.add(inner).add(outer)

  station.events.add('click', event => {
    map.geoObjects.remove(station);
    price_button.update(-cost);
  });

  price_button.update(cost);

  return station;
}

function point(xy) {
  return new ymaps.Placemark(xy, {}, {
    preset: 'islands#blueCircleDotIconWithCaption'
  });
}

function line(xy1, xy2) {
  return new ymaps.GeoObject({
    geometry: {
      type: "LineString",
      coordinates: [xy1, xy2]
    }
  }, {
    strokeColor: "#FF0000",
    strokeWidth: 2
  });
}

function find(l) {
  return ymaps.geocode(l, {
    results: 1
  }).then(function (res) {
    var first = res.geoObjects.get(0);
    return first.geometry.getCoordinates();
  });
}

function findAll(locations) {
  var promises = [];
  locations.forEach(l => promises.push(find(l)));
  return Promise.all(promises);
}

function init() {
  findAll(locations).then(coordinates => {
    var edges = [[0, 0], [0, 0]];

    coordinates.forEach(xy => {
      if (xy[0] < edges[0][0] || edges[0][0] == 0) edges[0][0] = xy[0] - 10; // min X
      if (xy[1] < edges[0][1] || edges[0][1] == 0) edges[0][1] = xy[1] - 10; // min Y
      if (xy[0] > edges[1][0] || edges[1][0] == 0) edges[1][0] = xy[0] + 10; // max X
      if (xy[1] > edges[1][1] || edges[1][1] == 0) edges[1][1] = xy[1] + 10; // max Y
    });

    var center = [(edges[0][0] + edges[1][0]) / 2, (edges[0][1] + edges[1][1]) / 2];

    map = new ymaps.Map("map", {
      bounds: edges
    });

    stations.forEach(r => {
      var button = new ymaps.control.Button({
        data: {
          content: '' + r[0] + '-' + r[1] + ' км ' + r[2] + ' у.е.'
        },
        options: {
          maxWidth: 200,
          selectOnClick: false
        }
      });
      button.events.add('click', event => {
        map.geoObjects.add(station(center, r[0], r[1], r[2]));
      });
      map.controls.add(button, {float: 'left'});
    });

    price_button = new ymaps.control.Button({
      options: {
        maxWidth: 200,
        selectOnClick: false
      }
    });
    price_button.value = 0;
    price_button.update = function (delta) {
      this.value += delta;
      this.data.set('content', 'Цена: ' + this.value);
    }
    price_button.update(0);
    map.controls.add(price_button, {float: 'right'});

    for (var i = 0; i < coordinates.length; i++) {
      map.geoObjects.add(point(coordinates[i])); // points

      for (var j = i + 1; j < coordinates.length; j++) { // lines
        map.geoObjects.add(line(coordinates[i], coordinates[j]));
      }
    }
  });
}

ymaps.ready(init);
