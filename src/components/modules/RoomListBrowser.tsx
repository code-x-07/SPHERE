import { useEffect, useMemo, useRef, useState } from 'react';
import type { Room } from '../../lib/supabase';

interface RoomListBrowserProps {
  rooms: Room[];
  loading: boolean;
  onSelectRoom: (room: Room) => void;
}

export default function RoomListBrowser({
  rooms,
  loading,
  onSelectRoom,
}: RoomListBrowserProps) {
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(0);
  const [showCapacityPanel, setShowCapacityPanel] = useState(false);
  const capacityPanelRef = useRef<HTMLDivElement>(null);

  const capacityBounds = useMemo(() => {
    const capacities = rooms
      .map((room) => Number(room.capacity))
      .filter((capacity) => Number.isFinite(capacity) && capacity > 0);

    if (capacities.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...capacities),
      max: Math.max(...capacities),
    };
  }, [rooms]);

  useEffect(() => {
    setMinCapacity(capacityBounds.min);
    setMaxCapacity(capacityBounds.max);
  }, [capacityBounds.min, capacityBounds.max]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        capacityPanelRef.current &&
        !capacityPanelRef.current.contains(event.target as Node)
      ) {
        setShowCapacityPanel(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const availableAmenities = useMemo(() => {
    const allAmenities = rooms.flatMap((room) => room.amenities || []);
    return [...new Set(allAmenities)].sort((a, b) => a.localeCompare(b));
  }, [rooms]);

  const availableLocations = useMemo(() => {
    const allLocations = rooms
      .map((room) => (room.location || '').trim())
      .filter((location) => location.length > 0);

    return [...new Set(allLocations)].sort((a, b) => a.localeCompare(b));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const roomCapacity = Number(room.capacity) || 0;
      const roomLocation = (room.location || '').trim();
      const roomAmenities = room.amenities || [];

      const matchesCapacity = roomCapacity >= minCapacity && roomCapacity <= maxCapacity;
      const matchesLocation = locationFilter === 'all' || roomLocation === locationFilter;
      const matchesAmenities = selectedAmenities.every((amenity) => roomAmenities.includes(amenity));

      return matchesCapacity && matchesLocation && matchesAmenities;
    });
  }, [rooms, minCapacity, maxCapacity, locationFilter, selectedAmenities]);

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );
  }

  function clearFilters() {
    setMinCapacity(capacityBounds.min);
    setMaxCapacity(capacityBounds.max);
    setLocationFilter('all');
    setSelectedAmenities([]);
    setShowCapacityPanel(false);
  }

  return (
    <div>
      <div className="rb-filter-card">
        <div className="rb-filter-title">Available Rooms</div>

        <div className="rb-filter-grid">
          <div className="rb-form-group rb-capacity-wrap" ref={capacityPanelRef}>
            <label>Capacity Range</label>
            <button
              type="button"
              onClick={() => setShowCapacityPanel((current) => !current)}
              className="rb-capacity-toggle"
            >
              {`Capacity: ${minCapacity} - ${maxCapacity}`}
            </button>

            {showCapacityPanel && (
              <div className="rb-capacity-panel">
                <div className="rb-capacity-values">
                  <span>Min: {minCapacity}</span>
                  <span>Max: {maxCapacity}</span>
                </div>
                <div className="rb-slider-stack">
                  <input
                    type="range"
                    min={capacityBounds.min}
                    max={capacityBounds.max}
                    value={minCapacity}
                    disabled={capacityBounds.min === capacityBounds.max}
                    onChange={(event) => {
                      const nextMin = Number(event.target.value);
                      setMinCapacity(Math.min(nextMin, maxCapacity));
                    }}
                  />
                  <input
                    type="range"
                    min={capacityBounds.min}
                    max={capacityBounds.max}
                    value={maxCapacity}
                    disabled={capacityBounds.min === capacityBounds.max}
                    onChange={(event) => {
                      const nextMax = Number(event.target.value);
                      setMaxCapacity(Math.max(nextMax, minCapacity));
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rb-form-group">
            <label>Location</label>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="rb-select"
            >
              <option value="all">All locations</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <button type="button" onClick={clearFilters} className="rb-subtle-button">
            Clear Filters
          </button>
        </div>

        {availableAmenities.length > 0 && (
          <div>
            <div className="rb-field-label" style={{ marginTop: '0.95rem' }}>
              Amenities
            </div>
            <div className="rb-chip-row">
              {availableAmenities.map((amenity) => {
                const isActive = selectedAmenities.includes(amenity);
                return (
                  <label key={amenity} className={`rb-chip ${isActive ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rb-loading-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rb-shimmer" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="rb-empty rb-panel">
          <div className="rb-filter-title">No rooms available</div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rb-empty rb-panel">
          <div className="rb-filter-title">No rooms match your selected filters</div>
          <p className="rb-muted">Try widening the capacity range or clearing one of the filters.</p>
        </div>
      ) : (
        <div className="rb-room-grid">
          {filteredRooms.map((room) => (
            <article key={room.id} className="rb-room-card">
              <div className="rb-room-card-header">
                <h3>{room.name}</h3>
                <span className="rb-room-capacity">{room.capacity} seats</span>
              </div>

              <div className="rb-room-card-body">
                <p className="rb-muted">{room.location || 'Location not listed'}</p>

                <div className="rb-meta">
                  <strong>Amenities</strong>
                  <div className="rb-tag-row">
                    {(room.amenities || []).map((amenity) => (
                      <span key={amenity} className="rb-tag">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRoom(room)}
                  className="rb-primary-button"
                >
                  Book Room →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
