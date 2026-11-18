import { useEffect, useState } from 'react';
import { seniorsAPI } from '../services/api';

export const useBarangays = (): string[] => {
  const [barangays, setBarangays] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const getBarangays = (seniorsAPI as any).getBarangays;
    if (typeof getBarangays !== 'function') return () => { active = false; };

    getBarangays()
      .then((items) => {
        if (active) setBarangays(items);
      })
      .catch(() => {
        if (active) setBarangays([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return barangays;
};
