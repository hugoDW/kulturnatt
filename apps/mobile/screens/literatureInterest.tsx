import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import SaveAndContinueButton from "../components/saveAndContinueButton";
import { useProfileCreation } from "../lib/profileCreation";

// Definierar typer för genre-kategorier
type GenreCategory = {
  title: string;
  items: string[];
  icon: string;
};

type Props = {
  onSave?: (selectedGenres: string[]) => void;
  onBack?: () => void;
  initialSelectedGenres?: string[];
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "LiteratureInterest">;

export default function LiteratureInterestScreen({ 
  onSave, 
  onBack,
  initialSelectedGenres = [] 
}: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { draft } = useProfileCreation();
  const initialGenres =
    draft.literature.length > 0 ? draft.literature : initialSelectedGenres;
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [previousGenres, setPreviousGenres] = useState<string[]>(initialGenres);

  // Alla tillgängliga genrer - kategoriserade
  const allGenres: GenreCategory[] = [
    {
      title: "Fiction",
      icon: "📖",
      items: [
        "Literary Fiction",
        "Science Fiction",
        "Fantasy",
        "Mystery",
        "Thriller",
        "Historical Fiction",
        "Romance",
        "Horror",

      ],
    },
    {
      title: "Non-Fiction",
      icon: "📚",
      items: [
        "Biography & Memoir",
        "History",
        "Philosophy",
        "Science",
        "Self-Help",
        "Essays",
        "True Crime",
        "Travel",
        "Psychology",
      ],
    },
    {
      title: "Poetry & Drama",
      icon: "🍃",
      items: [
        "Contemporary Poetry",
        "Classical Poetry",
        "Plays & Scripts",
        "Spoken Word",
        "Tragedy",
        "Comedy",
        "Epic Poetry",
        "Performance Poetry",
      ],
    },
    {
      title: "Graphic Novels & Comics",
      icon: "📙",
      items: [
        "Graphic Novels",
        "Manga",
        "Comics",
        "Alternative Comics",
        "Biographical Comics",
      ],
    },
  ];

  // Loggar förändringar när selectedGenres ändras
  useEffect(() => {
    const added = selectedGenres.filter(g => !previousGenres.includes(g));
    const removed = previousGenres.filter(g => !selectedGenres.includes(g));

    if (added.length > 0) {
      console.log(`${added.join(", ")}`);
      console.log(`${selectedGenres.join(", ")}`);
    }
    
    if (removed.length > 0) {
      console.log(`${removed.join(", ")}`);
      console.log(`${selectedGenres.join(", ")}`);
    }

    setPreviousGenres(selectedGenres);
  }, [selectedGenres]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const isSelected = (genre: string) => selectedGenres.includes(genre);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header -titel*/}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Literature</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Subtitle */}
        <Text style={styles.headerSubtitle}>
          What type of literature interests you?
        </Text>
        <Text style={styles.headerDescription}>
          Select all genres and forms you enjoy
        </Text>

        {/* Visar antalet valda */}
        {selectedGenres.length > 0 && (
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              Selected {selectedGenres.length} genre{selectedGenres.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Genre-kategorier */}
        {allGenres.map((category) => (
          <View key={category.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{category.icon}</Text>
              <Text style={styles.sectionTitle}>{category.title}</Text>
            </View>
            <View style={styles.genreGrid}>
              {category.items.map((genre) => {
                const selected = isSelected(genre);
                
                return (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreChip,
                      selected && styles.genreChipSelected,
                    ]}
                    onPress={() => toggleGenre(genre)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        selected && styles.genreTextSelected,
                      ]}
                    >
                      {genre}
                    </Text>
                    {/* cirkel med bock när man klickar i en kategori */}
                    {selected && (
                      <View style={styles.checkmarkContainer}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Save knapp längst ned*/}
        <SaveAndContinueButton
          selectedItems={selectedGenres}
          getDraftPatch={() => ({ literature: selectedGenres })}
          alertTitle="Choose a literature interest"
          alertMessage="Select at least one literature genre to continue."
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  headerSubtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },

  headerDescription: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666666",
    marginBottom: 20,
  },

  selectedCountContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  selectedCountText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6C5CE7",
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },

  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },

  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  genreChipSelected: {
    backgroundColor: "#E8E0F7",
    borderColor: "#6C5CE7",
  },

  genreText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333333",
  },

  genreTextSelected: {
    color: "#4A2B8A",
  },

  checkmarkContainer: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  checkmark: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },

  saveButton: {
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
