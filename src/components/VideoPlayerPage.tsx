import * as Gtk from "@gtkx/ffi/gtk";
import * as Gio from "@gtkx/ffi/gio";
import * as Adw from "@gtkx/ffi/adw";
import type { Torrent as WebTorrentTorrent } from "webtorrent";
import {
  AdwHeaderBar,
  AdwNavigationView,
  AdwWindowTitle,
  AdwToolbarView,
  GtkVideo,
  GtkButton,
  GtkBox,
  GtkLabel,
  GtkImage,
  GtkGestureClick,
} from "@gtkx/react";
import { useAtom } from "jotai";
import { useMemo, useState, useCallback } from "react";
import { playerStateAtom, closePlayerAtom } from "../store/torrentStore";
import { stopStreaming } from "../services/videoStreamingService";

interface VideoPlayerPageProps {
  activeTorrents: Map<string, WebTorrentTorrent>;
  onBack: () => void;
  windowRef?: React.RefObject<Adw.ApplicationWindow | null>;
}

export const VideoPlayerPage = ({
  activeTorrents,
  onBack,
  windowRef,
}: VideoPlayerPageProps) => {
  const [playerState] = useAtom(playerStateAtom);
  const [, closePlayer] = useAtom(closePlayerAtom);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleBack = useCallback(() => {
    // Stop streaming first (fire and forget)
    void stopStreaming(activeTorrents);
    // Close player state
    closePlayer();
    // Navigate back
    onBack();
  }, [activeTorrents, closePlayer, onBack]);

  const handleFullscreen = useCallback(() => {
    if (windowRef?.current) {
      if (isFullscreen) {
        windowRef.current.unfullscreen();
        setIsFullscreen(false);
      } else {
        windowRef.current.fullscreen();
        setIsFullscreen(true);
      }
    }
  }, [isFullscreen, windowRef]);

  // If there's an error (likely unsupported codec), show the URL
  if (hasError) {
    return (
      <AdwNavigationView.Page id="video-player-error" title="Playback Error">
        <AdwToolbarView>
          <AdwToolbarView.AddTopBar>
            <AdwHeaderBar
              titleWidget={<AdwWindowTitle title="Playback Error" subtitle="" />}
            />
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
      </AdwNavigationView.Page>
    );
  }

  // Handle double-click on video to toggle fullscreen
  const handleVideoPressed = useCallback((nPress: number) => {
    if (nPress === 2) {
      // Double-click toggles fullscreen
      handleFullscreen();
    }
  }, [handleFullscreen]);

  return (
    <AdwNavigationView.Page id="video-player" title="Video Player">
      <AdwToolbarView>
        {!isFullscreen && (
          <AdwToolbarView.AddTopBar>
            <AdwHeaderBar
              titleWidget={<AdwWindowTitle title="Video Player" subtitle="" />}
            >
              <AdwHeaderBar.PackEnd>
                <GtkButton
                  iconName={isFullscreen ? "view-restore-symbolic" : "view-fullscreen-symbolic"}
                  tooltipText={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
                  onClicked={handleFullscreen}
                />
              </AdwHeaderBar.PackEnd>
            </AdwHeaderBar>
          </AdwToolbarView.AddTopBar>
        )}

        <GtkBox vexpand hexpand>
          {videoFile ? (
            <>
              <GtkVideo
                file={videoFile}
                autoplay
                vexpand
                hexpand
                graphicsOffload={Gtk.GraphicsOffloadEnabled.ENABLED}
              />
              <GtkGestureClick
                onPressed={handleVideoPressed}
              />
            </>
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
    </AdwNavigationView.Page>
  );
};
