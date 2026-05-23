import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { ActivityLocation } from '../lib/useLocationTracking';

interface MapTrackerProps {
  locations: ActivityLocation[];
  isTracking: boolean;
}

export default function MapTracker({ locations, isTracking }: MapTrackerProps) {
  const mapRef = useRef<MapView>(null);

  // Auto-center map on new locations if tracking
  useEffect(() => {
    if (locations.length > 0 && isTracking) {
      const lastLocation = locations[locations.length - 1];
      mapRef.current?.animateCamera({
        center: {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
        },
        pitch: 0,
        heading: 0,
        zoom: 17,
      });
    }
  }, [locations, isTracking]);

  const coordinates = locations.map(loc => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));

  const initialRegion = coordinates.length > 0 ? {
    latitude: coordinates[0].latitude,
    longitude: coordinates[0].longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  } : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        userInterfaceStyle="dark"
      >
        {coordinates.length > 0 && (
          <Polyline
            coordinates={coordinates}
            strokeColor="#ff3366" // Premium brand color
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {coordinates.length > 0 && !isTracking && (
          <Marker coordinate={coordinates[0]} pinColor="green" title="Start" />
        )}
        {coordinates.length > 1 && !isTracking && (
          <Marker coordinate={coordinates[coordinates.length - 1]} pinColor="red" title="Finish" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
