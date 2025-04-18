import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setUserData } from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth } = Dimensions.get('window');

export default function Portal() {
  const router = useRouter();
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.user.userData);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          dispatch(setUserData(JSON.parse(storedUserData)));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    if (!userData) {
      loadUserData();
    }
  }, [userData, dispatch]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const navigateTo = (path: string): void => {
    if (path.startsWith("./")) {
      path = path.substring(2);
    }
    router.push(path as any);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/portal.png")}
            style={styles.logo}
          />
        </View>
        <View style={styles.topBar}>
          <View style={styles.userInfo}>
            <TouchableOpacity
              style={styles.userInfoButton}
              onPress={() => router.push("profile" as any)}
            >
              <View style={styles.userDetails}>
                <Ionicons name="person-circle-outline" size={37} color="#000" />
                <Text style={styles.userName}>
                  {userData?.adSoyad || "Tanımlı Değildir"}
                </Text>
              </View>

              <View style={styles.userDetails}>
                <Text style={styles.userRole}>{userData?.gorev || ""}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.information}>
          <LinearGradient
            colors={["#EAE860", "#EAE860"]}
            style={[styles.gradientCard, styles.alertCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.cardTitle}>Duyurular</Text>
            <Text style={styles.alertText}>
              20/06/2024 tarihinden itibaren 2.5 saat içinde QR gösteremezsiniz
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("./b-kalite")}
          >
            <LinearGradient
              colors={["#A1FDFF", "#00837D"]}
              style={styles.gradientCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>B</Text>
                <Text style={styles.cardLabel}>B Kalite</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/taseron-takip")}
          >
            <LinearGradient
              colors={["#EAE860", "#FF9D00"]}
              style={styles.gradientCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.cardContent}>
                <MaterialCommunityIcons
                  name="hard-hat"
                  size={27}
                  color="#000"
                />
                <Text style={styles.cardLabel}>Taşeron Takip</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/helpdesk")}
          >
            <LinearGradient
              colors={["#E7503D", "#843E36"]}
              style={styles.gradientCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.cardContent}>
                <Ionicons name="headset" size={27} color="#000" />
                <Text style={styles.cardLabel}>Help Desk</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    width: screenWidth,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: screenWidth * 0.2,
  },
  topBar: {
    flexDirection: "row",
    backgroundColor: "#d9d9d9",
    marginHorizontal: screenWidth * 0.05,
    borderRadius: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Baloo2-SemiBold",
    marginLeft: screenWidth * 0.02,
  },
  userRole: {
    fontSize: 12,
    color: "#666",
  },

  timeText: {
    marginLeft: screenWidth * 0.02,
    fontSize: 13,
    color: "#666",
  },
  card: {
    width: screenWidth * 0.8,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  gradientCard: {
    padding: screenWidth * 0.04,
    borderRadius: 12,
  },
  alertCard: {
    paddingVertical: screenWidth * 0.05,
  },
  cardTitle: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
  },
  alertText: {
    color: "#525252",
    marginTop: screenWidth * 0.01,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardIcon: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "Baloo2-Regular",
  },
  cardLabel: {
    fontSize: 22,
    color: "#FFF",
    marginLeft: screenWidth * 0.04,
    fontFamily: "Baloo2-Regular",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: screenWidth * 0.05,
    marginBottom: screenWidth * 0.05,
  },
  logoSubtext: {
    fontSize: 12,
    color: "#999",
  },
  bottomBar: {
    height: 18,
    flexDirection: "row",
  },
  logo: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.25,
    resizeMode: "contain",
    marginVertical: screenWidth * 0.05,
  },
  modalContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#d9d9d9",
    borderTopWidth: 1,
    paddingVertical: screenWidth * 0.05,
    marginHorizontal: screenWidth * 0.25,
  },
  information: {
    width: screenWidth * 0.9,
    borderRadius: 12,
    marginHorizontal: screenWidth * 0.05,
    marginVertical: screenWidth * 0.075,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  bottomLineRed: {
    color: "#FF1A00",
  },
  bottomLineGrey: {
    color: "#808080",
  },
  userInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: screenWidth * 0.02,
    paddingHorizontal: screenWidth * 0.04,
    fontFamily: "Baloo2-Regular",
    justifyContent: "space-between",
    width: "100%",
  },
  settingsButton: {
    position: "absolute",
    bottom: screenWidth * 0.075,
    right: screenWidth * 0.05,
    width: screenWidth * 0.15,
    height: screenWidth * 0.15,
    borderRadius: 50,
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    color: "#000",
    textAlign: "center",
    marginBottom: screenWidth * 0.025,
  },
});
