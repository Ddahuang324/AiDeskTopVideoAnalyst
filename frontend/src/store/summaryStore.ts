
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ActivityCard, Observation } from '../services/geminiService';

interface SummaryContextType {
  observations: Observation[] | null;
  activityCards: ActivityCard[] | null;
  setSummary: (observations: Observation[], activityCards: ActivityCard[]) => void;
  clearSummary: () => void;
}

const SummaryContext = createContext<SummaryContextType | undefined>(undefined);

export const SummaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [observations, setObservations] = useState<Observation[] | null>(null);
  const [activityCards, setActivityCards] = useState<ActivityCard[] | null>(null);

  const setSummary = (obs: Observation[], cards: ActivityCard[]) => {
    setObservations(obs);
    setActivityCards(cards);
  };

  const clearSummary = () => {
    setObservations(null);
    setActivityCards(null);
  };

  return (
    <SummaryContext.Provider value={{ observations, activityCards, setSummary, clearSummary }}>
      {children}
    </SummaryContext.Provider>
  );
};

export const useSummary = () => {
  const context = useContext(SummaryContext);
  if (context === undefined) {
    throw new Error('useSummary must be used within a SummaryProvider');
  }
  return context;
};
