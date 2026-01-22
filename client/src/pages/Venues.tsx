import React, { useState, useEffect } from 'react';
import { venuesApi, isDuplicateVenueError } from '../api/client';
import type { Venue, CreateVenueInput, UpdateVenueInput, VenueType } from '../types';
import { Modal } from '../components/Modal';
import { LoadingSpinner, EmptyState, ConfirmDialog, TypeBadge } from '../components/Common';
import { useToast } from '../components/Toast';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deleteVenue, setDeleteVenue] = useState<Venue | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<VenueType | ''>('');
  const { addToast } = useToast();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const data = await venuesApi.getAll();
      setVenues(data);
    } catch (error) {
      addToast('Failed to load venues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateVenueInput) => {
    try {
      await venuesApi.create(data);
      addToast('Venue created', 'success');
      setIsModalOpen(false);
      fetchVenues();
    } catch (error) {
      if (isDuplicateVenueError(error)) {
        addToast(`Venue "${data.name}" in ${data.town} already exists`, 'warning');
      } else {
        addToast('Failed to create venue', 'error');
      }
    }
  };

  const handleUpdate = async (id: string, data: UpdateVenueInput) => {
    try {
      await venuesApi.update(id, data);
      addToast('Venue updated', 'success');
      setIsModalOpen(false);
      setEditingVenue(null);
      fetchVenues();
    } catch (error) {
      addToast('Failed to update venue', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteVenue) return;
    try {
      await venuesApi.delete(deleteVenue.id);
      addToast('Venue deleted', 'success');
      setDeleteVenue(null);
      fetchVenues();
    } catch (error) {
      addToast('Failed to delete venue', 'error');
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(search.toLowerCase()) ||
      venue.town.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || venue.type === filterType;
    return matchesSearch && matchesType;
  });

  const groupedVenues = filteredVenues.reduce((acc, venue) => {
    const key = venue.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(venue);
    return acc;
  }, {} as Record<VenueType, Venue[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Venues</h1>
          <p className="text-sm text-slate-500">Markets and shows database</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Venue
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues..."
              className="input"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as VenueType | '')}
            className="select sm:w-40"
          >
            <option value="">All Types</option>
            <option value="MARKET">Markets</option>
            <option value="SHOW">Shows</option>
          </select>
        </div>
      </div>

      {/* Venues List */}
      {venues.length === 0 ? (
        <EmptyState
          icon={<MapPinIcon className="w-6 h-6 text-slate-400" />}
          title="No venues yet"
          description="Add your first market or show venue to get started"
          action={
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              Add Venue
            </button>
          }
        />
      ) : filteredVenues.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="w-6 h-6 text-slate-400" />}
          title="No results"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="space-y-6">
          {(['MARKET', 'SHOW'] as const).map((type) => {
            const typeVenues = groupedVenues[type] || [];
            if (typeVenues.length === 0) return null;

            return (
              <div key={type}>
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <TypeBadge type={type} />
                  <span>{type === 'MARKET' ? 'Markets' : 'Shows'}</span>
                  <span className="text-sm font-normal text-slate-500">({typeVenues.length})</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {typeVenues.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      onEdit={() => {
                        setEditingVenue(venue);
                        setIsModalOpen(true);
                      }}
                      onDelete={() => setDeleteVenue(venue)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Venue Modal */}
      <VenueModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVenue(null);
        }}
        venue={editingVenue}
        onSave={(data) => {
          if (editingVenue) {
            handleUpdate(editingVenue.id, data);
          } else {
            handleCreate(data as CreateVenueInput);
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteVenue}
        onClose={() => setDeleteVenue(null)}
        onConfirm={handleDelete}
        title="Delete Venue"
        message={`Are you sure you want to delete "${deleteVenue?.name}"? This will also delete all assignments for this venue.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

// Venue Card Component
interface VenueCardProps {
  venue: Venue;
  onEdit: () => void;
  onDelete: () => void;
}

function VenueCard({ venue, onEdit, onDelete }: VenueCardProps) {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-slate-900">{venue.name}</h3>
          <p className="text-sm text-slate-500">{venue.town}</p>
        </div>
        <TypeBadge type={venue.type} />
      </div>

      {venue.address && (
        <p className="text-sm text-slate-600 mb-2">{venue.address}</p>
      )}

      {venue.typicalDays && venue.typicalDays.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-slate-500">Typical days: </span>
          <span className="text-xs text-slate-700">{venue.typicalDays.join(', ')}</span>
        </div>
      )}

      {venue.notes && (
        <p className="text-sm text-slate-500 italic mb-3">{venue.notes}</p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button onClick={onEdit} className="btn btn-ghost btn-sm">
          <EditIcon className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button onClick={onDelete} className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50">
          <TrashIcon className="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}

// Venue Modal Component
interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue | null;
  onSave: (data: CreateVenueInput | UpdateVenueInput) => void;
}

function VenueModal({ isOpen, onClose, venue, onSave }: VenueModalProps) {
  const [type, setType] = useState<VenueType>('MARKET');
  const [name, setName] = useState('');
  const [town, setTown] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [typicalDays, setTypicalDays] = useState<string[]>([]);

  useEffect(() => {
    if (venue) {
      setType(venue.type);
      setName(venue.name);
      setTown(venue.town);
      setAddress(venue.address || '');
      setNotes(venue.notes || '');
      setTypicalDays(venue.typicalDays || []);
    } else {
      setType('MARKET');
      setName('');
      setTown('');
      setAddress('');
      setNotes('');
      setTypicalDays([]);
    }
  }, [venue, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      name,
      town,
      address: address || null,
      notes: notes || null,
      typicalDays: typicalDays.length > 0 ? typicalDays : null,
    });
  };

  const toggleDay = (day: string) => {
    if (typicalDays.includes(day)) {
      setTypicalDays(typicalDays.filter((d) => d !== day));
    } else {
      setTypicalDays([...typicalDays, day]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={venue ? 'Edit Venue' : 'Add Venue'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="MARKET"
                checked={type === 'MARKET'}
                onChange={(e) => setType(e.target.value as VenueType)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Market</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="SHOW"
                checked={type === 'SHOW'}
                onChange={(e) => setType(e.target.value as VenueType)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Show</span>
            </label>
          </div>
        </div>

        <div>
          <label className="label">Venue Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g., Festival Place"
            required
          />
        </div>

        <div>
          <label className="label">Town/City *</label>
          <input
            type="text"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            className="input"
            placeholder="e.g., Christchurch"
            required
          />
        </div>

        <div>
          <label className="label">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input"
            placeholder="Optional street address"
          />
        </div>

        <div>
          <label className="label">Typical Days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  typicalDays.includes(day)
                    ? 'bg-primary-100 text-primary-700 border-primary-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } border`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Any helpful notes..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={!name || !town} className="btn btn-primary">
            {venue ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
