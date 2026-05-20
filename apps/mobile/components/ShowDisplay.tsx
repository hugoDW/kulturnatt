import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity
} from "react-native";

type Show = {
  id: number;
  name: string;
  first_air_date?: string | null;
  poster_path?: string | null;
};

type Props = {
  show: Show;
  onAdd: (show: Show) => void;
};

export default function ShowDisplay({ show, onAdd }: Props) {
    return (
        <TouchableOpacity
          style={styles.movieDisplay}
          onPress={() => onAdd(show)}
          >

            {show.poster_path ? (
              <Image
                  source={ { uri: show.poster_path }}
                  style={styles.moviePoster}
              />
            ) : (
              <View style={styles.moviePoster} />
            )}

            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>
                    {show.name}
                </Text>

                <Text style={styles.sub}>
                    {show.first_air_date ? `first aired on ${show.first_air_date}` : "First air date unknown"}
                </Text>
            </View>

        </TouchableOpacity>
    )
}



const styles = StyleSheet.create({

  movieDisplay: {
    paddingVertical: 10,
    width: 360,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: "#E9ECEF",
    flexDirection: "row",
    marginBottom: 10
  },

  moviePoster: {
    height: 120,
    width: 80,
    marginLeft: 5
  },

  movieInfo: {
    flex: 1,
    flexDirection: "column"
  },

  movieTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    marginLeft: 5
  },

  sub: {
    fontSize: 15,
    color: "#666",
    marginLeft: 5
  },
});
