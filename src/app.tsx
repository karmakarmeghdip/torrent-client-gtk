import { AdwApplicationWindow, AdwToolbarView, quit } from "@gtkx/react";
import { useState } from "react";
import { injectStyles } from "./styles";
import { useTorrents } from "./hooks/useTorrents";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { PreferencesDialog } from "./components/PreferencesDialog";
import { AboutDialog } from "./components/AboutDialog";

injectStyles();

export const App = () => {
  const { torrents, toggleStatus, deleteTorrent, resumeAll, pauseAll } =
    useTorrents();

  const [showAbout, setShowAbout] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <AdwApplicationWindow
      title="Torrent Client"
      defaultWidth={800}
      defaultHeight={600}
      onClose={quit}
    >
      <AdwToolbarView>
        <AdwToolbarView.AddTopBar>
          <Header
            onShowPreferences={() => setShowPreferences(true)}
            onShowAbout={() => setShowAbout(true)}
            onResumeAll={resumeAll}
            onPauseAll={pauseAll}
          />
        </AdwToolbarView.AddTopBar>

        <TorrentList
          torrents={torrents}
          onToggleStatus={toggleStatus}
          onDelete={deleteTorrent}
        />

        {showPreferences && (
          <PreferencesDialog
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode(!darkMode)}
            notifications={notifications}
            onNotificationsToggle={() => setNotifications(!notifications)}
            onClosed={() => setShowPreferences(false)}
          />
        )}

        {showAbout && <AboutDialog onClosed={() => setShowAbout(false)} />}
      </AdwToolbarView>
    </AdwApplicationWindow>
  );
};

export default App;
