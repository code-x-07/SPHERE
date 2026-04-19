import { useEffect, useState } from 'react';
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

  const capacities = rooms
    .map((room) => Number(room.capacity))
    .filter((value) => Number.isFinite(value) && value > 0);
  const minimumCapacity = capacities.length > 0 ? Math.min(...capacities) : 0;
  const maximumCapacity = capacities.length > 0 ? Math.max(...capacities) : 0;

  useEffect(() => {
    setMinCapacity(minimumCapacity);
    setMaxCapacity(maximumCapacity);
  }, [minimumCapacity, maximumCapacity]);

  const allAmenities = Array.from(
    new Set(rooms.flatMap((room) => room.amenities || []))
  ).sort((left, right) => left.localeCompare(right));

  const allLocations = Array.from(
    new Set(
      rooms
        .map((room) => room.location.trim())
        .filter((location) => location.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

  const filteredRooms = rooms.filter((room) => {
    const capacity = Number(room.capacity) || 0;
    const matchesCapacity = capacity >= minCapacity && capacity <= maxCapacity;
    const matchesLocation = locationFilter === 'all' || room.location.trim() === locationFilter;
    const matchesAmenities = selectedAmenities.every((amenity) => room.amenities.includes(amenity));

    return matchesCapacity && matchesLocation && matchesAmenities;
  });

  function clearFilters() {
    setLocationFilter('all');
    setSelectedAmenities([]);
    setMinCapacity(minimumCapacity);
    setMaxCapacity(maximumCapacity);
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );
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
            style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.24)' }}
          >
            <Filter size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
              Browse Rooms
            </h2>
            <p className="text-white/45 text-sm">
              Match by capacity, location, and amenities before picking a slot.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,1fr,auto] gap-4">
          <label className="space-y-2">
            <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">
              Capacity Range
            </span>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between text-white/55 text-sm mb-3">
                <span>{minCapacity}</span>
                <span>{maxCapacity}</span>
              </div>
              <div className="space-y-3">
                <input
                  type="range"
                  min={minimumCapacity}
                  max={maximumCapacity}
                  value={minCapacity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setMinCapacity(Math.min(value, maxCapacity));
                  }}
                  className="w-full"
                />
                <input
                  type="range"
                  min={minimumCapacity}
                  max={maximumCapacity}
                  value={maxCapacity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setMaxCapacity(Math.max(value, minCapacity));
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </label>

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
              {allLocations.map((location) => (
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

        {allAmenities.length > 0 && (
          <div className="mt-5">
            <p className="text-white/50 text-xs font-medium uppercase tracking-[0.18em] mb-3">
              Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {allAmenities.map((amenity) => {
                const isActive = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className="px-3 py-2 rounded-full text-xs font-semibold transition-colors"
                    style={{
                      background: isActive ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)'}`,
                      color: isActive ? '#6ee7b7' : 'rgba(255,255,255,0.65)',
                    }}
                  >
                    {amenity}
                  </button>
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
                  <p className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
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
                    <p className="text-white/35 text-xs uppercase tracking-[0.18em] mb-1">Amenities</p>
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
                className="w-full mt-6 rounded-2xl px-4 py-3 text-sm font-semibold transition-transform active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.85))',
                  color: '#f0fdf4',
                }}
              >
                Book Room
              </button>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {rooms.length > 0 && filteredRooms.length === 0 && (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">No rooms match those filters</p>
          <p className="text-white/45 text-sm mt-2">
            Try widening the capacity range or clearing one of the amenity filters.
          </p>
        </GlassCard>
      )}

      {rooms.length === 0 && (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">No rooms available yet</p>
          <p className="text-white/45 text-sm mt-2">
            Add room records in Supabase to populate this browser.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
