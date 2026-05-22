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
  initialValues?: string[];
  slotValues?: Array<string | null>;
  slotIndex?: number | null;
  maxItems?: number;
  onClose: () => void;
  onDone?: (next: string[]) => void;
  onSlotDone?: (slotIndex: number, nextValue: string | null) => void;
};

export default function ArtistsSheet({
  visible,
  initialValues,
  slotValues,
  slotIndex,
  maxItems,
  onClose,
  onDone,
  onSlotDone,
}: Props) {
  const { draft, updateDraft } = useProfileCreation();
  const values = initialValues ?? draft.artists;

  return (
    <SearchableSelectorSheet<ArtistResult>
      visible={visible}
      title="Favorite Artists"
      placeholder="Search artists"
      initialValues={values}
      slotValues={slotValues}
      slotIndex={slotIndex}
      maxItems={maxItems}
      selectionMode={slotIndex === undefined ? "multiple" : "single-slot"}
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
        if (onDone) {
          onDone(next);
          return;
        }
        updateDraft({ artists: next });
        onClose();
      }}
      onSlotDone={(nextSlotIndex, nextValue) => {
        onSlotDone?.(nextSlotIndex, nextValue);
        onClose();
      }}
    />
  );
}
