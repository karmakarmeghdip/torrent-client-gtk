import { useEffect, useState } from "react";
import { Torrent } from "../types";
import { initialTorrents } from "../data";

export const useTorrents = () => {
  const [torrents, setTorrents] = useState<Torrent[]>(initialTorrents);

  useEffect(() => {
    const interval = setInterval(() => {
      setTorrents((prev) =>
        prev.map((t) => {
          if (t.status === "Downloading") {
            const newProgress = Math.min(t.progress + 0.01, 1.0);
            const newStatus = newProgress >= 1.0 ? "Seeding" : "Downloading";
            return { ...t, progress: newProgress, status: newStatus };
          }
          return t;
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleStatus = (id: string) => {
    setTorrents((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          if (t.status === "Downloading" || t.status === "Seeding") {
            return { ...t, status: "Paused", speed: "0 B/s" };
          } else if (t.status === "Paused") {
            if (t.progress >= 1.0) {
              return { ...t, status: "Seeding", speed: "0 B/s" };
            } else {
              return { ...t, status: "Downloading", speed: "1.5 MB/s" };
            }
          }
        }
        return t;
      }),
    );
  };

  const deleteTorrent = (id: string) => {
    setTorrents((prev) => prev.filter((t) => t.id !== id));
  };

  const resumeAll = () => {
    setTorrents((prev) =>
      prev.map((t) =>
        t.status === "Paused"
          ? {
              ...t,
              status: t.progress >= 1.0 ? "Seeding" : "Downloading",
              speed: t.progress >= 1.0 ? "0 B/s" : "2.0 MB/s",
            }
          : t,
      ),
    );
  };

  const pauseAll = () => {
    setTorrents((prev) =>
      prev.map((t) =>
        t.status === "Downloading" || t.status === "Seeding"
          ? { ...t, status: "Paused", speed: "0 B/s" }
          : t,
      ),
    );
  };

  return {
    torrents,
    toggleStatus,
    deleteTorrent,
    resumeAll,
    pauseAll,
  };
};
