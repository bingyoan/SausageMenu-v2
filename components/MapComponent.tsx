'use client';
import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { getDeviceLocation } from '../services/deviceLocation';

interface MapComponentProps {
  menus: any[];
  userLocation: { lat: number; lng: number } | null;
  onSelectMenu: (id: string) => void;
  onBoundsChange: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => void;
  /** Wait for the location request to finish before querying the menu API. */
  loadMenus: boolean;
  targetCenter?: { lat: number; lng: number } | null;
}

export default function MapComponent({ menus, userLocation, onSelectMenu, onBoundsChange, loadMenus, targetCenter }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // We use any to avoid importing 'L' type if leaflet is dynamic
  const markersGroupRef = useRef<any>(null);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const loadMenusRef = useRef(loadMenus);
  const userLocationRef = useRef(userLocation);
  const hasCenteredOnUserRef = useRef(false);

  // Leaflet is imported asynchronously. Keep these refs current during render
  // so an import that completes after a location update still uses that latest
  // location instead of the Tokyo fallback captured by the first render.
  onBoundsChangeRef.current = onBoundsChange;
  loadMenusRef.current = loadMenus;
  userLocationRef.current = userLocation;

  const reportVisibleBounds = () => {
    if (!mapInstanceRef.current || !loadMenusRef.current) return;
    if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);

    // A drag, a pinch and setView can each emit move events.  Waiting briefly
    // avoids sending several identical database requests for one interaction.
    boundsTimerRef.current = setTimeout(() => {
      if (!mapInstanceRef.current || !loadMenusRef.current) return;
      const bounds = mapInstanceRef.current.getBounds();
      onBoundsChangeRef.current({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast()
      });
    }, 250);
  };

  useEffect(() => {
    let leafletMap: any = null;

    // Dynamically load leaflet on the client side only
    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      if (mapInstanceRef.current) return; // Already initialized

      const latestLocation = userLocationRef.current;
      const centerPosition = latestLocation ? [latestLocation.lat, latestLocation.lng] : [35.6895, 139.6917];
      
      leafletMap = L.map(mapRef.current, {
        zoomControl: false,
        // Keep the provider acknowledgement visible.  It is required by the
        // map-data licence and is intentionally not hidden by our UI.
        attributionControl: true,
        preferCanvas: true
      }).setView(centerPosition as any, 14);

      // Carto's tile endpoint was returning an "API KEY required" image for
      // affected clients.  Use the documented OSM standard tile endpoint
      // instead; it does not require an application key for normal interactive
      // map viewing.  Attribution remains enabled above.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        // Request the next zoom level on high-density phone screens so labels
        // and roads are rendered sharply instead of scaling a 1x raster tile.
        detectRetina: true,
        updateWhenIdle: true,
        keepBuffer: 2
      }).addTo(leafletMap);

      markersGroupRef.current = L.layerGroup().addTo(leafletMap);

      leafletMap.on('moveend', reportVisibleBounds);

      mapInstanceRef.current = leafletMap;
      if (latestLocation) hasCenteredOnUserRef.current = true;
      renderMarkers(L);
      reportVisibleBounds();
    });

    return () => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // We do NOT want to re-run map initialization, only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Do not leave the map centred on the Tokyo fallback after a device location
  // arrives.  The old implementation fetched two regions and never re-centred.
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || hasCenteredOnUserRef.current) return;
    hasCenteredOnUserRef.current = true;
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14, { animate: false });
  }, [userLocation]);

  // If the map finished initialising before the location request, load exactly
  // the visible area once that request has resolved.
  useEffect(() => {
    if (loadMenus) reportVisibleBounds();
  }, [loadMenus]);

  // Effect to update markers when menus or userLocation change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    import('leaflet').then((L) => {
      renderMarkers(L);
    });
  }, [menus, userLocation]);

  // Render markers logic
  const renderMarkers = (L: any) => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    // SVG 狗狗圖示當作地標
    const dogIconHtml = `
      <div style="background: white; border-radius: 50%; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 2px solid #10b981; position: relative;">
        <div style="background: #10b981; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
          🌭
        </div>
        <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #10b981;"></div>
      </div>
    `;

    const markerIcon = new L.DivIcon({
      className: 'custom-marker',
      html: dogIconHtml,
      iconSize: [40, 46],
      iconAnchor: [20, 46],
      popupAnchor: [0, -46]
    });

    // User Icon
    const userIconHtml = `
      <div style="background: rgba(59, 130, 246, 0.2); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(59, 130, 246, 0.5);">
        <div style="background: #3b82f6; border-radius: 50%; width: 16px; height: 16px; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>
      </div>
    `;

    const userIcon = new L.DivIcon({
      className: 'user-marker',
      html: userIconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    menus.forEach((menu) => {
      const marker = L.marker([menu.lat, menu.lng], { icon: markerIcon }).addTo(markersGroupRef.current);
      
      // Native DOM popup creation to bind React event handlers securely
      const popupDiv = document.createElement('div');
      popupDiv.className = "p-1 min-w-[120px]";
      popupDiv.innerHTML = `
        <h3 class="font-bold text-sm text-gray-800">${menu.restaurant_name}</h3>
        <p class="text-xs text-gray-500 mt-1 truncate">${menu.address || ''}</p>
        <button class="menu-btn mt-2 w-full bg-emerald-500 text-white text-xs py-1.5 rounded-md font-bold hover:bg-emerald-600">
          查看菜單
        </button>
      `;
      
      const btn = popupDiv.querySelector('.menu-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          onSelectMenu(menu.id);
        });
      }

      marker.bindPopup(popupDiv, { className: 'custom-popup' });
    });

    if (userLocation) {
      const uMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(markersGroupRef.current);
      const uPopupDiv = document.createElement('div');
      uPopupDiv.innerHTML = `<span class="font-bold text-sm text-gray-800 p-1">您目前的位置</span>`;
      uMarker.bindPopup(uPopupDiv, { className: 'custom-popup' });
    }
  };

  // Jump to map when targetCenter changes
  useEffect(() => {
    if (mapInstanceRef.current && targetCenter) {
      mapInstanceRef.current.setView([targetCenter.lat, targetCenter.lng], 16, { animate: true });
    }
  }, [targetCenter]);

  // 返回目前位置
  const handleReturnToLocation = async () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
    } else if (mapInstanceRef.current) {
      try {
        const location = await getDeviceLocation({ timeout: 10000, maximumAge: 60000 });
        mapInstanceRef.current.setView([location.lat, location.lng], 16, { animate: true });
      } catch (error) {
        console.error(error);
        alert('無法取得你的位置，請到系統設定允許 SausageMenu 使用定位服務。');
      }
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', zIndex: 0, position: 'relative' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      
      {/* 返回目前位置按鈕 (永久顯示) */}
      <button
        type="button"
        onClick={handleReturnToLocation}
        className="absolute bottom-6 right-4 bg-white p-3 rounded-full shadow-md z-[1000] hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-200"
        title="返回我的位置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500">
          <path d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 19.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" clipRule="evenodd" />
        </svg>
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container { font-family: inherit; z-index: 1; background: #edf2f7; }
        .leaflet-control-attribution { font-size: 10px; background: rgba(255,255,255,.88); }
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .custom-popup .leaflet-popup-content { margin: 8px 12px; }
      `}} />
    </div>
  );
}
