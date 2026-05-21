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
  onClose: () => void;
  onDone: (next: string[]) => void;
};

export default function AlbumsSheet({
  visible,
  initialValues,
  onClose,
  onDone,
}: Props) {
  return (
    <SearchableSelectorSheet<AlbumResult>
      visible={visible}
      title="Favorite Albums"
      placeholder="Search albums"
      initialValues={initialValues}
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
    />
  );
}
