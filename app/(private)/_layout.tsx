import { useAuth } from "@/app/components/AuthContext";
import { useThemeColor } from "@/app/hooks/useThemeColor";
import { sessionService } from "@/app/services/sessionService";
import useSettingsStore from "@/app/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useEffect } from "react";

export default function PrivateLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { pinEnabled } = useSettingsStore();
  const tabIconColor = useThemeColor({}, "tabIconDefault");
  const tabIconSelectedColor = useThemeColor({}, "tabIconSelected");
  const backgroundColor = useThemeColor({}, "background");
  const borderTopColor = useThemeColor({}, "border");

  // Si no está autenticado, redirigir al onboarding
  if (!isAuthenticated) {
    return <Redirect href="/(public)/onboarding/welcome" />;
  }

  // Setup session service for security monitoring
  useEffect(() => {
    if (pinEnabled) {
      sessionService.setInactivityCallback(() => {
        router.replace('/(private)/enter-pin');
      });
      sessionService.startInactivityTimer();
    }

    return () => {
      sessionService.cleanup();
    };
  }, [pinEnabled, router]);

  // Setup session service for security monitoring
  useEffect(() => {
    if (pinEnabled) {
      sessionService.setInactivityCallback(() => {
        router.replace('/(private)/enter-pin');
      });
      sessionService.startInactivityTimer();
    }

    return () => {
      sessionService.cleanup();
    };
  }, [pinEnabled, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabIconSelectedColor,
        tabBarInactiveTintColor: tabIconColor,
        tabBarStyle: { 
          backgroundColor,
          borderTopColor,
          borderTopWidth: 0.5,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor,
          borderBottomColor: borderTopColor,
          borderBottomWidth: 0.5,
        },
        headerTintColor: tabIconSelectedColor,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="edit-profile"
        options={{
          headerTitle: "Editar Perfil",
          href: null,
          tabBarStyle: { display: "none" },
          headerStyle: {
            backgroundColor,
            borderBottomColor: borderTopColor,
            borderBottomWidth: 0.5,
          },
          headerTintColor: tabIconSelectedColor,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Tabs.Screen
        name="security-settings"
        options={{
          headerTitle: "Seguridad",
          href: null,
          tabBarStyle: { display: "none" },
          headerStyle: {
            backgroundColor,
            borderBottomColor: borderTopColor,
            borderBottomWidth: 0.5,
          },
          headerTintColor: tabIconSelectedColor,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Tabs.Screen
        name="change-pin"
        options={{
          headerTitle: "Cambiar PIN",
          href: null,
          tabBarStyle: { display: "none" },
          headerStyle: {
            backgroundColor,
            borderBottomColor: borderTopColor,
            borderBottomWidth: 0.5,
          },
          headerTintColor: tabIconSelectedColor,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Tabs.Screen
        name="enter-pin"
        options={{
          headerTitle: "",
          href: null,
          tabBarStyle: { display: "none" },
          headerStyle: {
            backgroundColor,
            borderBottomColor: borderTopColor,
            borderBottomWidth: 0.5,
          },
          headerTintColor: tabIconSelectedColor,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Tabs>
  );
}
