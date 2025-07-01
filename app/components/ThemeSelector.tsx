import { useThemeColor } from '@/app/hooks/useThemeColor';
import { ThemeMode, useThemeStore } from '@/app/store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

export function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const getButtonStyle = (buttonTheme: ThemeMode) => [
    styles.themeButton,
    { 
      backgroundColor,
      borderColor: theme === buttonTheme ? tintColor : 'transparent',
    }
  ];

  const getIconColor = (buttonTheme: ThemeMode) => {
    return theme === buttonTheme ? tintColor : textColor;
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Tema de la aplicación</ThemedText>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={getButtonStyle('light')}
          onPress={() => handleThemeChange('light')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="sunny-outline" 
            size={24} 
            color={getIconColor('light')} 
          />
          <ThemedText style={styles.buttonText}>Claro</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={getButtonStyle('dark')}
          onPress={() => handleThemeChange('dark')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="moon-outline" 
            size={24} 
            color={getIconColor('dark')} 
          />
          <ThemedText style={styles.buttonText}>Oscuro</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={getButtonStyle('auto')}
          onPress={() => handleThemeChange('auto')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="contrast-outline" 
            size={24} 
            color={getIconColor('auto')} 
          />
          <ThemedText style={styles.buttonText}>Auto</ThemedText>
        </TouchableOpacity>
      </View>
      
      <ThemedText style={styles.helperText}>
        {theme === 'auto' 
          ? 'El tema se ajustará automáticamente según la configuración de tu dispositivo.'
          : `El tema ${theme === 'light' ? 'claro' : 'oscuro'} se mantendrá sin importar la configuración del dispositivo.`
        }
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
  },
  title: {
    marginBottom: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});

export default ThemeSelector; 