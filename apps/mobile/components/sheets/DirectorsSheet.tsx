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
  slotValues?: Array<string | null>;
  slotIndex?: number | null;
  maxItems?: number;
  onClose: () => void;
  onDone: (next: string[]) => void;
  onSlotDone?: (slotIndex: number, nextValue: string | null) => void;
};

export default function DirectorsSheet({
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
    <SearchableSelectorSheet<PersonResult>
      visible={visible}
      title="Favorite Directors"
      placeholder="Search directors"
      initialValues={initialValues}
      slotValues={slotValues}
      slotIndex={slotIndex}
      maxItems={maxItems}
      selectionMode={slotIndex === undefined ? "multiple" : "single-slot"}
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
      onSlotDone={(nextSlotIndex, nextValue) => {
        onSlotDone?.(nextSlotIndex, nextValue);
        onClose();
      }}
    />
  );
}
