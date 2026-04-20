import { useState } from 'react';
import type { Room } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { useToastStore } from '../../store/useToastStore';

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
      <div className="rb-management-form rb-management-card">
        <div className="rb-management-title">{title}</div>

        <div className="rb-form-grid">
          <div className="rb-form-group">
            <label>Room Name</label>
            <input
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="rb-input"
              placeholder="Conference Room A"
            />
          </div>

          <div className="rb-form-group">
            <label>Capacity</label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(event) => updateField('capacity', event.target.value)}
              className="rb-input"
              placeholder="20"
            />
          </div>

          <div className="rb-form-group full">
            <label>Location</label>
            <input
              value={formData.location}
              onChange={(event) => updateField('location', event.target.value)}
              className="rb-input"
              placeholder="Building A - Floor 2"
            />
          </div>

          <div className="rb-form-group full">
            <label>Amenities (comma-separated)</label>
            <input
              value={formData.amenities}
              onChange={(event) => updateField('amenities', event.target.value)}
              className="rb-input"
              placeholder="Projector, Whiteboard, WiFi"
            />
          </div>
        </div>

        <div className="rb-actions" style={{ marginTop: '1rem' }}>
          <button type="button" onClick={action} disabled={submitting} className="rb-primary-button">
            {submitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : mode === 'create' ? 'Create Room' : 'Save Changes'}
          </button>
          <button type="button" onClick={resetForm} disabled={submitting} className="rb-subtle-button">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="rb-surface rb-management-topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div className="rb-filter-title">Manage Rooms</div>
            <p className="rb-muted">Create, edit, and remove rooms from the booking browser.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              hydrateForm();
              setIsAddingRoom(true);
              setEditingRoomId(null);
            }}
            className="rb-primary-button"
          >
            Add New Room
          </button>
        </div>
      </div>

      {isAddingRoom && renderForm('create')}

      {rooms.length === 0 ? (
        <div className="rb-empty rb-panel">
          <div className="rb-filter-title">No rooms created yet</div>
          <p className="rb-muted">Add your first room to populate the booking browser.</p>
        </div>
      ) : (
        <div className="rb-management-grid">
          {rooms.map((room) => (
            <article key={room.id} className="rb-management-card">
              {editingRoomId === room.id ? (
                renderForm('edit', room.id)
              ) : (
                <>
                  <div className="rb-management-card-header">
                    <div>
                      <h3>{room.name}</h3>
                      <p className="rb-muted" style={{ marginTop: '0.35rem' }}>
                        {room.location || 'Location not listed'}
                      </p>
                    </div>
                    <span className="rb-room-capacity">{room.capacity} seats</span>
                  </div>

                  <div className="rb-tag-row" style={{ marginBottom: '1rem' }}>
                    {(room.amenities || []).map((amenity) => (
                      <span key={amenity} className="rb-tag">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="rb-actions">
                    <button
                      type="button"
                      onClick={() => {
                        hydrateForm(room);
                        setEditingRoomId(room.id);
                        setIsAddingRoom(false);
                      }}
                      className="rb-success-button"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRoom(room)}
                      disabled={submitting}
                      className="rb-danger-button"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
