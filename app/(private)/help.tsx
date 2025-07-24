import { ThemedText } from "@/app/components/ThemedText";
import { ThemedView } from "@/app/components/ThemedView";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SupportOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  description: string;
  onPress: () => void;
}

interface Topic {
  id: string;
  question: string;
  answer: string;
  expanded: boolean;
}

export default function HelpScreen() {
  // TODO: Replace with user context/store
  const userName = "María";
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useState<Topic[]>([
    {
      id: "verification",
      question: "¿Cómo verificar mi cuenta?",
      answer:
        "Completa el proceso de verificación subiendo tu documento de identidad y comprobante de domicilio.",
      expanded: false,
    },
    {
      id: "qr",
      question: "¿Cómo realizar pagos con QR?",
      answer:
        "Escanea el código QR del destinatario, ingresa el monto y confirma la transferencia.",
      expanded: false,
    },
    {
      id: "security",
      question: "Configurar seguridad de cuenta",
      answer:
        "Activa la autenticación de dos factores y configura tu PIN para mayor seguridad.",
      expanded: false,
    },
    {
      id: "virtual-card",
      question: "¿Cómo funciona la tarjeta virtual?",
      answer:
        "La tarjeta virtual te permite realizar compras online usando el saldo de tu billetera.",
      expanded: false,
    },
  ]);

  const backgroundColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const subtextColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");
  const blue = "#E3F0FF";
  const purple = "#F0E3FF";
  const blueIcon = "#1976D2";
  const purpleIcon = "#8E24AA";
  const inputBg = useThemeColor({}, "card");
  const inputBorder = useThemeColor({}, "border");

  const handleSupportPress = (id: string) => {
    // TODO: Navigation for live chat and FAQ
    if (id === "chat") {
      // Navigate to live chat
    } else if (id === "faq") {
      // Navigate to FAQ
    }
  };

  const handleTopicPress = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, expanded: !t.expanded } : t
      )
    );
  };

  const supportOptions: SupportOption[] = [
    {
      id: "chat",
      icon: "chatbubble-outline",
      iconBg: blue,
      title: "Chat en vivo",
      description: "Habla con un agente",
      onPress: () => handleSupportPress("chat"),
    },
    {
      id: "faq",
      icon: "help-circle-outline",
      iconBg: purple,
      title: "Preguntas frecuentes",
      description: "Encuentra respuestas rápidas",
      onPress: () => handleSupportPress("faq"),
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}> 
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <ThemedText style={styles.greeting}>
              ¡Hola {userName}! <ThemedText style={{ fontSize: 22, lineHeight: 28 }}>👋</ThemedText>
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtextColor }]}>¿Cómo podemos ayudarte?</ThemedText>
          </View>

          {/* Quick Support Options */}
          <View style={styles.supportOptionsContainer}>
            {supportOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.supportCard, { backgroundColor: cardColor, borderColor }]}
                onPress={option.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: option.id === "chat" ? blue : purple }]}> 
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={option.id === "chat" ? blueIcon : purpleIcon}
                  />
                </View>
                <View style={styles.supportCardContent}>
                  <ThemedText style={styles.supportCardTitle}>{option.title}</ThemedText>
                  <ThemedText style={[styles.supportCardDesc, { color: subtextColor }]}>{option.description}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={subtextColor} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Section */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={subtextColor} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
              placeholder="Buscar ayuda..."
              placeholderTextColor={subtextColor}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {/* Popular Topics Section */}
          <View style={styles.topicsSection}>
            <ThemedText style={styles.topicsTitle}>Temas populares</ThemedText>
            <View style={styles.topicsList}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.topicCard, { backgroundColor: cardColor, borderColor }]}
                  onPress={() => handleTopicPress(topic.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.topicRow}>
                    <ThemedText style={styles.topicQuestion}>{topic.question}</ThemedText>
                    <Ionicons
                      name={topic.expanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={subtextColor}
                    />
                  </View>
                  {topic.expanded && (
                    <ThemedText style={[styles.topicAnswer, { color: subtextColor }]}>{topic.answer}</ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  supportOptionsContainer: {
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  supportCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 0,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  supportCardContent: {
    flex: 1,
  },
  supportCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  supportCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 28,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    borderRadius: 12,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  topicsSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  topicsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  topicsList: {
    gap: 12,
  },
  topicCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 0,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topicQuestion: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  topicAnswer: {
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
}); 