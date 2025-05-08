import React from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Ticket } from "./TicketItem";

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StatsRowProps {
  tickets: Ticket[];
  onTabChange?: (tab: 'all' | 'open' | 'in-progress' | 'closed') => void;
}

const StatsRow: React.FC<StatsRowProps> = ({ tickets, onTabChange }) => {
  const openCount = tickets.filter((t) => t.durumAdi === "Açık").length;

  const inProgressCount = tickets.filter((t) => {
    const processingStatuses = [
      "İşlemde",
      "İşleme Alındı",
      "Test Ediliyor",
      "İşleniyor",
      "Değerlendiriliyor",
    ];
    return processingStatuses.some((status) =>
      t.durumAdi.toLowerCase().includes(status.toLowerCase())
    );
  }).length;

  const closedCount = tickets.filter((t) => {
    const closedStatuses = ["Kapatıldı", "Çözüldü", "Reddedildi"];
    return closedStatuses.includes(t.durumAdi);
  }).length;

  return (
    <>
      <Text style={styles.statsTitle}>Talep Durumları</Text>
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => onTabChange && onTabChange('open')}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{openCount}</Text>
          <Text style={styles.statLabel}>Açık Talepler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => onTabChange && onTabChange('in-progress')}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>İşlemdeki</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => onTabChange && onTabChange('closed')}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{closedCount}</Text>
          <Text style={styles.statLabel}>Çözüldü</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SCREEN_WIDTH * 0.03,
    width: "100%",
  },
  statsTitle: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: "bold",
    color: "#333",
    marginBottom: SCREEN_WIDTH * 0.005,
    marginLeft: SCREEN_WIDTH * 0.02,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: SCREEN_WIDTH * 0.025,
    flex: 1,
    margin: SCREEN_WIDTH * 0.008,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  statValue: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: "bold",
    color: "#333",
    marginBottom: SCREEN_WIDTH * 0.005,
  },
  statLabel: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: "#666",
    textAlign: "center",
  },
});

export default StatsRow;
