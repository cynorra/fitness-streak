import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { useTranslation } from './i18n/i18n';

export type ActivityLocation = {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null; // meters per second
};

export const useLocationTracking = () => {
  const { t } = useTranslation();
  const [isTracking, setIsTracking] = useState(false);
  const [locations, setLocations] = useState<ActivityLocation[]>([]);
  const [distance, setDistance] = useState(0); // in meters
  const [duration, setDuration] = useState(0); // in seconds
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const requestPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      alert(t('tracker.location_denied'));
      return false;
    }
    return true;
  };

  const startTracking = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLocations([]);
    setDistance(0);
    setDuration(0);
    setIsTracking(true);

    timerInterval.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (newLocation) => {
        const { latitude, longitude, speed } = newLocation.coords;
        const newPoint = { latitude, longitude, timestamp: newLocation.timestamp, speed };
        
        setLocations((prevLocations) => {
          if (prevLocations.length > 0) {
            const lastPoint = prevLocations[prevLocations.length - 1];
            const dist = getDistance(
              { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
              { latitude, longitude }
            );
            // Only add distance if it's realistic to avoid GPS drift (e.g. > 1 meter, < 100 meters per 2 seconds)
            if (dist > 1 && dist < 100) {
              setDistance((prevDist) => prevDist + dist);
            }
          }
          return [...prevLocations, newPoint];
        });
      }
    );
  };

  const pauseTracking = () => {
    setIsTracking(false);
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (locationSubscription.current) locationSubscription.current.remove();
  };

  const resumeTracking = async () => {
    setIsTracking(true);
    timerInterval.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (newLocation) => {
        const { latitude, longitude, speed } = newLocation.coords;
        const newPoint = { latitude, longitude, timestamp: newLocation.timestamp, speed };
        
        setLocations((prevLocations) => {
          if (prevLocations.length > 0) {
            const lastPoint = prevLocations[prevLocations.length - 1];
            const dist = getDistance(
              { latitude: lastPoint.latitude, longitude: lastPoint.longitude },
              { latitude, longitude }
            );
            if (dist > 1 && dist < 100) {
              setDistance((prevDist) => prevDist + dist);
            }
          }
          return [...prevLocations, newPoint];
        });
      }
    );
  };

  const stopTracking = () => {
    pauseTracking();
  };

  const formatPace = (distMeters: number, timeSeconds: number) => {
    if (distMeters === 0) return "0'00\"";
    const km = distMeters / 1000;
    const minutes = timeSeconds / 60;
    const pace = minutes / km;
    
    const paceMinutes = Math.floor(pace);
    const paceSeconds = Math.floor((pace - paceMinutes) * 60);
    
    if (paceMinutes > 59) return "59'59\""; // Cap it
    return `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}"`;
  };

  return {
    isTracking,
    locations,
    distance, // meters
    duration, // seconds
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    formatPace
  };
};
