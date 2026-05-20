import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity
} from "react-native";

type Movie = {
  id: number;
  title: string;
  year: string;
  director: string;
  poster_path: string;
};

type Props = {
  movie: Movie;
};

export default function MovieDisplay({ movie }: Props) {
    return (
        <TouchableOpacity style={styles.movieDisplay}>

            <Image
                source={ { uri: movie.poster_path }}
                style={styles.moviePoster}
            />

            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>
                    {movie.title} ({movie.year})
                </Text>

                <Text style={styles.sub}>
                    dir. {movie.director}
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
