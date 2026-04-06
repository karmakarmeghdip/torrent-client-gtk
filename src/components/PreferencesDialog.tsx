import {
  AdwActionRow,
  AdwPreferencesDialog,
  AdwPreferencesGroup,
  AdwPreferencesPage,
  AdwSwitchRow,
} from "@gtkx/react";

interface PreferencesDialogProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
  notifications: boolean;
  onNotificationsToggle: () => void;
  autoStart: boolean;
  onAutoStartToggle: () => void;
  downloadPath: string;
  onDownloadPathChange: (path: string) => void;
  onClosed: () => void;
}

export const PreferencesDialog = ({
  darkMode,
  onDarkModeToggle,
  notifications,
  onNotificationsToggle,
  autoStart,
  onAutoStartToggle,
  downloadPath,
  onClosed,
}: PreferencesDialogProps) => (
  <AdwPreferencesDialog
    title="Preferences"
    onClosed={onClosed}
    contentWidth={500}
    contentHeight={400}
  >
    <AdwPreferencesPage>
      <AdwPreferencesGroup title="Appearance">
        <AdwSwitchRow
          title="Dark Mode"
          subtitle="Use dark color scheme"
          active={darkMode}
          onActivated={onDarkModeToggle}
        />
      </AdwPreferencesGroup>
      <AdwPreferencesGroup title="Downloads">
        <AdwActionRow
          title="Default Save Location"
          subtitle={downloadPath || "~/Downloads"}
          activatable
          onActivated={() => {}}
        />
        <AdwSwitchRow
          title="Start downloading automatically"
          active={autoStart}
          onActivated={onAutoStartToggle}
        />
      </AdwPreferencesGroup>
      <AdwPreferencesGroup title="Notifications">
        <AdwSwitchRow
          title="Show Notifications"
          subtitle="When downloads complete"
          active={notifications}
          onActivated={onNotificationsToggle}
        />
      </AdwPreferencesGroup>
    </AdwPreferencesPage>
  </AdwPreferencesDialog>
);
