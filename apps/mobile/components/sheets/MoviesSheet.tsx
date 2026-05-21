import React from "react";

import SearchableSelectorSheet from "./SearchableSelectorSheet";
import { searchTmdb } from "../../apiservices/tmdbservice";
import { useProfileCreation } from "../../lib/profileCreation";

type MovieResult = {
  id?: number;
  title?: string | null;
  year?: string | null;
  director?: string | null;
  poster_path?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MoviesSheet({ visible, onClose }: Props) {
  const { draft, updateDraft } = useProfileCreation();

  return (
    <SearchableSelectorSheet<MovieResult>
      visible={visible}
      title="Favorite Movies"
      placeholder="Search movies"
      initialValues={draft.movies}
      searchFn={(query) => searchTmdb<MovieResult>(query, "movie")}
      toItem={(movie) => {
        const name = movie.title?.trim();
        if (!name) return null;
        const subtitleParts = [movie.year, movie.director]
          .filter(Boolean)
          .join(" • ");
        return {
          name,
          imageUrl: movie.poster_path ?? null,
          subtitle: subtitleParts || null,
        };
      }}
      onClose={onClose}
      onDone={(next) => {
        updateDraft({ movies: next });
        onClose();
      }}
    />
  );
}
