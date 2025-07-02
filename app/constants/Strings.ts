/**
 * String constants for the application
 * Centralized for easy internationalization and maintenance
 */

export const Strings = {
  app: {
    name: 'Peyo Pagos',
  },
  common: {
    loading: 'Loading data...',
    next: 'Next',
    skip: 'Skip',
    start: 'Get Started',
    login: 'Login',
    register: 'Sign Up',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    error: 'Error',
    success: 'Success',
  },
  welcome: {
    title: 'Welcome to Peyo!',
    subtitle: 'Discover the future of fast and simple financial management.',
  },
  onboarding: {
    screens: [
      {
        title: 'Welcome to Peyo',
        subtitle: 'Discover the future of fast and simple financial management',
        buttonText: 'Get Started',
      },
      {
        title: 'Effortless Money Management',
        subtitle: 'Say goodbye to complexity. With Peyo, managing your finances becomes effortless',
        buttonText: 'Explore Features',
      },
      {
        title: 'Tech-Driven Finance',
        subtitle: 'Peyo leverages the latest advancements to provide you with a superior experience',
        buttonText: 'Learn More',
      },
      {
        title: 'Your Financial Companion',
        subtitle: 'Peyo is here to simplify your financial decisions and help you achieve financial freedom',
        buttonText: 'Join Now',
      },
    ],
  },
  auth: {
    login: {
      title: 'Welcome to Peyo Pagos',
      emailPlaceholder: 'Email address',
      passwordPlaceholder: 'Password',
      forgotPassword: 'Forgot your password?',
      noAccount: "Don't have an account yet?",
      registerAction: 'Sign up!',
      loginButton: 'Login',
    },
    register: {
      title: 'Create an account',
      emailPlaceholder: 'Email address',
      firstNamePlaceholder: 'First name',
      lastNamePlaceholder: 'Last name',
      passwordPlaceholder: 'Password',
      confirmPasswordPlaceholder: 'Confirm password',
      hasAccount: 'Already have an account?',
      loginAction: 'Login',
      registerButton: 'Sign Up',
      avatarTitle: 'Profile picture',
      avatarText: 'Optional',
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordMin: 'Password must be at least 6 characters',
      firstNameRequired: 'First name is required',
      lastNameRequired: 'Last name is required',
      confirmPasswordRequired: 'Please confirm your password',
      passwordsNoMatch: 'Passwords do not match',
    },
    errors: {
      loginFailed: 'Incorrect email or password',
      registerFailed: 'Error registering user',
    },
  },
};

export default Strings; 