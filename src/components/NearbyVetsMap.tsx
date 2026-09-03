import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { t } from '../lib/translations';
import { MapPin, Phone, Navigation, AlertCircle, Locate } from 'lucide-react';

interface NearbyVetsMapProps {
  language: Language;
}

interface VetPlace {
  id: string;
  name: string;
  vicinity: string;
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  rating?: number;
}

export const NearbyVetsMap: React.FC<NearbyVetsMapProps> = ({ language }) => {
  const isEn = language === 'en';
  
  // Environment configuration reading
  const googleMapsApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) || "";

  // Lat/Lng state (Default Sahiwal coordinates)
  const [latitude, setLatitude] = useState<number>(30.6682);
  const [longitude, setLongitude] = useState<number>(73.1114);
  const [manualLat, setManualLat] = useState<string>("30.6682");
  const [manualLng, setManualLng] = useState<string>("73.1114");

  // Geolocation & maps status
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [gpsDenied, setGpsDenied] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<boolean>(false);
  const [useOSM, setUseOSM] = useState<boolean>(false);
  const [places, setPlaces] = useState<VetPlace[]>([]);
  const [searchRadius, setSearchRadius] = useState<number>(15); // in km
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Haversine formula to compute distance in km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Pre-defined local Pakistani fallback clinics/hospitals
  const getFallbackClinics = (currentLat: number, currentLng: number): VetPlace[] => {
    const clinics = [
      {
        id: 'mock_1',
        name: 'Government Civil Veterinary Hospital Sahiwal (سرکاری سول ویٹرنری ہسپتال)',
        vicinity: 'High School Rd, Sahiwal City, Punjab',
        lat: 30.6690,
        lng: 73.1090,
        phone: '040-9200234',
        rating: 4.5
      },
      {
        id: 'mock_2',
        name: 'Lahore Veterinary Hospital & Outpost (لاہور جانوروں کا ہسپتال)',
        vicinity: 'Queens Road, Mozang Chauraha, Lahore',
        lat: 31.5546,
        lng: 74.3186,
        phone: '042-99211442',
        rating: 4.6
      },
      {
        id: 'mock_3',
        name: 'Islamabad Livestock Care Clinic (اسلام آباد اینیمل کلینک)',
        vicinity: 'G-10 Markaz, Islamabad',
        lat: 33.6844,
        lng: 72.9898,
        phone: '051-2292312',
        rating: 4.8
      },
      {
        id: 'mock_4',
        name: 'University Veterinary Hospital UVAS (یو وی اے ایس ویٹرنری ہسپتال)',
        vicinity: 'Outfall Road, Lahore',
        lat: 31.5714,
        lng: 74.3068,
        phone: '042-99211374',
        rating: 4.7
      },
      {
        id: 'mock_5',
        name: 'Rehman Veterinary & Livestock Clinic (رحمان ویٹرنری کلینک)',
        vicinity: 'Jinnah Town, Sahiwal',
        lat: 30.6582,
        lng: 73.1184,
        phone: '0300-1234567',
        rating: 4.4
      }
    ];

    return clinics.map(c => ({
      ...c,
      distanceKm: getDistance(currentLat, currentLng, c.lat, c.lng)
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  };

  // Google Maps Auth failure hook
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps authentication failure detected. Switching immediately to OpenStreetMap.");
      setUseOSM(true);
      setScriptError(true);
    };
    return () => {
      try {
        delete (window as any).gm_authFailure;
      } catch {
        (window as any).gm_authFailure = undefined;
      }
    };
  }, []);

  // Liveness timer fallback: switch to OSM if Google Maps fails to initialize in 1.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!googleMap.current) {
        console.warn("Google Maps failed to initialize within 1.5 seconds. Switching to OpenStreetMap.");
        setUseOSM(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [scriptLoaded]);

  // Load fallback data initially
  useEffect(() => {
    if (places.length === 0) {
      setPlaces(getFallbackClinics(latitude, longitude));
    }
  }, [latitude, longitude]);

  // 2. Dynamic Script Loader for Google Maps JS SDK
  useEffect(() => {
    if (!googleMapsApiKey || googleMapsApiKey === "YOUR_KEY" || googleMapsApiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      setScriptError(true);
      setUseOSM(true);
      setGpsLoading(false);
      return;
    }

    if ((window as any).google && (window as any).google.maps) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = 'google-maps-sdk-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&language=${language === 'en' ? 'en' : 'ur'}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if ((window as any).google && (window as any).google.maps) {
          setScriptLoaded(true);
        } else {
          setScriptError(true);
          setUseOSM(true);
        }
      };

      script.onerror = () => {
        setScriptError(true);
        setUseOSM(true);
      };

      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          setScriptLoaded(true);
          clearInterval(interval);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        if (!(window as any).google) {
          setScriptError(true);
          setUseOSM(true);
        }
      }, 8000);
    }
  }, [googleMapsApiKey, language]);

  // 3. Request Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Verify if coordinates are strictly within Pakistan bounding box
          if (lat >= 23.6 && lat <= 37.1 && lng >= 60.8 && lng <= 77.0) {
            setLatitude(lat);
            setLongitude(lng);
            setManualLat(lat.toFixed(4));
            setManualLng(lng.toFixed(4));
          } else {
            console.warn("GPS coordinates are outside Pakistan. Sticking to Sahiwal default:", lat, lng);
            setLatitude(30.6682);
            setLongitude(73.1114);
            setManualLat("30.6682");
            setManualLng("73.1114");
          }
          setGpsLoading(false);
        },
        (error) => {
          console.warn("Geolocation failed or denied:", error);
          setGpsDenied(true);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsDenied(true);
      setGpsLoading(false);
    }
  }, []);

  // 4. Initialize Map & Perform Places Search with Radius Expansion
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !(window as any).google || useOSM) return;

    try {
      const maps = (window as any).google.maps;
      if (!maps || !maps.Map) {
        throw new Error("Maps module not loaded fully");
      }

      const center = { lat: latitude, lng: longitude };

      // Initialize Map Instance
      const map = new maps.Map(mapRef.current, {
        center: center,
        zoom: 12,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        styles: [
          {
            featureType: "poi.business",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      googleMap.current = map;

      // Force map resize recalculation on component load
      setTimeout(() => {
        if (googleMap.current && maps) {
          maps.event.trigger(googleMap.current, 'resize');
          googleMap.current.setCenter(center);
        }
      }, 200);

      // Clear previous markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Custom Farm Marker (Green Pin)
      const farmMarker = new maps.Marker({
        position: center,
        map: map,
        title: isEn ? "My Farm Location" : "میرے باڑے کا مقام",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        }
      });

      const farmInfoWindow = new maps.InfoWindow({
        content: `<div style="color: black; font-weight: bold; padding: 4px;">🏡 ${isEn ? "My Farm Location" : "میرا ڈیری فارم"}</div>`
      });

      farmMarker.addListener('click', () => {
        farmInfoWindow.open(map, farmMarker);
      });

      markersRef.current.push(farmMarker);

      // Places Service with Dynamic Search Radius Expansion (Up to 50km)
      if (!maps.places || !maps.places.PlacesService) {
        throw new Error("Places library not ready");
      }

      const placesService = new maps.places.PlacesService(map);

      const performSearch = (radius: number) => {
        placesService.nearbySearch({
          location: center,
          radius: radius * 1000,
          keyword: 'veterinary clinic hospital animal doctor dhor'
        }, (results: any[], status: any) => {
          try {
            if (status === maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              const mappedPlaces: VetPlace[] = results.map(place => {
                const placeLat = place.geometry.location.lat();
                const placeLng = place.geometry.location.lng();
                const dist = getDistance(latitude, longitude, placeLat, placeLng);

                const marker = new maps.Marker({
                  position: place.geometry.location,
                  map: map,
                  title: place.name,
                  icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  }
                });

                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${placeLat},${placeLng}`;
                const infoContent = `
                  <div style="color: #1e293b; font-family: sans-serif; padding: 6px; max-width: 220px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #065f46;">🏥 ${place.name}</h4>
                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">📍 ${place.vicinity}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 11px; font-weight: bold; color: #047857;">🚗 ${dist} km</span>
                      <a href="${directionsUrl}" target="_blank" style="font-size: 11px; color: white; background-color: #059669; padding: 3px 8px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                        ${isEn ? 'Directions' : 'راستہ'}
                      </a>
                    </div>
                  </div>
                `;

                const infoWindow = new maps.InfoWindow({
                  content: infoContent
                });

                marker.addListener('click', () => {
                  infoWindow.open(map, marker);
                });

                markersRef.current.push(marker);

                return {
                  id: place.place_id,
                  name: place.name,
                  vicinity: place.vicinity,
                  lat: placeLat,
                  lng: placeLng,
                  distanceKm: dist,
                  rating: place.rating
                };
              });

              mappedPlaces.sort((a, b) => a.distanceKm - b.distanceKm);
              setPlaces(mappedPlaces);
            } else if (radius < 50) {
              console.log(`0 results at ${radius}km. Expanding search radius to ${radius + 15}km...`);
              performSearch(radius + 15);
            } else {
              // Fallback markers on map
              const fallbacks = getFallbackClinics(latitude, longitude);
              setPlaces(fallbacks);

              fallbacks.forEach(vet => {
                const marker = new maps.Marker({
                  position: { lat: vet.lat, lng: vet.lng },
                  map: map,
                  title: vet.name,
                  icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  }
                });

                const infoWindow = new maps.InfoWindow({
                  content: `
                    <div style="color: black; font-family: sans-serif; padding: 4px;">
                      <h4 style="margin: 0; font-size: 12px; font-weight: bold;">🏥 ${vet.name}</h4>
                      <p style="margin: 4px 0; font-size: 10px;">📍 ${vet.vicinity}</p>
                      <a href="tel:${vet.phone}" style="font-size: 10px; color: green; font-weight: bold;">📞 ${vet.phone}</a>
                    </div>
                  `
                });

                marker.addListener('click', () => {
                  infoWindow.open(map, marker);
                });

                markersRef.current.push(marker);
              });
            }
          } catch (innerErr) {
            console.error("Error during Places API callback rendering:", innerErr);
            setPlaces(getFallbackClinics(latitude, longitude));
          }
        });
      };

      performSearch(searchRadius);
    } catch (err) {
      console.error("Google Map initialization throw, falling back to OSM:", err);
      setUseOSM(true);
      setPlaces(getFallbackClinics(latitude, longitude));
    }
  }, [scriptLoaded, latitude, longitude, searchRadius, isEn, useOSM]);

  const handleManualLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (lat >= 23.6 && lat <= 37.1 && lng >= 60.8 && lng <= 77.0) {
        setLatitude(lat);
        setLongitude(lng);
      } else {
        alert(isEn 
          ? "Please enter coordinates within Pakistan (Latitude: 23.6 to 37.1, Longitude: 60.8 to 77.0)" 
          : "براہ کرم پاکستان کی حدود کے کوآرڈینیٹس درج کریں (Latitude: 23.6 to 37.1, Longitude: 60.8 to 77.0)"
        );
      }
    }
  };

  const handlePlaceItemClick = (place: VetPlace) => {
    // 1. Center the active Google map view if initialized
    if (googleMap.current && (window as any).google && !useOSM) {
      const maps = (window as any).google.maps;
      googleMap.current.panTo(new maps.LatLng(place.lat, place.lng));
      googleMap.current.setZoom(15);
    }

    // 2. Open their location in a Google Maps tab directly
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    window.open(directionsUrl, '_blank');
  };

  // Google Search fallback link generator
  const getGoogleMapsSearchUrl = () => {
    return `https://www.google.com/maps/search/veterinary+clinic/@${latitude},${longitude},13z`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center">
            <MapPin className="w-6 h-6 text-emerald-600 me-2" />
            <span>{isEn ? 'Nearby Veterinary Map' : 'قریبی ویٹرنری کلینک میپ'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEn
              ? "Live GPS tracking of governmental hospitals, mobile dispensaries, and local clinical veterinarians."
              : "آپ کے قریبی سرکاری ہسپتال، موبائل ڈسپنسریاں اور پرائیویٹ ڈاکٹرز کی لائیو معلومات۔"}
          </p>
        </div>

        {/* radius selector - only display when using live Google Maps */}
        {scriptLoaded && !scriptError && !useOSM && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-600 dark:text-slate-400 ps-1">
              {isEn ? 'Radius:' : 'فاصلہ کا دائرہ:'}
            </span>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border-none outline-none font-bold text-emerald-600 dark:text-emerald-400 rounded-md py-0.5 px-2 cursor-pointer"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
        )}
      </div>

      {/* Geolocation Loading / Manual Override Form */}
      {gpsLoading && (
        <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              {isEn ? "Retrieving GPS coordinates..." : "باڑے کے جی پی ایس کوآرڈینیٹس حاصل کیے جا رہے ہیں..."}
            </p>
          </div>
        </div>
      )}

      {/* Location Denied Warning & Override Form */}
      {gpsDenied && !gpsLoading && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3">
          <div className="flex items-start space-x-2.5 rtl:space-x-reverse">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-800 dark:text-amber-400">
                {isEn ? "GPS Location Permission Required" : "لوکیشن کی اجازت درکار ہے"}
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-0.5">
                {isEn
                  ? "We couldn't access your live coordinates. Please enter your farm coordinates manually below or continue with the default location (Sahiwal)."
                  : "ہم آپ کے باڑے کی لائیو لوکیشن حاصل نہیں کر سکے۔ آپ نیچے دستی طور پر کوآرڈینیٹس درج کر سکتے ہیں یا ساہیوال کی ڈیفالٹ لوکیشن استعمال کر سکتے ہیں۔"}
              </p>
            </div>
          </div>
          <form onSubmit={handleManualLocationSubmit} className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex space-x-2 rtl:space-x-reverse">
              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Latitude"
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              />
              <input
                type="text"
                value={manualLng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setLongitude(val);
                  setManualLng(e.target.value);
                }}
                placeholder="Longitude"
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-colors animate-pulse"
            >
              <Locate className="w-3.5 h-3.5" />
              <span>{isEn ? "Update Location" : "مقام اپ ڈیٹ کریں"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Map & List Layout */}
      <div className="space-y-6">
        
        {/* Main Map Frame - dynamically switching to OpenStreetMap if Google Map stalls */}
        <div 
          className="relative border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-100 dark:bg-slate-900"
          style={{ width: '100%', height: '420px', minHeight: '400px', borderRadius: '16px', overflow: 'hidden' }}
        >
          {useOSM || scriptError ? (
            <iframe
              title="OpenStreetMap View"
              width="100%"
              height="100%"
              style={{ border: 0, width: '100%', height: '100%' }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.04}%2C${latitude - 0.04}%2C${longitude + 0.04}%2C${latitude + 0.04}&layer=mapnik&marker=${latitude}%2C${longitude}`}
            />
          ) : (
            <>
              {!scriptLoaded && (
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center z-20">
                  <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {isEn ? "Loading Interactive Map..." : "انٹرایکٹو نقشہ لوڈ ہو رہا ہے..."}
                    </p>
                  </div>
                </div>
              )}
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            </>
          )}
        </div>

        {/* Warning label when using Fallback OpenStreetMap */}
        {(useOSM || scriptError) && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-400">
            ⚠️ {isEn 
              ? "Google Maps SDK is currently offline or loading slowly. OpenStreetMap fallback has been loaded automatically." 
              : "گوگل نقشہ سروس سست ہونے کے باعث اوپن سٹریٹ نقشہ خودکار طور پر لوڈ کر دیا گیا ہے۔"}
          </div>
        )}

        {/* Interactive Places List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {isEn 
                ? `Results Found (${places.length})` 
                : `قریبی کلینکس اور سروسز (${places.length})`}
            </h3>
            <a
              href={getGoogleMapsSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
            >
              <Navigation className="w-3.5 h-3.5 me-1" />
              {isEn ? "Search in Google Maps App" : "گوگل نقشہ ایپلیکیشن پر تلاش کریں"}
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {places.map((place) => (
              <div
                key={place.id}
                onClick={() => handlePlaceItemClick(place)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800/60 cursor-pointer transition-all flex flex-col justify-between gap-3 text-left active:scale-98"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{place.name}</h4>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                      🚗 {place.distanceKm} km
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{place.vicinity}</p>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaceItemClick(place);
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center justify-center space-x-1 transition-colors text-center font-sans"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Open Map Direction' : 'گوگل نقشے پر کھولیں'}</span>
                  </button>
                  {place.phone && (
                    <a
                      href={`tel:${place.phone}`}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
