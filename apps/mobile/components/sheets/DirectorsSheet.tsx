import React from "react";

import SearchableSelectorSheet from "./SearchableSelectorSheet";
import { searchTmdb } from "../../apiservices/tmdbservice";

type PersonResult = {
  id?: number;
  name?: string | null;
  known_for?: string | null;
  profile_path?: string | null;
};

type Props = {
  visible: boolean;
  initialValues: string[];
  onClose: () => void;
  onDone: (next: string[]) => void;
};

export default function DirectorsSheet({
  visible,
  initialValues,
  onClose,
  onDone,
}: Props) {
  return (
    <SearchableSelectorSheet<PersonResult>
      visible={visible}
      title="Favorite Directors"
      placeholder="Search directors"
      initialValues={initialValues}
      searchFn={(query) => searchTmdb<PersonResult>(query, "director")}
      toItem={(person) => {
        const name = person.name?.trim();
        if (!name) return null;
        return {
          name,
          imageUrl: person.profile_path ?? null,
          subtitle: person.known_for ?? null,
        };
      }}
      onClose={onClose}
      onDone={onDone}
    />
  );
}
