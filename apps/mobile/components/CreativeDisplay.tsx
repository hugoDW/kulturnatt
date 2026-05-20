import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity
} from "react-native";

type Creative = {
  id: number;
  name: string;
  date_of_birth: string;
  profile_path: string;
};

export default function CreativeDisplay({ creative, onAdd }: Props) {
    return (
        <TouchableOpacity
          style={styles.movieDisplay}
          onPress={() => onAdd(creative)}
          >

            <Image
                source={ { uri: creative.profile_path }}
                style={styles.moviePoster}
            />

            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>
                    {creative.name}
                </Text>
                <Text style={styles.sub}>
                    born {creative.date_of_birth}
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