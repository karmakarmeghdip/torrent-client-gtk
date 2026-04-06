import * as Gtk from "@gtkx/ffi/gtk";
import * as Gio from "@gtkx/ffi/gio";
import type { Torrent as WebTorrentTorrent } from "webtorrent";
import {
  AdwApplicationWindow,
  AdwHeaderBar,
  AdwWindowTitle,
  AdwToolbarView,
  GtkVideo,
  GtkButton,
  GtkBox,
  GtkShortcutController,
  GtkLabel,
  GtkImage,
} from "@gtkx/react";
import { useAtom } from "jotai";
import { useMemo, useState, useCallback, useRef } from "react";
import { playerStateAtom, closePlayerAtom } from "../store/torrentStore";
import { stopStreaming } from "../services/videoStreamingService";

interface VideoPlayerWindowProps {
  activeTorrents: Map<string, WebTorrentTorrent>;
  onWindowRef?: (ref: { fullscreen: () => void; unfullscreen: () => void }) => void;
}

export const VideoPlayerWindow = ({
  activeTorrents,
  onWindowRef,
}: VideoPlayerWindowProps) => {
  const [playerState] = useAtom(playerStateAtom);
  const [, closePlayer] = useAtom(closePlayerAtom);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const windowRef = useRef<{ fullscreen: () => void; unfullscreen: () => void } | null>(null);

  // Convert stream URL to Gio.File for GtkVideo
  const videoFile = useMemo(() => {
    if (!playerState.streamUrl) return null;
    try {
      return Gio.fileNewForUri(playerState.streamUrl);
    } catch (error) {
      console.error("[VideoPlayer] Failed to create Gio.File:", error);
      return null;
    }
  }, [playerState.streamUrl]);

  const handleFullscreen = useCallback(() => {
    if (windowRef.current) {
      if (isFullscreen) {
        windowRef.current.unfullscreen();
        setIsFullscreen(false);
      } else {
        windowRef.current.fullscreen();
        setIsFullscreen(true);
      }
    }
  }, [isFullscreen]);

  const handleClose = useCallback(() => {
    // Stop streaming first (fire and forget)
    void stopStreaming(activeTorrents);
    // Close player
    closePlayer();
  }, [activeTorrents, closePlayer]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Expose window methods to parent
  const setWindowRef = useCallback((ref: { fullscreen: () => void; unfullscreen: () => void } | null) => {
    windowRef.current = ref;
    if (onWindowRef && ref) {
      onWindowRef(ref);
    }
  }, [onWindowRef]);

  // If there's an error (likely unsupported codec), show the URL
  if (hasError) {
    return (
      <AdwApplicationWindow
        title="Video Player - Error"
        defaultWidth={600}
        defaultHeight={400}
        onClose={handleClose}
        ref={setWindowRef}
      >
        <AdwToolbarView>
          <AdwToolbarView.AddTopBar>
            <AdwHeaderBar
              titleWidget={<AdwWindowTitle title="Playback Error" subtitle="" />}
            >
              <AdwHeaderBar.PackEnd>
                <GtkButton
                  iconName="window-close-symbolic"
                  tooltipText="Close"
                  onClicked={handleClose}
                />
              </AdwHeaderBar.PackEnd>
            </AdwHeaderBar>
          </AdwToolbarView.AddTopBar>

          <GtkBox
            orientation={Gtk.Orientation.VERTICAL}
            spacing={16}
            vexpand
            hexpand
            valign={Gtk.Align.CENTER}
            halign={Gtk.Align.CENTER}
            marginStart={32}
            marginEnd={32}
          >
            <GtkImage
              iconName="dialog-error-symbolic"
              pixelSize={64}
            />
            <GtkLabel
              label="Unable to play video"
              cssClasses={["heading"]}
            />
            <GtkLabel
              label="The video format may not be supported by the system player. You can copy the URL below and open it in VLC or your browser."
              wrap
              maxWidthChars={50}
              justify={Gtk.Justification.CENTER}
            />
            <GtkBox
              orientation={Gtk.Orientation.HORIZONTAL}
              spacing={8}
              cssClasses={["card"]}
              marginTop={16}
            >
              <GtkLabel
                label={playerState.streamUrl || ""}
                hexpand
                marginStart={12}
                marginEnd={12}
                marginTop={12}
                marginBottom={12}
                selectable
              />
            </GtkBox>
          </GtkBox>
        </AdwToolbarView>
      </AdwApplicationWindow>
    );
  }

  return (
    <AdwApplicationWindow
      title="Video Player"
      defaultWidth={800}
      defaultHeight={600}
      onClose={handleClose}
      ref={setWindowRef}
    >
      <GtkShortcutController scope={Gtk.ShortcutScope.GLOBAL}>
        <GtkShortcutController.Shortcut
          trigger="F11"
          onActivate={handleFullscreen}
        />
        <GtkShortcutController.Shortcut
          trigger="Escape"
          onActivate={handleClose}
        />
      </GtkShortcutController>

      <AdwToolbarView>
        <AdwToolbarView.AddTopBar>
          <AdwHeaderBar
            titleWidget={<AdwWindowTitle title="Video Player" subtitle="" />}
          >
            <AdwHeaderBar.PackEnd>
              <GtkButton
                iconName="view-fullscreen-symbolic"
                tooltipText="Fullscreen (F11)"
                onClicked={handleFullscreen}
              />
              <GtkButton
                iconName="window-close-symbolic"
                tooltipText="Close (Escape)"
                onClicked={handleClose}
              />
            </AdwHeaderBar.PackEnd>
          </AdwHeaderBar>
        </AdwToolbarView.AddTopBar>

        <GtkBox vexpand hexpand>
          {videoFile ? (
            <GtkVideo
              file={videoFile}
              autoplay
              vexpand
              hexpand
              graphicsOffload={Gtk.GraphicsOffloadEnabled.ENABLED}
            />
          ) : (
            <GtkBox
              vexpand
              hexpand
              valign={Gtk.Align.CENTER}
              halign={Gtk.Align.CENTER}
            >
              <GtkLabel label="Loading video..." />
            </GtkBox>
          )}
        </GtkBox>
      </AdwToolbarView>
    </AdwApplicationWindow>
  );
};
