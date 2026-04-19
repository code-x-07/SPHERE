import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase, type Room } from '../../lib/supabase';
import { useToastStore } from '../../store/useToastStore';
import GlassCard from '../ui/GlassCard';

interface RoomManagementPanelProps {
  rooms: Room[];
  onRoomsChanged: () => Promise<void>;
}

interface RoomFormState {
  name: string;
  capacity: string;
  location: string;
  amenities: string;
}

const EMPTY_FORM: RoomFormState = {
  name: '',
  capacity: '',
  location: '',
  amenities: '',
};

export default function RoomManagementPanel({
  rooms,
  onRoomsChanged,
}: RoomManagementPanelProps) {
  const { addToast } = useToastStore();
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [formData, setFormData] = useState<RoomFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function hydrateForm(room?: Room) {
    if (!room) {
      setFormData(EMPTY_FORM);
      return;
    }

    setFormData({
      name: room.name,
      capacity: String(room.capacity),
      location: room.location || '',
      amenities: (room.amenities || []).join(', '),
    });
  }

  function updateField<K extends keyof RoomFormState>(key: K, value: RoomFormState[K]) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function parseAmenities() {
    return formData.amenities
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  function resetForm() {
    setEditingRoomId(null);
    setIsAddingRoom(false);
    setFormData(EMPTY_FORM);
  }

  function validateForm() {
    if (!formData.name.trim()) {
      addToast({ type: 'error', title: 'Room name required' });
      return false;
    }

    if (!formData.capacity || Number(formData.capacity) <= 0) {
      addToast({ type: 'error', title: 'Capacity must be greater than 0' });
      return false;
    }

    return true;
  }

  async function createRoom() {
    if (!validateForm()) return;

    setSubmitting(true);
    const { error } = await supabase.from('rooms').insert({
      name: formData.name.trim(),
      capacity: Number(formData.capacity),
      location: formData.location.trim(),
      amenities: parseAmenities(),
      available: true,
    });
    setSubmitting(false);

    if (error) {
      addToast({ type: 'error', title: 'Failed to create room', message: error.message });
      return;
    }

    addToast({ type: 'success', title: 'Room created' });
    resetForm();
    await onRoomsChanged();
  }

  async function saveRoom(roomId: string) {
    if (!validateForm()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('rooms')
      .update({
        name: formData.name.trim(),
        capacity: Number(formData.capacity),
        location: formData.location.trim(),
        amenities: parseAmenities(),
      })
      .eq('id', roomId);
    setSubmitting(false);

    if (error) {
      addToast({ type: 'error', title: 'Failed to update room', message: error.message });
      return;
    }

    addToast({ type: 'success', title: 'Room updated' });
    resetForm();
    await onRoomsChanged();
  }

  async function deleteRoom(room: Room) {
    const confirmed = window.confirm(
      `Delete ${room.name}? Associated bookings for this room may also be affected.`
    );
    if (!confirmed) return;

    setSubmitting(true);
    const { error } = await supabase.from('rooms').delete().eq('id', room.id);
    setSubmitting(false);

    if (error) {
      addToast({ type: 'error', title: 'Failed to delete room', message: error.message });
      return;
    }

    addToast({ type: 'success', title: 'Room deleted' });
    resetForm();
    await onRoomsChanged();
  }

  function renderForm(mode: 'create' | 'edit', roomId?: string) {
    const title = mode === 'create' ? 'Create New Room' : 'Edit Room';
    const action = mode === 'create' ? createRoom : () => saveRoom(roomId!);

    return (
      <GlassCard>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
              {title}
            </p>
            <p className="text-white/45 text-sm">
              Match the room browser with accurate names, locations, and amenities.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X size={15} className="text-white/65" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">Room Name</span>
            <input
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-2xl px-4 py-3 mt-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              placeholder="e.g. Conference Room A"
            />
          </label>

          <label className="block">
            <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">Capacity</span>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(event) => updateField('capacity', event.target.value)}
              className="w-full rounded-2xl px-4 py-3 mt-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              placeholder="20"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">Location</span>
            <input
              value={formData.location}
              onChange={(event) => updateField('location', event.target.value)}
              className="w-full rounded-2xl px-4 py-3 mt-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              placeholder="e.g. Building A - Floor 2"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-white/50 text-xs font-medium uppercase tracking-[0.18em]">Amenities</span>
            <input
              value={formData.amenities}
              onChange={(event) => updateField('amenities', event.target.value)}
              className="w-full rounded-2xl px-4 py-3 mt-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              placeholder="Projector, Whiteboard, WiFi"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={action}
            disabled={submitting}
            className="rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.94), rgba(5,150,105,0.86))',
              color: '#f0fdf4',
            }}
          >
            {submitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : mode === 'create' ? 'Create Room' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.76)',
            }}
          >
            Cancel
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white text-lg font-bold" style={{ letterSpacing: '-0.03em' }}>
              Manage Rooms
            </p>
            <p className="text-white/45 text-sm">
              Create, edit, and retire rooms that appear in the booking browser.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              hydrateForm();
              setIsAddingRoom(true);
              setEditingRoomId(null);
            }}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.92), rgba(2,132,199,0.86))',
              color: '#eff6ff',
            }}
          >
            <Plus size={15} />
            Add New Room
          </button>
        </div>
      </GlassCard>

      {isAddingRoom && renderForm('create')}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className="space-y-4">
            {editingRoomId === room.id ? (
              renderForm('edit', room.id)
            ) : (
              <GlassCard className="h-full">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-white text-lg font-semibold">{room.name}</p>
                    <p className="text-white/45 text-sm mt-2">{room.location || 'Location not listed'}</p>
                  </div>
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: 'rgba(14,165,233,0.14)',
                      border: '1px solid rgba(14,165,233,0.22)',
                      color: '#7dd3fc',
                    }}
                  >
                    {room.capacity} seats
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(room.amenities || []).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.72)',
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      hydrateForm(room);
                      setEditingRoomId(room.id);
                      setIsAddingRoom(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold flex-1"
                    style={{
                      background: 'rgba(16,185,129,0.14)',
                      border: '1px solid rgba(16,185,129,0.22)',
                      color: '#6ee7b7',
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRoom(room)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold flex-1"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#fca5a5',
                    }}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <GlassCard className="text-center py-12">
          <p className="text-white text-lg font-semibold">No rooms created yet</p>
          <p className="text-white/45 text-sm mt-2">
            Add your first room to populate the booking browser.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
