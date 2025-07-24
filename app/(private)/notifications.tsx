import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface NotificationItem {
  id: string;
  type: "transfer" | "recharge" | "promotion";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

const notifications: NotificationItem[] = [
  {
    id: "1",
    type: "transfer",
    title: "Transferencia recibida",
    description: "Recibiste $2,500.00 de Juan Pérez",
    timestamp: "Hace 2 horas",
    isRead: false,
  },
  {
    id: "2",
    type: "recharge",
    title: "Recarga exitosa",
    description: "Tu recarga de $1,000.00 fue procesada correctamente",
    timestamp: "Ayer",
    isRead: false,
  },
  {
    id: "3",
    type: "promotion",
    title: "Nueva promoción disponible",
    description: "¡20% de descuento en recargas hasta el 31/12!",
    timestamp: "Hace 3 días",
    isRead: true,
  },
  {
    id: "4",
    type: "transfer",
    title: "Transferencia enviada",
    description: "Enviaste $500.00 a María García",
    timestamp: "Hace 1 día",
    isRead: true,
  },
  {
    id: "5",
    type: "recharge",
    title: "Recarga pendiente",
    description: "Tu recarga de $750.00 está siendo procesada",
    timestamp: "Hace 4 días",
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  const getNotificationColor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "transfer":
        return "#007AFF"; // Blue
      case "recharge":
        return "#4CAF50"; // Green
      case "promotion":
        return "#FF9800"; // Orange
      default:
        return "#007AFF";
    }
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    // TODO: Navigate to notification details or mark as read
    console.log("Notification pressed:", notification.id);
  };

  const renderNotificationCard = (notification: NotificationItem) => {
    const notificationColor = getNotificationColor(notification.type);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          {
            backgroundColor: cardColor,
            borderColor,
          },
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Notification Indicator */}
          <View style={styles.indicatorContainer}>
            <View
              style={[
                styles.indicator,
                {
                  backgroundColor: notification.isRead ? subtextColor : notificationColor,
                },
              ]}
            />
          </View>

          {/* Notification Content */}
          <View style={styles.contentContainer}>
            <ThemedText style={styles.notificationTitle}>
              {notification.title}
            </ThemedText>
            <ThemedText
              style={[styles.notificationDescription, { color: subtextColor }]}
            >
              {notification.description}
            </ThemedText>
            <ThemedText
              style={[styles.timestamp, { color: subtextColor }]}
            >
              {notification.timestamp}
            </ThemedText>
          </View>

          {/* Chevron Icon */}
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={subtextColor}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={subtextColor}
        />
      </View>
      <ThemedText style={[styles.emptyStateTitle, { color: textColor }]}>
        No hay notificaciones
      </ThemedText>
      <ThemedText
        style={[styles.emptyStateDescription, { color: subtextColor }]}
      >
        Cuando recibas notificaciones, aparecerán aquí
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            Notificaciones
          </ThemedText>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length > 0 ? (
            <View style={styles.notificationsContainer}>
              {notifications.map(renderNotificationCard)}
            </View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  notificationsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  notificationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  indicatorContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: "500",
  },
  chevronContainer: {
    marginLeft: 12,
    marginTop: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
}); 