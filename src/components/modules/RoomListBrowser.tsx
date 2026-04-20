import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Filter, MapPin, Users } from 'lucide-react';
import type { Room } from '../../lib/supabase';
import GlassCard from '../ui/GlassCard';

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

      const matchesCapacity =
        roomCapacity >= minCapacity && roomCapacity <= maxCapacity;
      const matchesLocation =
        locationFilter === 'all' || roomLocation === locationFilter;
      const matchesAmenities = selectedAmenities.every((amenity) =>
        roomAmenities.includes(amenity)
      );

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <GlassCard key={index} className="h-52">
            <div className="shimmer h-full rounded-xl" />
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(16,185,129,0.14)',
              border: '1px solid rgba(16,185,129,0.24)',
            }}
          >
            <Filter size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2
              className="text-white text-lg font-bold"
              style={{ letterSpacing: '-0.03em' }}
            >
              Available Rooms
            </h2>
            <p className="text-white/45 text-sm">
              Filter by capacity, location, and amenities before picking a room.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,1fr,auto] gap-4">
          <div className="space-y-2" ref={capacityPanelRef}>
            <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">
              Capacity Range
            </span>
            <button
              type="button"
              onClick={() => setShowCapacityPanel((current) => !current)}
              className="w-full rounded-2xl px-4 py-4 text-left text-sm text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {`Capacity: ${minCapacity} - ${maxCapacity}`}
            </button>

            {showCapacityPanel && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-center justify-between text-white/55 text-sm mb-3">
                  <span>Min: {minCapacity}</span>
                  <span>Max: {maxCapacity}</span>
                </div>
                <div className="space-y-3">
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
                    className="w-full"
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
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <label className="space-y-2">
            <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">
              Location
            </span>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="w-full rounded-2xl px-4 py-4 text-sm text-white outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <option value="all">All locations</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl px-5 py-4 text-sm font-semibold self-end"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            Clear Filters
          </button>
        </div>

        {availableAmenities.length > 0 && (
          <div className="mt-5">
            <p className="text-white/50 text-xs font-medium uppercase tracking-[0.18em] mb-3">
              Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {availableAmenities.map((amenity) => {
                const isActive = selectedAmenities.includes(amenity);

                return (
                  <label
                    key={amenity}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                    style={{
                      background: isActive
                        ? 'rgba(16,185,129,0.18)'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${
                        isActive
                          ? 'rgba(16,185,129,0.28)'
                          : 'rgba(255,255,255,0.07)'
                      }`,
                      color: isActive ? '#6ee7b7' : 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="sr-only"
                    />
                    <span>{amenity}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredRooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35 }}
          >
            <GlassCard className="h-full">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p
                    className="text-white text-lg font-bold"
                    style={{ letterSpacing: '-0.03em' }}
                  >
                    {room.name}
                  </p>
                  <div className="flex items-center gap-2 text-white/45 text-sm mt-2">
                    <MapPin size={14} />
                    {room.location || 'Location not listed'}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(14,165,233,0.14)',
                    border: '1px solid rgba(14,165,233,0.24)',
                    color: '#7dd3fc',
                  }}
                >
                  <Users size={12} />
                  {room.capacity}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-white/62">
                  <Building2 size={15} className="text-white/35 mt-0.5" />
                  <div>
                    <p className="text-white/35 text-xs uppercase tracking-[0.18em] mb-1">
                      Amenities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(room.amenities || []).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRoom(room)}
                className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(14,165,233,0.92), rgba(2,132,199,0.86))',
                  color: '#eff6ff',
                }}
              >
                Book Room →
              </button>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {rooms.length === 0 && (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">No rooms available</p>
        </GlassCard>
      )}

      {rooms.length > 0 && filteredRooms.length === 0 && (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">
            No rooms match your selected filters
          </p>
          <p className="text-white/45 text-sm mt-2">
            Try widening the capacity range or clearing one of the filters.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
