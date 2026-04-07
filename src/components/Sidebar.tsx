import type * as Gtk from "@gtkx/ffi/gtk";
import {
  AdwActionRow,
  GtkImage,
  GtkLabel,
  GtkListBox,
  GtkListBoxRow,
  GtkScrolledWindow,
} from "@gtkx/react";
import { useEffect, useRef, useState } from "react";

type PageId = "home" | "downloads";

interface NavItem {
  id: PageId;
  title: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "home", title: "Home", icon: "go-home-symbolic" },
  { id: "downloads", title: "Downloads", icon: "folder-download-symbolic" },
];

interface SidebarProps {
  activePage: PageId;
  downloadCount: number;
  onPageChange: (page: PageId) => void;
}

const SidebarComponent = ({ activePage, downloadCount, onPageChange }: SidebarProps) => {
  const listBoxRef = useRef<Gtk.ListBox | null>(null);
  const initialIndex = navItems.findIndex((item) => item.id === activePage);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Sync selection when activePage changes externally
  useEffect(() => {
    const newIndex = navItems.findIndex((item) => item.id === activePage);
    if (newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
    }
    // Update the ListBox selection
    if (listBoxRef.current) {
      const row = listBoxRef.current.getRowAtIndex(newIndex);
      if (row) {
        listBoxRef.current.selectRow(row);
      }
    }
  }, [activePage, selectedIndex]);

  const handleRowSelected = (row: Gtk.ListBoxRow | null) => {
    if (!row) {
      return;
    }
    const index = row.getIndex();
    const item = navItems[index];
    if (item) {
      setSelectedIndex(index);
      onPageChange(item.id);
    }
  };

  return (
    <GtkScrolledWindow vexpand widthRequest={220}>
      <GtkListBox
        ref={listBoxRef}
        cssClasses={["navigation-sidebar"]}
        onRowSelected={handleRowSelected}
      >
        {navItems.map((item) => (
          <GtkListBoxRow key={item.id}>
            <AdwActionRow title={item.title}>
              <AdwActionRow.AddPrefix>
                <GtkImage iconName={item.icon} />
              </AdwActionRow.AddPrefix>
              {item.id === "downloads" && downloadCount > 0 && (
                <AdwActionRow.AddSuffix>
                  <GtkLabel label={String(downloadCount)} cssClasses={["dim-label"]} />
                </AdwActionRow.AddSuffix>
              )}
            </AdwActionRow>
          </GtkListBoxRow>
        ))}
      </GtkListBox>
    </GtkScrolledWindow>
  );
};

export type { PageId };
export { SidebarComponent as Sidebar };
