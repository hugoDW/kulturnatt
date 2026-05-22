import type { ProfileSetupPayload } from "../apiservices/profileService";

export type InterestField = "literature" | "music_genre" | "movie_genre";

export type InterestCategory = {
  title: string;
  field: InterestField;
  options: string[];
};

export type InterestSection = {
  id: string;
  title: string;
  icon: "book-outline" | "musical-notes-outline" | "film-outline";
  categories: InterestCategory[];
};

export const INTEREST_SECTIONS: InterestSection[] = [
  {
    id: "music",
    title: "Music",
    icon: "musical-notes-outline",
    categories: [
      {
        title: "Genres",
        field: "music_genre",
        options: [
          "Ambient",
          "Alternative",
          "Blues",
          "Classical",
          "Country",
          "Dance",
          "Electronic",
          "Experimental",
          "Folk",
          "Hip Hop",
          "Indie",
          "Industrial & Noise",
          "Jazz",
          "Metal",
          "Pop",
          "Punk",
          "Reggae & Ska",
          "Rock",
          "Singer-Songwriter",
        ],
      },
    ],
  },
  {
    id: "film",
    title: "Film & TV",
    icon: "film-outline",
    categories: [
      {
        title: "Genres",
        field: "movie_genre",
        options: [
          "Action",
          "Comedy",
          "Drama",
          "Horror",
          "Romance",
          "Science Fiction",
          "Thriller",
          "Animation",
        ],
      },
    ],
  },
  {
    id: "literature",
    title: "Literature",
    icon: "book-outline",
    categories: [
      {
        title: "Fiction",
        field: "literature",
        options: [
          "Novel",
          "Young Adult",
          "Graphic Novel",
          "Romance",
          "Mystery",
          "Fantasy",
          "Science Fiction",
        ],
      },
      {
        title: "Non-Fiction",
        field: "literature",
        options: [
          "Biography & Memoir",
          "History",
          "Philosophy",
          "Popular Science",
        ],
      },
      {
        title: "Poetry & Drama",
        field: "literature",
        options: ["Poetry", "Theatre", "Spoken Word"],
      },
    ],
  },
];

export const VISUAL_ARTS_LABEL = "Art";

export type InterestIcon =
  | "book-outline"
  | "musical-notes-outline"
  | "film-outline"
  | "color-palette-outline";

export type SelectedInterest = {
  id: string;
  label: string;
  icon: InterestIcon;
};

export function getSelectedInterests(draft: ProfileSetupPayload): SelectedInterest[] {
  const items: SelectedInterest[] = [];

  draft.music_genre.forEach((label) => {
    items.push({
      id: `music-${label}`,
      label,
      icon: "musical-notes-outline",
    });
  });

  draft.movie_genre.forEach((label) => {
    items.push({
      id: `film-${label}`,
      label,
      icon: "film-outline",
    });
  });

  draft.literature.forEach((label) => {
    items.push({
      id: `literature-${label}`,
      label,
      icon: "book-outline",
    });
  });

  if (draft.art) {
    items.push({
      id: "art",
      label: VISUAL_ARTS_LABEL,
      icon: "color-palette-outline",
    });
  }

  return items;
}
