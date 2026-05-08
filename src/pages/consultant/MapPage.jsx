import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { MAP, CONSULTANT } from "../../services/api";
import "../css/MapPage.css";
import { useLocation } from "react-router-dom";

const GOOGLE_MAPS_KEY = "AIzaSyBS1RnxakpD9SbGCLBcz4MtRTT9yLoUBKQ";

const CITY_CENTERS = {
    TUNIS: { lat: 36.8065, lng: 10.1815 },
    SOUSSE: { lat: 35.8256, lng: 10.6369 },
    KAIROUAN: { lat: 35.6784, lng: 10.0963 },
    MONASTIR: { lat: 35.7643, lng: 10.8113 },
    SFAX: { lat: 34.7406, lng: 10.7603 },
};

const CITIES = Object.keys(CITY_CENTERS);

const STATUS_COLORS = {
    NEW: "#005fa3",
    IN_PROGRESS: "#b45309",
    RESOLVED: "#16a34a",
    CLOSED: "#999",
};

const PRIORITY_COLORS = {
    LOW: "#16a34a",
    MEDIUM: "#005fa3",
    HIGH: "#b45309",
    CRITICAL: "#c0392b",
};

const ACTION_LABELS = {
    TECHNICIAN_GOING_TO_SITE: "Going to site",
    TECHNICIAN_AT_SITE: "At site",
    TECHNICIAN_GETTING_RESOURCES: "Getting resources",
    TECHNICIAN_FIXING_ISSUE: "Fixing issue",
    ISSUE_RESOLVED: "Issue resolved",
    WAITING_FOR_PARTS: "Waiting for parts",
};

const TYPE_COLORS = {
    STOCK: "#005fa3",
    OFFICE: "#7c3aed",
    HQ: "#c0392b",
    CITY_CENTER: "#64748b",
};

