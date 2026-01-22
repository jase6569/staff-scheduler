import React, { useState, useRef, useEffect } from 'react';
import type { Venue } from '../types';

interface VenueSelectProps {
  venues: Venue[];
  value: string | null;
  onChange: (venueId: string | null) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function VenueSelect({
  venues,
  value,
  onChange,
  onCreateNew,
  placeholder = 'Select venue...',
  disabled = false,
}: VenueSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedVenue = venues.find((v) => v.id === value);

  const filteredVenues = venues.filter((venue) => {
    const searchLower = search.toLowerCase();
    return (
      venue.name.toLowerCase().includes(searchLower) ||
      venue.town.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (venueId: string) => {
    onChange(venueId);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="input text-left flex items-center justify-between"
      >
        <span className={selectedVenue ? 'text-slate-900' : 'text-slate-400'}>
          {selectedVenue ? `${selectedVenue.name} (${selectedVenue.town})` : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedVenue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <XIcon className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <ChevronIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues..."
              className="input text-sm"
            />
          </div>
          <div className="overflow-y-auto max-h-48 scrollbar-thin">
            {filteredVenues.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                No venues found
              </div>
            ) : (
              filteredVenues.map((venue) => (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => handleSelect(venue.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${
                    venue.id === value ? 'bg-primary-50' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900">{venue.name}</div>
                    <div className="text-slate-500 text-xs">{venue.town}</div>
                  </div>
                  <span className={`badge ${venue.type === 'MARKET' ? 'badge-market' : 'badge-show'}`}>
                    {venue.type}
                  </span>
                </button>
              ))
            )}
          </div>
          {onCreateNew && (
            <div className="p-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
                className="w-full btn btn-ghost text-primary-600 hover:bg-primary-50"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add new venue
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
