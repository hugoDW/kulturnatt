import React from "react";

import SearchableSelectorSheet from "./SearchableSelectorSheet";
import { apiGetJson } from "../../apiservices/apiClient";

type AlbumResult = {
  title?: string | null;
  artists?: string | null;
  year?: string | null;
  type?: string | null;
  cover?: { image_url?: string | null; thumb_250?: string | null } | null;
};

async function searchAlbums(query: string) {
  const json = await apiGetJson<{ results?: AlbumResult[] }>(
    "/external/music/search",
    { query, category: "release", limit: 10 },
    "Could not load albums right now.",
    "Log in again to search albums.",
  );
  return json.results ?? [];
}

type Props = {
  visible: boolean;
  initialValues: string[];
  slotValues?: Array<string | null>;
  slotIndex?: number | null;
  maxItems?: number;
  onClose: () => void;
  onDone: (next: string[]) => void;
  onSlotDone?: (slotIndex: number, nextValue: string | null) => void;
};

export default function AlbumsSheet({
  visible,
  initialValues,
  slotValues,
  slotIndex,
  maxItems,
  onClose,
  onDone,
  onSlotDone,
}: Props) {
  return (
    <SearchableSelectorSheet<AlbumResult>
      visible={visible}
      title="Favorite Albums"
      placeholder="Search albums"
      initialValues={initialValues}
      slotValues={slotValues}
      slotIndex={slotIndex}
      maxItems={maxItems}
      selectionMode={slotIndex === undefined ? "multiple" : "single-slot"}
      searchFn={searchAlbums}
      toItem={(album) => {
        const name = album.title?.trim();
        if (!name) return null;
        const subtitle = [album.artists, album.year].filter(Boolean).join(" • ");
        return {
          name,
          imageUrl: album.cover?.thumb_250 ?? album.cover?.image_url ?? null,
          subtitle: subtitle || null,
        };
      }}
      onClose={onClose}
      onDone={onDone}
      onSlotDone={(nextSlotIndex, nextValue) => {
        onSlotDone?.(nextSlotIndex, nextValue);
        onClose();
      }}
    />
  );
}
