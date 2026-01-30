'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FacilityWithSport, FacilityType } from '@/lib/types';

interface FacilityFilterProps {
  onFilterChange: (facilityIds: string[]) => void;
}

export default function FacilityFilter({ onFilterChange }: FacilityFilterProps) {
  const [facilities, setFacilities] = useState<FacilityWithSport[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | FacilityType>('all');
  const [selectedFacilities, setSelectedFacilities] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFacilities = useCallback(async () => {
    try {
      const response = await fetch('/api/facilities');
      if (response.ok) {
        const data = await response.json();
        setFacilities(data);
        // Select all by default
        const allIds = new Set(data.map((f: FacilityWithSport) => f.id));
        setSelectedFacilities(allIds);
        onFilterChange(Array.from(allIds));
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  }, [onFilterChange]);

  useEffect(() => {
    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredFacilities = facilities.filter((facility) => {
    const matchesType = selectedType === 'all' || facility.type === selectedType;
    const matchesSearch =
      searchQuery === '' ||
      facility.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleFacility = (facilityId: string) => {
    const newSelected = new Set(selectedFacilities);
    if (newSelected.has(facilityId)) {
      newSelected.delete(facilityId);
    } else {
      newSelected.add(facilityId);
    }
    setSelectedFacilities(newSelected);
    onFilterChange(Array.from(newSelected));
  };

  const selectAll = () => {
    const allIds = new Set(filteredFacilities.map((f) => f.id));
    setSelectedFacilities(allIds);
    onFilterChange(Array.from(allIds));
  };

  const selectNone = () => {
    setSelectedFacilities(new Set());
    onFilterChange([]);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <h3 className="text-lg font-bold text-almost-black mb-4">Filter Facilities</h3>

      {/* Type Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedType === 'all'
              ? 'bg-gradient-to-r from-electric-cyan to-vibrant-magenta text-white'
              : 'bg-cool-gray text-almost-black hover:bg-electric-cyan/10'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('court')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedType === 'court'
              ? 'bg-gradient-to-r from-electric-cyan to-vibrant-magenta text-white'
              : 'bg-cool-gray text-almost-black hover:bg-electric-cyan/10'
          }`}
        >
          Courts
        </button>
        <button
          onClick={() => setSelectedType('bay')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            selectedType === 'bay'
              ? 'bg-gradient-to-r from-electric-cyan to-vibrant-magenta text-white'
              : 'bg-cool-gray text-almost-black hover:bg-electric-cyan/10'
          }`}
        >
          Bays
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search facilities..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 mb-4 border-2 border-cool-gray rounded-lg focus:outline-none focus:border-electric-cyan transition-colors"
      />

      {/* Select Actions */}
      <div className="flex gap-2 mb-4 text-sm">
        <button
          onClick={selectAll}
          className="text-electric-cyan hover:underline font-semibold"
        >
          Select All
        </button>
        <span className="text-cool-gray">•</span>
        <button
          onClick={selectNone}
          className="text-electric-cyan hover:underline font-semibold"
        >
          Select None
        </button>
      </div>

      {/* Facility List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredFacilities.map((facility) => (
          <label
            key={facility.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-cool-gray cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedFacilities.has(facility.id)}
              onChange={() => toggleFacility(facility.id)}
              className="w-5 h-5 text-electric-cyan rounded focus:ring-2 focus:ring-electric-cyan"
            />
            <div className="flex-1">
              <div className="font-semibold text-almost-black">{facility.name}</div>
              <div className="text-sm text-ocean-teal capitalize">{facility.type}</div>
            </div>
            <div className="text-xs px-2 py-1 bg-mint-green/20 text-mint-green rounded-full font-semibold">
              {facility.sport.name}
            </div>
          </label>
        ))}
      </div>

      {filteredFacilities.length === 0 && (
        <p className="text-center text-gray-400 py-8">No facilities found</p>
      )}
    </div>
  );
}
