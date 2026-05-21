import React from "react";

import SearchableSelectorSheet from "./SearchableSelectorSheet";
import { apiGetJson } from "../../apiservices/apiClient";
import { useProfileCreation } from "../../lib/profileCreation";

type ArtistResult = {
  name?: string | null;
  country?: string | null;
  birth_year?: string | null;
  genre?: string | null;
  disambiguation?: string | null;
  image?: { image_url?: string | null; thumb_250?: string | null } | null;
};

async function searchArtists(query: string) {
  const json = await apiGetJson<{ results?: ArtistResult[] }>(
    "/external/music/artists/search",
    { query, limit: 10 },
    "Could not load artists right now.",
    "Log in again to search artists.",
  );
  return json.results ?? [];
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ArtistsSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();

  return (
    <SearchableSelectorSheet<ArtistResult>
      visible={visible}
      title="Favorite Artists"
      placeholder="Search artists"
      initialValues={draft.artists}
      searchFn={searchArtists}
      toItem={(artist) => {
        const name = artist.name?.trim();
        if (!name) return null;
        const subtitleParts = [artist.country, artist.birth_year, artist.genre]
          .filter(Boolean)
          .join(" • ");
        return {
          name,
          imageUrl: artist.image?.thumb_250 ?? artist.image?.image_url ?? null,
          subtitle: subtitleParts || artist.disambiguation || null,
        };
      }}
      onClose={onClose}
      onDone={(next) => {
        updateDraft({ artists: next });
        onClose();
      }}
    />
  );
}
