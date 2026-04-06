import type * as Adw from "@gtkx/ffi/adw";
import * as Gio from "@gtkx/ffi/gio";
import * as Gtk from "@gtkx/ffi/gtk";
import {
  AdwHeaderBar,
  AdwNavigationView,
  AdwToolbarView,
  AdwWindowTitle,
  GtkBox,
  GtkButton,
  GtkGestureClick,
  GtkImage,
  GtkLabel,
  GtkVideo,
} from "@gtkx/react";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import type { Torrent as WebTorrentTorrent } from "webtorrent";
import { closePlayerAtom, playerStateAtom } from "../store/torrentStore";

interface VideoPlayerPageProps {
  activeTorrents: Map<string, WebTorrentTorrent>;
  onBack: () => void;
  windowRef?: React.RefObject<Adw.ApplicationWindow | null>;
}

interface ErrorViewProps {
  streamUrl: string;
}

const ErrorView = ({ streamUrl }: ErrorViewProps) => (
  <AdwNavigationView.Page id="video-player-error" title="Playback Error">
    <AdwToolbarView>
      <AdwToolbarView.AddTopBar>
        <AdwHeaderBar titleWidget={<AdwWindowTitle title="Playback Error" subtitle="" />} />
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
        <GtkImage iconName="dialog-error-symbolic" pixelSize={64} />
        <GtkLabel label="Unable to play video" cssClasses={["heading"]} />
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
            label={streamUrl || ""}
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

interface PlayerHeaderProps {
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
}

const PlayerHeader = ({ isFullscreen, onFullscreenToggle }: PlayerHeaderProps) => (
  <AdwToolbarView.AddTopBar>
    <AdwHeaderBar titleWidget={<AdwWindowTitle title="Video Player" subtitle="" />}>
      <AdwHeaderBar.PackEnd>
        <GtkButton
          iconName={isFullscreen ? "view-restore-symbolic" : "view-fullscreen-symbolic"}
          tooltipText={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
          onClicked={onFullscreenToggle}
        />
      </AdwHeaderBar.PackEnd>
    </AdwHeaderBar>
  </AdwToolbarView.AddTopBar>
);

interface VideoPlayerProps {
  videoFile: Gio.File;
  onVideoPressed: (nPress: number) => void;
}

const VideoPlayer = ({ videoFile, onVideoPressed }: VideoPlayerProps) => (
  <>
    <GtkVideo
      file={videoFile}
      autoplay
      vexpand
      hexpand
      graphicsOffload={Gtk.GraphicsOffloadEnabled.ENABLED}
    />
    <GtkGestureClick onPressed={onVideoPressed} />
  </>
);

export const VideoPlayerPage = ({
  activeTorrents: _activeTorrents,
  onBack: _onBack,
  windowRef,
}: VideoPlayerPageProps) => {
  const [playerState] = useAtom(playerStateAtom);
  const [, _closePlayer] = useAtom(closePlayerAtom);
  const [hasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert stream URL to Gio.File for GtkVideo
  const videoFile = useMemo(() => {
    if (!playerState.streamUrl) {
      return null;
    }
    try {
      return Gio.fileNewForUri(playerState.streamUrl);
    } catch {
      return null;
    }
  }, [playerState.streamUrl]);

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

  const handleVideoPressed = useCallback(
    (nPress: number) => {
      if (nPress === 2) {
        // Double-click toggles fullscreen
        handleFullscreen();
      }
    },
    [handleFullscreen]
  );

  // Handle error state
  if (hasError) {
    return <ErrorView streamUrl={playerState.streamUrl || ""} />;
  }

  return (
    <AdwNavigationView.Page id="video-player" title="Video Player">
      <AdwToolbarView>
        {!isFullscreen && (
          <PlayerHeader isFullscreen={isFullscreen} onFullscreenToggle={handleFullscreen} />
        )}

        <GtkBox vexpand hexpand>
          {videoFile ? (
            <VideoPlayer videoFile={videoFile} onVideoPressed={handleVideoPressed} />
          ) : (
            <GtkBox vexpand hexpand valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER}>
              <GtkLabel label="Loading video..." />
            </GtkBox>
          )}
        </GtkBox>
      </AdwToolbarView>
    </AdwNavigationView.Page>
  );
};
