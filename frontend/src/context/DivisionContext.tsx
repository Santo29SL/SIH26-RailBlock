import React, { createContext, useContext, useState, useEffect } from 'react';
import { Section } from '../types/section';
import { sectionsApi } from '../api/sections';

export interface DivisionContextType {
  zones: string[];
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  divisions: string[];
  selectedDivision: string;
  setSelectedDivision: (division: string) => void;
  sections: Section[];
  selectedSection: Section | null;
  setSelectedSection: (section: Section | null) => void;
  planningDate: string;
  setPlanningDate: (date: string) => void;
  isLoadingSections: boolean;
  refetchSections: () => Promise<void>;
}

const DivisionContext = createContext<DivisionContextType | undefined>(undefined);

// Default fallback sections when backend is initialising or offline
const FALLBACK_SECTIONS: Section[] = [
  {
    id: 'sec-mas-ajj-01',
    section_code: 'MAS-AJJ',
    section_name: 'Chennai Central - Arakkonam Jn',
    division: 'Chennai',
    zone: 'Southern Railway',
    length_km: 68.8,
    line_type: 'QUADRUPLE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-ndls-cnb-02',
    section_code: 'NDLS-CNB',
    section_name: 'New Delhi - Kanpur Central',
    division: 'Delhi',
    zone: 'Northern Railway',
    length_km: 440.0,
    line_type: 'DOUBLE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-cbe-sa-03',
    section_code: 'CBE-SA',
    section_name: 'Coimbatore Jn - Salem Jn',
    division: 'Salem',
    zone: 'Southern Railway',
    length_km: 160.5,
    line_type: 'DOUBLE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-mas-gpd-04',
    section_code: 'MAS-GPD',
    section_name: 'Chennai Central - Gummidipundi',
    division: 'Chennai',
    zone: 'Southern Railway',
    length_km: 47.2,
    line_type: 'DOUBLE',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DivisionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedZone, setSelectedZone] = useState<string>('Southern Railway');
  const [selectedDivision, setSelectedDivision] = useState<string>('Chennai');
  const [sections, setSections] = useState<Section[]>(FALLBACK_SECTIONS);
  const [selectedSection, setSelectedSection] = useState<Section | null>(FALLBACK_SECTIONS[0]);
  const [planningDate, setPlanningDate] = useState<string>('2026-08-25');
  const [isLoadingSections, setIsLoadingSections] = useState<boolean>(false);

  const zones = ['Southern Railway', 'Northern Railway', 'Central Railway', 'Western Railway', 'South Central Railway'];
  const divisions = ['Chennai', 'Salem', 'Delhi', 'Mumbai', 'Secunderabad'];

  const fetchSections = async () => {
    setIsLoadingSections(true);
    try {
      const data = await sectionsApi.getSections(1, 100);
      if (data.items && data.items.length > 0) {
        setSections(data.items);
        // If current selected section is not in new list or null, pick first
        if (!selectedSection || !data.items.find((s) => s.id === selectedSection.id)) {
          setSelectedSection(data.items[0]);
        }
      }
    } catch (e) {
      console.warn('Could not fetch sections from backend, using default fallback railway sections');
    } finally {
      setIsLoadingSections(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  return (
    <DivisionContext.Provider
      value={{
        zones,
        selectedZone,
        setSelectedZone,
        divisions,
        selectedDivision,
        setSelectedDivision,
        sections,
        selectedSection,
        setSelectedSection,
        planningDate,
        setPlanningDate,
        isLoadingSections,
        refetchSections: fetchSections,
      }}
    >
      {children}
    </DivisionContext.Provider>
  );
};

export const useDivision = () => {
  const context = useContext(DivisionContext);
  if (!context) {
    throw new Error('useDivision must be used within a DivisionProvider');
  }
  return context;
};
