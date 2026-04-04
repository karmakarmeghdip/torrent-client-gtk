import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { setSimulationEnabledAtom } from "../store/torrentStore";

/** Hook to initialize torrent store simulation on app mount */
export const useTorrentSimulation = () => {
  const setSimulationEnabled = useSetAtom(setSimulationEnabledAtom);

  useEffect(() => {
    // Start simulation on mount
    setSimulationEnabled(true);

    // Cleanup on unmount
    return () => {
      setSimulationEnabled(false);
    };
  }, [setSimulationEnabled]);
};
