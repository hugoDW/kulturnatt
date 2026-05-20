import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  StatusBar,
} from "react-native";

// Definiera typer för genre-kategorier
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

export default function LiteratureInterestScreen({ 
  onSave, 
  onBack,
  initialSelectedGenres = [] 
}: Props) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialSelectedGenres);
  const [searchQuery, setSearchQuery] = useState("");

  // Alla tillgängliga genrer
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
      ],
    },
    {
      title: "Graphic Novels & Comics",
      icon: "📙",
      items: ["Graphic Novels", "Manga", "Comics"],
    },
  ];

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const isSelected = (genre: string) => selectedGenres.includes(genre);

  const handleDone = () => {
    console.log("Sparade genrer:", selectedGenres);
    console.log("Antal valda genrer:", selectedGenres.length);
    onSave?.(selectedGenres);
  };

  // Filtrera genrer baserat på sökning
  const filterGenres = (items: string[]): string[] => {
    if (!searchQuery) return items;
    return items.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header med tillbaka-pil, titel och Done */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Literature</Text>
        <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
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

        {/* Search Bar med förstoringsglas */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search literature types..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Visa antal valda */}
        {selectedGenres.length > 0 && (
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              Selected {selectedGenres.length} genre{selectedGenres.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Genre-sektioner med ikoner - MINDRE STORLEKAR */}
        {allGenres.map((category) => {
          const filteredItems = filterGenres(category.items);
          if (filteredItems.length === 0) return null;
          
          return (
            <View key={category.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{category.icon}</Text>
                <Text style={styles.sectionTitle}>{category.title}</Text>
              </View>
              <View style={styles.genreGrid}>
                {filteredItems.map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreChip,
                      isSelected(genre) && styles.genreChipSelected,
                    ]}
                    onPress={() => toggleGenre(genre)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        isSelected(genre) && styles.genreTextSelected,
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Rektangulär knapp längst ner */}
        <TouchableOpacity style={styles.bottomButton} onPress={handleDone}>
          <Text style={styles.bottomButtonText}>Save Preferences</Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  backButton: {
    padding: 8,
    marginLeft: -8,
  },

  backButtonText: {
    fontSize: 36,
    color: "#000000",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },

  doneButton: {
    padding: 8,
    marginRight: -8,
  },

  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 16,
  },

  searchIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },

  searchIcon: {
    fontSize: 16,
    color: "#999",
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 16,
    color: "#000000",
  },

  selectedCountContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  selectedCountText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C2C2C",
  },

  section: {
    marginBottom: 20, // MINDRE: från 28 till 20
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8, // MINDRE: från 12 till 8
  },

  sectionIcon: {
    fontSize: 18, // MINDRE: från 22 till 18
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: 16, // MINDRE: från 18 till 16
    fontWeight: "700",
    color: "#000000",
  },

  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },

  genreChip: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16, // MINDRE: från 20 till 16
    paddingHorizontal: 12, // MINDRE: från 16 till 12
    paddingVertical: 6, // MINDRE: från 10 till 6
    margin: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  genreChipSelected: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },

  genreText: {
    fontSize: 12, // MINDRE: från 14 till 12
    fontWeight: "500",
    color: "#333333",
  },

  genreTextSelected: {
    color: "#FFFFFF",
  },

  bottomButton: {
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  bottomButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});