/**
 * Constantes de texto para la aplicación
 * Centralizadas para facilitar la internacionalización y mantenimiento
 */

export const Strings = {
  app: {
    name: 'Peyo Pagos',
  },
  common: {
    loading: 'Cargando datos...',
    next: 'Siguiente',
    skip: 'Saltar',
    start: 'Comenzar',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    submit: 'Enviar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    error: 'Error',
    success: 'Éxito',
  },
  welcome: {
    title: '¡Bienvenido a Peyo Pagos!',
    subtitle: 'Tu compañero financiero para un mejor manejo de tus finanzas.',
  },
  onboarding: {
    screens: [
      {
        title: 'Bienvenido a CashRush',
        subtitle: 'Tu nueva forma de gestionar y administrar tu dinero de manera inteligente.',
      },
      {
        title: 'Gestión Financiera Sin Esfuerzo',
        subtitle: 'Controla tus gastos y optimiza tu presupuesto de forma sencilla y eficiente.',
      },
      {
        title: 'Finanzas Impulsadas por Tecnología',
        subtitle: 'Herramientas digitales avanzadas para tomar mejores decisiones financieras.',
      },
      {
        title: 'Tu Compañero Financiero',
        subtitle: 'Alcanza tus metas y celebra tus logros financieros con nuestra ayuda.',
      },
    ],
  },
  auth: {
    login: {
      title: 'Bienvenido a Peyo Pagos',
      emailPlaceholder: 'Correo electrónico',
      passwordPlaceholder: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿Aún no tienes una cuenta?',
      registerAction: 'Regístrate!',
      loginButton: 'Iniciar Sesión',
    },
    register: {
      title: 'Crear una cuenta',
      emailPlaceholder: 'Correo electrónico',
      firstNamePlaceholder: 'Nombre',
      lastNamePlaceholder: 'Apellido',
      passwordPlaceholder: 'Contraseña',
      confirmPasswordPlaceholder: 'Confirmar contraseña',
      hasAccount: '¿Ya tienes una cuenta?',
      loginAction: 'Inicia sesión',
      registerButton: 'Registrarse',
      avatarTitle: 'Foto de perfil',
      avatarText: 'Opcional',
    },
    validation: {
      emailRequired: 'El correo es obligatorio',
      emailInvalid: 'Ingresa un correo electrónico válido',
      passwordRequired: 'La contraseña es obligatoria',
      passwordMin: 'La contraseña debe tener al menos 6 caracteres',
      firstNameRequired: 'El nombre es obligatorio',
      lastNameRequired: 'El apellido es obligatorio',
      confirmPasswordRequired: 'Confirma tu contraseña',
      passwordsNoMatch: 'Las contraseñas no coinciden',
    },
    errors: {
      loginFailed: 'Email o contraseña incorrectos',
      registerFailed: 'Error al registrar usuario',
    },
  },
};

export default Strings; 