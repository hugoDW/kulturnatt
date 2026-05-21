import React from "react";

import SearchableSelectorSheet from "./SearchableSelectorSheet";
import { searchTmdb } from "../../apiservices/tmdbservice";

type ShowResult = {
  id?: number;
  name?: string | null;
  first_air_date?: string | null;
  poster_path?: string | null;
};

type Props = {
  visible: boolean;
  initialValues: string[];
  onClose: () => void;
  onDone: (next: string[]) => void;
};

export default function ShowsSheet({
  visible,
  initialValues,
  onClose,
  onDone,
}: Props) {
  return (
    <SearchableSelectorSheet<ShowResult>
      visible={visible}
      title="Favorite Shows"
      placeholder="Search TV shows"
      initialValues={initialValues}
      searchFn={(query) => searchTmdb<ShowResult>(query, "tv")}
      toItem={(show) => {
        const name = show.name?.trim();
        if (!name) return null;
        const year = show.first_air_date?.slice(0, 4);
        return {
          name,
          imageUrl: show.poster_path ?? null,
          subtitle: year || null,
        };
      }}
      onClose={onClose}
      onDone={onDone}
    />
  );
}
