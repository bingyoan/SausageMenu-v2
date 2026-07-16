import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface DeviceCoordinates {
  lat: number;
  lng: number;
}

export interface DeviceLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export async function getDeviceLocation(
  options: DeviceLocationOptions = {},
): Promise<DeviceCoordinates> {
  const positionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 60000,
  };

  if (Capacitor.isNativePlatform()) {
    let permissions = await Geolocation.checkPermissions();
    if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
      permissions = await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation'],
      });
    }

    if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
      throw new Error('LOCATION_PERMISSION_DENIED');
    }

    const position = await Geolocation.getCurrentPosition(positionOptions);
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('LOCATION_UNAVAILABLE');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
      reject,
      positionOptions,
    );
  });
}