function loadGoogleMaps(apiKey) {
    return new Promise((resolve) => {
        if (window.google?.maps) { resolve(); return; }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

function formatLabel(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function MapPage() {
    const { authFetch } = useAuth();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({ locations: [], technicians: [], demandes: [] });
    const routeRef = useRef(null);
    const infoWindow = useRef(null);
    const location = useLocation();
    const [city, setCity] = useState(null);

    const [layers, setLayers] = useState({
        locations: true,
        technicians: true,
        demandes: true,
    });

    const [data, setData] = useState({
        locations: [], technicians: [], demandes: []
    });

    const [loading, setLoading] = useState(true);
    const [selectedDemande, setSelected] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [search, setSearch] = useState("");

    const toggleLayer = (key) => setLayers(l => ({ ...l, [key]: !l[key] }));

    const load = useCallback(async () => {
        try {
            const params = city ? `?city=${city}` : "";
            const [locations, technicians, demandes] = await Promise.all([
                authFetch(`${MAP.locations}${params}`),
                authFetch(`${MAP.technicians}${params}`),
                authFetch(`${MAP.demandes}${params}`),
            ]);
            setData({ locations, technicians, demandes });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [city, authFetch]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const demandeId = params.get("demande");
        if (!demandeId) return;

        authFetch(CONSULTANT.demandeById(demandeId))
            .then(demande => {
                setSelected(demande);
                if (
                    demande.latitude &&
                    demande.longitude &&
                    mapInstance.current
                ) {
                    mapInstance.current.panTo({
                        lat: demande.latitude,
                        lng: demande.longitude
                    });
                    mapInstance.current.setZoom(15);
                }

            })
            .catch(console.error);
    }, [location.search, authFetch]);

    useEffect(() => {
        loadGoogleMaps(GOOGLE_MAPS_KEY).then(() => {
            const center = city ? CITY_CENTERS[city] : { lat: 33.8869, lng: 9.5375 };
            mapInstance.current = new window.google.maps.Map(mapRef.current, {
                center,
                zoom: city ? 12 : 7,
                mapTypeId: "roadmap",
                styles: [
                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", stylers: [{ visibility: "off" }] },
                ],
            });
            infoWindow.current = new window.google.maps.InfoWindow();
        });
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        const id = setInterval(async () => {
            try {
                const params = city ? `?city=${city}` : "";
                const technicians = await authFetch(`${MAP.technicians}${params}`);
                setData(d => ({ ...d, technicians }));
            } catch (e) { console.error(e); }
        }, 5000);
        return () => clearInterval(id);
    }, [city, authFetch]);

    useEffect(() => {
        if (!mapInstance.current) return;
        if (city) {
            mapInstance.current.setCenter(CITY_CENTERS[city]);
            mapInstance.current.setZoom(12);
        } else {
            mapInstance.current.setCenter({ lat: 33.8869, lng: 9.5375 });
            mapInstance.current.setZoom(7);
        }
    }, [city]);

    useEffect(() => {
        if (!selectedDemande) { setTimeline([]); return; }
        authFetch(CONSULTANT.demandeTimeline(selectedDemande.id))
            .then(setTimeline).catch(console.error);
    }, [selectedDemande]);

    useEffect(() => {
        if (!mapInstance.current || !window.google) return;
        if (routeRef.current) { routeRef.current.setMap(null); routeRef.current = null; }
        if (!selectedDemande) return;

        const latestAction = selectedDemande.latestAction;
        if (latestAction !== "TECHNICIAN_GOING_TO_SITE") return;

        const tech = data.technicians.find(t =>
            t.username === selectedDemande.technicianUsername);
        if (!tech) return;

        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
            map: mapInstance.current,
            suppressMarkers: true,
            polylineOptions: { strokeColor: "#005fa3", strokeWeight: 4, strokeOpacity: 0.8 },
        });

        directionsService.route({
            origin: { lat: tech.latitude, lng: tech.longitude },
            destination: { lat: selectedDemande.latitude, lng: selectedDemande.longitude },
            travelMode: window.google.maps.TravelMode.DRIVING,
        }, (result, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(result);
                routeRef.current = directionsRenderer;
            }
        });
    }, [selectedDemande, data.technicians]);

    useEffect(() => {
        if (!mapInstance.current || !window.google) return;

        Object.values(markersRef.current).flat().forEach(m => m.setMap(null));
        markersRef.current = { locations: [], technicians: [], demandes: [] };

        if (layers.locations) {
            markersRef.current.locations = data.locations
                .filter(l => l.type !== "CITY_CENTER")
                .map(l => {
                    const color = TYPE_COLORS[l.type] || "#005fa3";

                    const iconPath = {
                        STOCK: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z",
                        HQ: "M12 1L9 9H1L7.5 14L5 22L12 17L19 22L16.5 14L23 9H15Z",
                        OFFICE: "M3 3h18v18H3z",
                    }[l.type] || window.google.maps.SymbolPath.CIRCLE;

                    const isPath = typeof iconPath === "string";

                    const marker = new window.google.maps.Marker({
                        position: { lat: l.latitude, lng: l.longitude },
                        map: mapInstance.current,
                        title: l.name,
                        icon: isPath ? {
                            path: iconPath,
                            fillColor: color,
                            fillOpacity: 1,
                            strokeColor: "#fff",
                            strokeWeight: 1.5,
                            scale: 1,
                            anchor: new window.google.maps.Point(12, 12),
                        } : {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 9,
                            fillColor: color,
                            fillOpacity: 1,
                            strokeColor: "#fff",
                            strokeWeight: 2,
                        },
                    });
                    marker.addListener("click", () => {
                        infoWindow.current.setContent(`
          <div style="font-family:Inter,sans-serif;padding:4px 8px">
            <strong>${l.name}</strong><br/>
            <span style="font-size:11px;color:${color};font-weight:600">${l.type}</span><br/>
            <span style="color:#7a96b0;font-size:12px">${l.description || ""}</span>
          </div>
        `);
                        infoWindow.current.open(mapInstance.current, marker);
                    });
                    return marker;
                });
        }

        // technician markers
        if (layers.technicians) {
            markersRef.current.technicians = data.technicians.map(t => {
                const marker = new window.google.maps.Marker({
                    position: { lat: t.latitude, lng: t.longitude },
                    map: mapInstance.current,
                    title: t.username,
                    icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: "#16a34a",
                        fillOpacity: 1,
                        strokeColor: "#fff",
                        strokeWeight: 2,
                    },
                });
                marker.addListener("click", () => {
                    infoWindow.current.setContent(`
            <div style="font-family:Inter,sans-serif;padding:4px 8px">
              <strong>${t.username}</strong>
              <span style="color:#16a34a;font-size:11px;font-weight:600;margin-left:6px">TECHNICIAN</span><br/>
              <span style="font-size:11px;color:#7a96b0">${t.city || "Unknown city"}</span>
            </div>
          `);
                    infoWindow.current.open(mapInstance.current, marker);
                });
                return marker;
            });
        }

        // demande markers
        if (layers.demandes) {
            markersRef.current.demandes = data.demandes.map(d => {
                const color = STATUS_COLORS[d.status] || "#999";
                // warning triangle path
                const marker = new window.google.maps.Marker({
                    position: { lat: d.latitude, lng: d.longitude },
                    map: mapInstance.current,
                    title: d.title,
                    icon: {
                        path: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
                        fillColor: color,
                        fillOpacity: 1,
                        strokeColor: "#fff",
                        strokeWeight: 1,
                        scale: 1.3,
                        anchor: new window.google.maps.Point(12, 20),
                    },
                });
                marker.addListener("click", () => {
                    setSelected(d);
                    mapInstance.current.panTo({ lat: d.latitude, lng: d.longitude });
                });
                return marker;
            });
        }

    }, [data, layers]);

    const ongoingDemandes = data.demandes.filter(d => d.status === "IN_PROGRESS");
    const filteredOngoing = ongoingDemandes.filter(d =>
        !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.clientName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="map-page">
            <div className="map-toolbar">
                <div className="map-toolbar-left">
                    <span className="map-title">Map</span>
                    <select
                        className="city-select"
                        value={city || ""}
                        onChange={e => setCity(e.target.value || null)}
                    >
                        <option value="">All Cities</option>
                        {CITIES.map(c => (
                            <option key={c} value={c}>{formatLabel(c)}</option>
                        ))}
                    </select>
                </div>

                <div className="map-layers">
                    {[
                        { key: "locations", label: "Locations", color: "#005fa3" },
                        { key: "technicians", label: "Technicians", color: "#16a34a" },
                        { key: "demandes", label: "Demandes", color: "#b45309" },
                    ].map(l => (
                        <label key={l.key} className="layer-toggle">
                            <input
                                type="checkbox"
                                checked={layers[l.key]}
                                onChange={() => toggleLayer(l.key)}
                            />
                            <span className="layer-dot" style={{ background: l.color }} />
                            <span>{l.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="map-body">
                {/* Left panel */}
                <div className="map-left-panel">
                    <div className="mlp-search">
                        <img src="/assets/icons/traffic.svg" alt="" className="mlp-search-icon" />
                        <input
                            placeholder="Search ongoing demandes..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="mlp-section-label">
                        Ongoing ({filteredOngoing.length})
                    </div>

                    <div className="mlp-list">
                        {filteredOngoing.length === 0 ? (
                            <div className="mlp-empty">No ongoing demandes</div>
                        ) : (
                            filteredOngoing.map(d => (
                                <div
                                    key={d.id}
                                    className={`mlp-card ${selectedDemande?.id === d.id ? "active" : ""}`}
                                    onClick={() => setSelected(selectedDemande?.id === d.id ? null : d)}
                                >
                                    <div className="mlp-card-top">
                                        <span className="mlp-card-id">#{d.id}</span>
                                        <span className="mlp-card-priority"
                                            style={{ color: PRIORITY_COLORS[d.priority] }}>
                                            {formatLabel(d.priority)}
                                        </span>
                                    </div>
                                    <div className="mlp-card-title">{d.title}</div>
                                    <div className="mlp-card-client">{d.clientName}</div>
                                    {d.latestAction && (
                                        <div className="mlp-card-action">
                                            {ACTION_LABELS[d.latestAction] || d.latestAction}
                                        </div>
                                    )}
                                    {d.technicianUsername && (
                                        <div className="mlp-card-tech">👷 {d.technicianUsername}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Detail panel */}
                    {selectedDemande && (
                        <div className="mlp-detail">
                            <div className="mlp-detail-header">
                                <span>#{selectedDemande.id} — {selectedDemande.title}</span>
                                <button onClick={() => setSelected(null)}>
                                    <img src="/assets/icons/close.svg" alt="close" style={{ width: 12, height: 12 }} />
                                </button>
                            </div>

                            <div className="mlp-detail-body">
                                <div className="mlp-detail-row">
                                    <span className="mlp-detail-label">Client</span>
                                    <span>{selectedDemande.clientName}</span>
                                </div>
                                <div className="mlp-detail-row">
                                    <span className="mlp-detail-label">Location</span>
                                    <span>{selectedDemande.clientLocation || "—"}</span>
                                </div>
                                <div className="mlp-detail-row">
                                    <span className="mlp-detail-label">Status</span>
                                    <span className="mlp-badge"
                                        style={{
                                            background: STATUS_COLORS[selectedDemande.status] + "22",
                                            color: STATUS_COLORS[selectedDemande.status]
                                        }}>
                                        {formatLabel(selectedDemande.status)}
                                    </span>
                                </div>
                                <div className="mlp-detail-row">
                                    <span className="mlp-detail-label">Priority</span>
                                    <span className="mlp-badge"
                                        style={{
                                            background: PRIORITY_COLORS[selectedDemande.priority] + "22",
                                            color: PRIORITY_COLORS[selectedDemande.priority]
                                        }}>
                                        {formatLabel(selectedDemande.priority)}
                                    </span>
                                </div>
                                <div className="mlp-detail-row">
                                    <span className="mlp-detail-label">Technician</span>
                                    <span>{selectedDemande.technicianUsername || "Unassigned"}</span>
                                </div>
                                {selectedDemande.latestAction && (
                                    <div className="mlp-detail-row">
                                        <span className="mlp-detail-label">Current action</span>
                                        <span className="mlp-action-badge">
                                            {ACTION_LABELS[selectedDemande.latestAction]}
                                        </span>
                                    </div>
                                )}

                                {/* Timeline */}
                                {timeline.length > 0 && (
                                    <div className="mlp-timeline">
                                        <div className="mlp-timeline-label">Timeline</div>
                                        {timeline.map((t, i) => (
                                            <div key={t.id} className="mlp-tl-item">
                                                <div className={`mlp-tl-dot ${i === timeline.length - 1 ? "active" : ""}`} />
                                                <div className="mlp-tl-content">
                                                    <div className="mlp-tl-status">
                                                        {ACTION_LABELS[t.status] || t.status}
                                                    </div>
                                                    {t.note && <div className="mlp-tl-note">{t.note}</div>}
                                                    <div className="mlp-tl-meta">
                                                        {t.performedBy} · {new Date(t.performedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div ref={mapRef} className="map-canvas" />

                {loading && (
                    <div className="map-loading">Loading map data…</div>
                )}
            </div>
        </div>
    );
}