import React, { Component } from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import { MapView } from 'expo';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      trolleyMarkers: [],
      routeMarkers: [],
      routeLines: [],
    };
    this.trolleyCallback = this.trolleyCallback.bind(this);
    this.routeCallback = this.routeCallback.bind(this);
    this.processRoutes = this.processRoutes.bind(this);
  }
  componentDidMount() {
    this.requestRoutes(this.routeCallback);
  }
  render() {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 26.122365,
            longitude: -80.137297,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
          }}>
          {this.state.trolleyMarkers.map((marker, i) => {
            var lat = marker.coordinate.latitude;
            var lon = marker.coordinate.longitude;
            return (
              <MapView.Marker
                coordinate={{ latitude: lat, longitude: lon }}
                title={marker.title}
                description={marker.description}
              />
            );
          })}
          {this.state.routeLines.map((lineArray, key) => {
            return (
              <MapView.Polyline
                coordinates={lineArray}
                strokeColor={getColor(key)}
              />
            );
          })}
        </MapView>
        <TouchableHighlight
          style={styles.button}
          onPress={() => this.refresh()}
          underlayColor="#bbbbbb">
          <Text style={styles.buttonText}>
            Refresh
          </Text>
        </TouchableHighlight>
      </View>
    );
  }
  refresh() {
    this.setState({ trolleyMarkers: [] });
    this.requestTrolleys(this.trolleyCallback);
  }
  trolleyCallback(trolleyMarkers) {
    this.setState({ trolleyMarkers: trolleyMarkers });
  }
  routeCallback(routeMarkers) {
    this.setState({ routeMarkers: routeMarkers });
  }
  requestTrolleys(callback) {
    console.log('requestTrolleys() called');
    fetch('https://suntrolley.herokuapp.com/api')
      .then(function(res) {
        return res.json();
      })
      .then(function(trolleys) {
        console.log('Trolley request call returned');
        var trolleyMarkers = [];
        console.log(JSON.stringify(trolleys));
        var i = 0;
        for (i = 0; i < trolleys.length; i++) {
          var j = 0;
          for (j = 0; j < trolleys[i].points.length; j++) {
            var route = trolleys[i].route;
            var location = trolleys[i].points[j];
            var latlon = location.split(',');
            //console.log(location);
            trolleyMarkers.push({
              coordinate: {
                latitude: parseFloat(latlon[0]),
                longitude: parseFloat(latlon[1]),
              },
              title: 'Route: ' + route + ' (' + getName(route) + ')',
              description: 'Location: ' + location,
            });
          }
        }
        console.log(JSON.stringify(trolleyMarkers));
        callback(trolleyMarkers);
      })
      .catch(error => {
        console.log('ERROR requesting trolley data');
        console.warn(error);
      });
  }
  requestRoutes(callback) {
    console.log('displayRoutesAsMarkers() called');
    fetch(
      'https://raw.githubusercontent.com/qtrandev/suntrolleygtfs/master/shapes.txt'
    )
      .then(response => response.text())
      .then(responseText => {
        var routeMarkers = this.processRoutes(responseText);
        callback(routeMarkers);
      })
      .catch(error => {
        console.warn(error);
      });
  }
  processRoutes(allText) {
    console.log('processRoutes() called');
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var routes = [];
    for (var i = 1; i < allTextLines.length; i++) {
      var data = allTextLines[i].split(',');
      if (data.length >= 4) {
        if (routes[data[0]] === undefined) {
          routes[data[0]] = [];
        }
        routes[data[0]].push(data);
      }
    }

    var routeMarkers = [];
    var routeLines = [];
    for (var index in routes) {
      routeLines[index] = [];
      var route = routes[index];
      for (var j = 0; j < route.length; j++) {
        routeMarkers.push({
          coordinate: {
            latitude: parseFloat(route[j][1]),
            longitude: parseFloat(route[j][2]),
          },
          title: 'Route ' + route[j][0],
          description: 'Stop sequence: ' + route[j][3],
        });
        routeLines[index].push({
          latitude: parseFloat(route[j][1]),
          longitude: parseFloat(route[j][2]),
        });
      }
    }
    this.setState({ routeLines: routeLines });
    return routeMarkers;
  }
}

function getColor(route) {
  for (var i = 0; i < routeColors.length; i++) {
    if (routeColors[i].id == route) {
      return '#' + routeColors[i].color;
    }
  }
  return '#000000';
}

function getName(route) {
  for (var i = 0; i < routeColors.length; i++) {
    if (routeColors[i].id == route) {
      return routeColors[i].name;
    }
  }
  return route;
}

const routeColors = [
  {
    id: 4,
    name: 'Las Olas Link',
    type: 3,
    color: '009999',
  },
  {
    id: 5,
    name: 'Galt Link',
    type: 3,
    color: '0066CC',
  },
  {
    id: 6,
    name: 'Beach Link',
    type: 3,
    color: 'FF0099',
  },
  {
    id: 7,
    name: 'Airport Link',
    type: 3,
    color: 'FF0000',
  },
  {
    id: 8,
    name: 'Neighborhood Link',
    type: 3,
    color: '00FF00',
  },
  {
    id: 9,
    name: 'Water Trolley',
    type: 4,
    color: '0000FF',
  },
  {
    id: 10,
    name: 'NW Community Link',
    type: 3,
    color: '0F00FF',
  },
  {
    id: 12,
    name: 'Uptown Link',
    type: 3,
    color: 'FF0000',
  },
  {
    id: 13,
    name: 'Downtown Link',
    type: 3,
    color: '00FFFF',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  button: {
    height: 36,
    backgroundColor: '#123456',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    margin: 2,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
});
