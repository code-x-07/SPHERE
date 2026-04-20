import { useEffect, useMemo, useRef, useState } from 'react';
import type { Room } from '../../lib/supabase';

interface RoomListBrowserProps {
  rooms: Room[];
  loading: boolean;
  templateOnly: boolean;
  onSelectRoom: (room: Room) => void;
}

export default function RoomListBrowser({
  rooms,
  loading,
  templateOnly,
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

  function handleAmenityToggle(amenity: string) {
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
    <div className="room-list-container">
      <h2>Available Rooms</h2>

      {templateOnly && (
        <div className="info-message">
          Reference rooms are visible, but some are not in Supabase yet. Run the seed SQL once to
          make every room fully bookable.
        </div>
      )}

      <div className="room-filters">
        <div className="filters-row">
          <div className="filter-group capacity-filter-popover" ref={capacityPanelRef}>
            <label htmlFor="room-capacity-filter">Capacity Range</label>
            <button
              id="room-capacity-filter"
              type="button"
              className="capacity-toggle-button"
              aria-expanded={showCapacityPanel}
              onClick={() => setShowCapacityPanel((current) => !current)}
            >
              {`Capacity: ${minCapacity} - ${maxCapacity}`}
            </button>

            {showCapacityPanel && (
              <div className="capacity-dropdown-panel">
                <div className="capacity-values">
                  <span>Min: {minCapacity}</span>
                  <span>Max: {maxCapacity}</span>
                </div>

                <div className="capacity-sliders">
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

          <div className="filter-group">
            <label htmlFor="location-filter">Location</label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
            >
              <option value="all">All locations</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="clear-filters-button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {availableAmenities.length > 0 && (
          <div className="amenities-filter-group">
            <p className="amenities-filter-title">Amenities</p>
            <div className="amenities-filter-options">
              {availableAmenities.map((amenity) => (
                <label key={amenity} className="amenity-filter-option">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading rooms...</div>
      ) : (
        <>
          <div className="room-grid">
            {filteredRooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-card-header">
                  <h3>{room.name}</h3>
                  <span className="capacity-badge">👥 {room.capacity}</span>
                </div>

                <div className="room-card-body">
                  <p>
                    <strong>📍 Location:</strong> {room.location || 'N/A'}
                  </p>

                  {!!room.amenities?.length && (
                    <div className="amenities">
                      <strong>Amenities:</strong>
                      <div className="amenity-tags">
                        {room.amenities.map((amenity) => (
                          <span key={amenity} className="amenity-tag">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="room-card-button"
                  onClick={() => onSelectRoom(room)}
                >
                  Book Room →
                </button>
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="no-rooms">
              <p>No rooms available</p>
            </div>
          )}

          {rooms.length > 0 && filteredRooms.length === 0 && (
            <div className="no-rooms">
              <p>No rooms match your selected filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
