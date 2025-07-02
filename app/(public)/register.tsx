import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';

import { useAuth } from '@/app/components/AuthContext';
import { FormField } from '@/app/components/FormField';
import { ImageFile, ImagePickerModal } from '@/app/components/ImagePickerModal';
import { TermsText } from '@/app/components/TermsText';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { Strings } from '@/app/constants/Strings';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { useThemedAsset } from '@/app/hooks/useThemedAsset';

// Placeholder para los logos hasta que el usuario los coloque
const logoLight = require('@/assets/images/icon-light.png');
const logoDark = require('@/assets/images/icon-dark.png');

// Esquema de validación con Yup
const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email(Strings.auth.validation.emailInvalid)
    .required(Strings.auth.validation.emailRequired),
  firstName: Yup.string()
    .required(Strings.auth.validation.firstNameRequired),
  lastName: Yup.string()
    .required(Strings.auth.validation.lastNameRequired),
  password: Yup.string()
    .min(6, Strings.auth.validation.passwordMin)
    .required(Strings.auth.validation.passwordRequired),
  confirmPassword: Yup.string()
    .required(Strings.auth.validation.confirmPasswordRequired)
    .oneOf([Yup.ref('password')], Strings.auth.validation.passwordsNoMatch),
});

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const logo = useThemedAsset(logoLight, logoDark);
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [avatar, setAvatar] = useState<ImageFile | null>(null);

  const handleRegister = async (values: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
  }) => {
    setIsLoading(true);
    
    try {
      const success = await register(
        values.email,
        values.password,
        {
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
        },
        avatar
      );
      
      if (!success) {
        Alert.alert(Strings.common.error, Strings.auth.errors.registerFailed);
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert(Strings.common.error, Strings.auth.errors.registerFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/(public)/login' as any);
  };

  const handleOpenImagePicker = () => {
    setModalVisible(true);
  };

  const handleImageSelected = (image: ImageFile) => {
    setAvatar(image);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        
        <ThemedText type="title" style={styles.title}>
          {Strings.auth.register.title}
        </ThemedText>

        {/* Avatar selector */}
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={handleOpenImagePicker}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {avatar ? (
            <Image 
              source={{ uri: avatar.uri }} 
              style={[styles.avatar, { borderColor }]} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar, { borderColor, backgroundColor: backgroundSecondary }]}>
              <Ionicons name="person" size={50} color={iconColor} />
            </View>
          )}
          <View style={[
            styles.avatarEditIcon,
            { backgroundColor: tintColor, borderColor: backgroundColor },
            isLoading ? { opacity: 0.7 } : undefined
          ]}>
            <Ionicons name="camera" size={16} color={backgroundColor} />
          </View>
        </TouchableOpacity>
        
        <Formik
          initialValues={{ 
            email: '', 
            firstName: '', 
            lastName: '', 
            password: '', 
            confirmPassword: '' 
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleRegister}
        >
          {(formikProps) => (
            <View style={styles.formContainer}>
              <FormField
                label="Email"
                formikKey="email"
                formikProps={formikProps}
                placeholder={Strings.auth.register.emailPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={iconColor} />}
                editable={!isLoading}
              />
              
              <FormField
                label="Nombre"
                formikKey="firstName"
                formikProps={formikProps}
                placeholder={Strings.auth.register.firstNamePlaceholder}
                autoCapitalize="words"
                leftIcon={<Ionicons name="person-outline" size={20} color={iconColor} />}
                editable={!isLoading}
              />
              
              <FormField
                label="Apellido"
                formikKey="lastName"
                formikProps={formikProps}
                placeholder={Strings.auth.register.lastNamePlaceholder}
                autoCapitalize="words"
                leftIcon={<Ionicons name="person-outline" size={20} color={iconColor} />}
                editable={!isLoading}
              />
              
              <FormField
                label="Contraseña"
                formikKey="password"
                formikProps={formikProps}
                placeholder={Strings.auth.register.passwordPlaceholder}
                secureTextEntry={true}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
                editable={!isLoading}
              />
              
              <FormField
                label="Confirmar Contraseña"
                formikKey="confirmPassword"
                formikProps={formikProps}
                placeholder={Strings.auth.register.confirmPasswordPlaceholder}
                secureTextEntry={true}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
                editable={!isLoading}
              />
              
              <ThemedButton
                title={Strings.auth.register.registerButton}
                onPress={() => formikProps.handleSubmit()}
                loading={isLoading}
                disabled={isLoading || !formikProps.isValid || formikProps.isSubmitting}
                style={styles.registerButton}
                size="large"
              />
            </View>
          )}
        </Formik>
        
        <View style={styles.loginContainer}>
          <ThemedText>{Strings.auth.register.hasAccount} </ThemedText>
          <TouchableOpacity 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <ThemedText 
              type="link"
              style={isLoading ? { opacity: 0.7 } : undefined}
            >
              {Strings.auth.register.loginAction}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <TermsText onTermsPress={() => Alert.alert('Términos', 'Aquí se mostrarían los términos y condiciones.')} />
      </ScrollView>

      {/* Modal para seleccionar imagen */}
      <ImagePickerModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onImageSelected={handleImageSelected}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  registerButton: {
    marginTop: 10,
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
  },
}); 