import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const KEY = "fifa19-compare";
const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [slots, setSlots] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(slots)); }, [slots]);

  const add = useCallback((player) => {
    setSlots((s) => {
      if (s.some((p) => p.ID === player.ID)) { toast.info(`${player.Name} is already in compare`); return s; }
      if (s.length >= 2) { toast.warning("Compare holds 2 players — remove one first"); return s; }
      toast.success(`${player.Name} added to compare`);
      return [...s, { ID: player.ID, Name: player.Name, Photo: player.Photo, Overall: player.Overall, pos_group: player.pos_group }];
    });
  }, []);

  const remove = useCallback((id) => setSlots((s) => s.filter((p) => p.ID !== id)), []);
  const clear = useCallback(() => setSlots([]), []);
  const has = useCallback((id) => slots.some((p) => p.ID === id), [slots]);

  const value = useMemo(() => ({ slots, add, remove, clear, has }), [slots, add, remove, clear, has]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompare = () => useContext(CompareContext);
