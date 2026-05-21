import React from "react";

import SearchableSelectorSheet from "./SearchableSelectorSheet";
import { apiGetJson } from "../../apiservices/apiClient";

type SongResult = {
  title?: string | null;
  artists?: string | null;
  album?: string | null;
  year?: string | null;
  cover?: { image_url?: string | null; thumb_250?: string | null } | null;
};

async function searchSongs(query: string) {
  const json = await apiGetJson<{ results?: SongResult[] }>(
    "/external/music/search",
    { query, category: "recording", limit: 10 },
    "Could not load songs right now.",
    "Log in again to search songs.",
  );
  return json.results ?? [];
}

type Props = {
  visible: boolean;
  initialValues: string[];
  onClose: () => void;
  onDone: (next: string[]) => void;
};

export default function SongsSheet({
  visible,
  initialValues,
  onClose,
  onDone,
}: Props) {
  return (
    <SearchableSelectorSheet<SongResult>
      visible={visible}
      title="Favorite Songs"
      placeholder="Search songs"
      initialValues={initialValues}
      searchFn={searchSongs}
      toItem={(song) => {
        const name = song.title?.trim();
        if (!name) return null;
        const subtitle = [song.artists, song.year].filter(Boolean).join(" • ");
        return {
          name,
          imageUrl: song.cover?.thumb_250 ?? song.cover?.image_url ?? null,
          subtitle: subtitle || null,
        };
      }}
      onClose={onClose}
      onDone={onDone}
    />
  );
}
