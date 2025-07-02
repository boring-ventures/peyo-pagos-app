import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Yup from 'yup';

import { FormField } from '@/app/components/FormField';
import { ImageFile, ImagePickerModal } from '@/app/components/ImagePickerModal';
import { ThemedButton } from '@/app/components/ThemedButton';
import { ThemedText } from '@/app/components/ThemedText';
import { ThemedView } from '@/app/components/ThemedView';
import { UserAvatar } from '@/app/components/UserAvatar';
import { useThemeColor } from '@/app/hooks/useThemeColor';
import { authService } from '@/app/services/authService';
import { useAuthStore } from '@/app/store/authStore';

// Validation schema
const ProfileSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('El nombre es obligatorio'),
  lastName: Yup.string()
    .required('El apellido es obligatorio'),
});

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [avatar, setAvatar] = useState<ImageFile | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  // Redirect if user or profile is not available
  useEffect(() => {
    if (!user || !profile) {
      router.replace('/(private)/profile');
    }
  }, [user, profile, router]);

  const handleImageSelected = (image: ImageFile) => {
    setAvatar(image);
    setAvatarChanged(true);
  };

  const handleSaveProfile = async (values: { firstName: string; lastName: string }) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let avatarUrl = profile?.avatar_url || undefined;
      
      // Upload avatar if changed
      if (avatarChanged && avatar) {
        console.log('Uploading new avatar...');
        const uploadedPath = await authService.uploadFile(
          avatar,
          user.id,
          avatar.type
        );
        
        if (!uploadedPath) {
          throw new Error('Error al subir la imagen de perfil');
        }
        
        console.log('Avatar uploaded successfully, path:', uploadedPath);
        avatarUrl = uploadedPath;
      }
      
      // Update profile in database
      console.log('Updating profile in database with avatar:', avatarUrl);
      const { error } = await authService.updateProfile(user.id, {
        first_name: values.firstName,
        last_name: values.lastName,
        avatar_url: avatarUrl,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update profile in store
      useAuthStore.getState().updateProfile({
        first_name: values.firstName,
        last_name: values.lastName,
        email: profile?.email || user.email || '',
        avatar_url: avatarUrl,
      });
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      router.back();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el perfil';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // If profile is not loaded yet, show loading state
  if (!profile) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  const initialValues = {
    firstName: profile.first_name,
    lastName: profile.last_name,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.screenTitle}>
          Editar Perfil
        </ThemedText>

        {/* Avatar selector */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            onPress={() => setModalVisible(true)}
            disabled={isLoading}
          >
            {avatarChanged && avatar ? (
              <Image 
                source={{ uri: avatar.uri }} 
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 2,
                  borderColor: borderColor,
                }}
                resizeMode="cover"
              />
            ) : (
              <UserAvatar 
                imageUrl={profile.avatar_url}
                firstName={profile.first_name}
                lastName={profile.last_name}
                size={120}
              />
            )}
            <View style={[
              styles.avatarEditIcon,
              { backgroundColor: tintColor, borderColor: backgroundColor },
              isLoading ? { opacity: 0.7 } : undefined
            ]}>
              <Ionicons name="camera" size={18} color={backgroundColor} />
            </View>
          </TouchableOpacity>
          <ThemedText style={styles.avatarHelperText}>
            Toca para cambiar la foto de perfil
          </ThemedText>
        </View>

        <Formik
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          onSubmit={handleSaveProfile}
        >
          {(formikProps) => {
            const hasChanges = 
              JSON.stringify(initialValues) !== JSON.stringify(formikProps.values) || 
              avatarChanged;
            
            return (
              <View style={styles.formContainer}>
                <FormField
                  label="Nombre"
                  formikKey="firstName"
                  formikProps={formikProps}
                  placeholder="Ingresa tu nombre"
                  leftIcon={<Ionicons name="person-outline" size={20} color={iconColor} />}
                  editable={!isLoading}
                />
                
                <FormField
                  label="Apellido"
                  formikKey="lastName"
                  formikProps={formikProps}
                  placeholder="Ingresa tu apellido"
                  leftIcon={<Ionicons name="people-outline" size={20} color={iconColor} />}
                  editable={!isLoading}
                />
                
                <View style={styles.buttonsContainer}>
                  <ThemedButton
                    title="Cancelar"
                    onPress={() => router.back()}
                    type="outline"
                    style={styles.button}
                    disabled={isLoading}
                  />
                  
                  <ThemedButton
                    title="Guardar Cambios"
                    onPress={() => formikProps.handleSubmit()}
                    type="primary"
                    style={styles.button}
                    loading={isLoading}
                    disabled={isLoading || !hasChanges || !formikProps.isValid}
                  />
                </View>
              </View>
            );
          }}
        </Formik>
      </ScrollView>

      {/* Image picker modal */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
  avatarHelperText: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.7,
  },
  formContainer: {
    width: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 