import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  MapPin, 
  Search, 
  Navigation, 
  Check, 
  Loader2, 
  AlertCircle
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initGoogleMapsSocialModal?: () => void;
  }
}

export interface PostLocation {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

interface GoogleMapLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: PostLocation) => void;
  initialLocation?: PostLocation | null;
}

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDYaJdnCZKDpAMZxRCvJryJ1Bhf-jHovbI';

const POPULAR_CITIES: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Alexandria, Egypt', lat: 31.2001, lng: 29.9187 },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'New York, USA', lat: 40.7128, lng: -74.006 },
];

export const GoogleMapLocationModal: React.FC<GoogleMapLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [isLoadingSdk, setIsLoadingSdk] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<PostLocation>(() => {
    return initialLocation || {
      name: 'Cairo, Egypt',
      address: 'Cairo Governorate, Egypt',
      lat: 30.0444,
      lng: 31.2357,
    };
  });

  // Load Google Maps script once
  useEffect(() => {
    if (!isOpen) return;

    if (window.google && window.google.maps) {
      setIsLoadingSdk(false);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoadingSdk(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoadingSdk(false);
    script.onerror = () => {
      setSdkError('Could not load Google Maps SDK. Please check your internet connection or API key.');
      setIsLoadingSdk(false);
    };
    document.head.appendChild(script);
  }, [isOpen]);

  // Initialize Map and Places Autocomplete
  useEffect(() => {
    if (!isOpen || isLoadingSdk || !mapContainerRef.current) return;

    try {
      const google = window.google;
      if (!google || !google.maps) return;

      const center = { lat: selectedLocation.lat, lng: selectedLocation.lng };

      const map = new google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      const marker = new google.maps.Marker({
        position: center,
        map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: selectedLocation.name,
      });
      markerInstanceRef.current = marker;

      const geocoder = new google.maps.Geocoder();

      // Reverse geocode when marker is dragged
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (!position) return;
        const lat = position.lat();
        const lng = position.lng();

        geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            const formatted = results[0].formatted_address;
            const shortName = results[0].address_components?.[0]?.long_name || 'Pinned Location';
            setSelectedLocation({
              name: shortName,
              address: formatted,
              lat,
              lng,
            });
            setSearchQuery(shortName);
          } else {
            setSelectedLocation((prev) => ({
              ...prev,
              lat,
              lng,
            }));
          }
        });
      });

      // Click on map to place pin
      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition(e.latLng);

        geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            const formatted = results[0].formatted_address;
            const shortName = results[0].address_components?.[0]?.long_name || 'Pinned Location';
            setSelectedLocation({
              name: shortName,
              address: formatted,
              lat,
              lng,
            });
            setSearchQuery(shortName);
          } else {
            setSelectedLocation((prev) => ({
              ...prev,
              lat,
              lng,
            }));
          }
        });
      });

      // Autocomplete setup
      if (autocompleteInputRef.current && google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
          fields: ['name', 'formatted_address', 'geometry'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          map.setCenter({ lat, lng });
          map.setZoom(15);
          marker.setPosition({ lat, lng });

          setSelectedLocation({
            name: place.name || 'Selected Place',
            address: place.formatted_address || '',
            lat,
            lng,
          });
          setSearchQuery(place.name || '');
        });
      }
    } catch (err) {
      console.error('Error initializing Google Maps:', err);
      setSdkError('Failed to initialize Google Maps');
    }
  }, [isOpen, isLoadingSdk]);

  const handleSelectPopularCity = (city: { name: string; lat: number; lng: number }) => {
    setSelectedLocation({
      name: city.name,
      address: city.name,
      lat: city.lat,
      lng: city.lng,
    });
    setSearchQuery(city.name);

    if (mapInstanceRef.current && markerInstanceRef.current && window.google) {
      const latLng = new window.google.maps.LatLng(city.lat, city.lng);
      mapInstanceRef.current.setCenter(latLng);
      mapInstanceRef.current.setZoom(13);
      markerInstanceRef.current.setPosition(latLng);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapInstanceRef.current && markerInstanceRef.current && window.google) {
          const latLng = new window.google.maps.LatLng(lat, lng);
          mapInstanceRef.current.setCenter(latLng);
          mapInstanceRef.current.setZoom(15);
          markerInstanceRef.current.setPosition(latLng);

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
            setIsLocatingUser(false);
            if (status === 'OK' && results && results[0]) {
              const formatted = results[0].formatted_address;
              const shortName = results[0].address_components?.[1]?.long_name || results[0].address_components?.[0]?.long_name || 'My Location';
              setSelectedLocation({
                name: shortName,
                address: formatted,
                lat,
                lng,
              });
              setSearchQuery(shortName);
            } else {
              setSelectedLocation({
                name: 'Current Location',
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                lat,
                lng,
              });
            }
          });
        } else {
          setIsLocatingUser(false);
        }
      },
      (err) => {
        setIsLocatingUser(false);
        alert(`Location access denied or unavailable: ${err.message}`);
      },
      { timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onSelectLocation(selectedLocation);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Check in with Google Maps</h3>
              <p className="text-xs text-gray-500">Search places or pin your location on the map</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Current Location Button */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-2.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={autocompleteInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, neighborhood, restaurant, or landmark..."
              className="w-full pl-9 pr-24 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocatingUser}
              className="absolute right-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              title="Use current GPS location"
            >
              {isLocatingUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>GPS</span>
            </button>
          </div>

          {/* Popular Cities Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0">Popular:</span>
            {POPULAR_CITIES.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => handleSelectPopularCity(city)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-[11px] font-medium text-gray-700 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full h-72 sm:h-80 bg-gray-100">
          {isLoadingSdk && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-2 z-10">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              <span className="text-xs font-medium text-gray-500">Loading Google Maps...</span>
            </div>
          )}

          {sdkError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/70 p-4 text-center z-10">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-xs font-semibold text-red-700">{sdkError}</p>
            </div>
          )}

          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Selected Location Details & Action Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {selectedLocation.name}
              </div>
              <div className="text-[11px] text-gray-500 truncate max-w-xs">
                {selectedLocation.address || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

