import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { setUserData } from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        <View style={styles.topBar}>
          <View style={styles.userInfo}>
            <TouchableOpacity
              style={styles.userInfoButton}
              onPress={() => router.push("profile" as any)}
            >
              <Ionicons name="person-circle-outline" size={37} color="#000" />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {userData?.adSoyad || "Tanımlı Değildir"}
                </Text>
                <Text style={styles.userRole}>{userData?.gorev || ""}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.weatherInfo}>
            <Ionicons name="calendar-outline" size={24} color="#000" />
            <View>
              <Text style={styles.weatherText}>
                {currentTime.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
              <Text style={styles.timeText}>
                {currentTime.toLocaleDateString('tr-TR', {
                  weekday: 'long',

                })}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={styles.information}
        >
          <LinearGradient
            colors={["#FF0000", "#FF4500"]}
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

        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/ASD-Logo-Website 221.png")}
            style={styles.logo}
          />
          <Text style={styles.logoSubtext}>Version 1.0.1</Text>
          <Text style={styles.logoSubtext}>Update Date: 07.07.2025</Text>
        </View>
      </SafeAreaView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomLineRed} />
        <View style={styles.bottomLineGrey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  safeArea: {
    flex: 1,
    marginTop: 40, // Add space for status bar
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Baloo2-SemiBold",
  },
  userRole: {
    fontSize: 12,
    color: "#666",
  },
  weatherInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  weatherText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    width: 100,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  card: {
    width: "80%",
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  gradientCard: {
    padding: 16,
    borderRadius: 12,
  },
  alertCard: {
    paddingVertical: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  alertText: {
    color: "#FFF",
    marginTop: 4,
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
    marginLeft: 16,
    fontFamily: "Baloo2-Regular",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
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
    width: 120,
    height: 50,
    resizeMode: "contain",
    marginBottom: 5,
  },
  modalContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  information: {
    width: "90%",
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  bottomLineRed: {
    flex: 3,
    color: "#FF1A00",
  },
  bottomLineGrey: {
    flex: 1,
    color: "#808080",
  },
  userInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    fontFamily: "Baloo2-Regular",
  },
});
