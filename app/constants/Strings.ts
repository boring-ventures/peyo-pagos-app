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
      title: 'Welcome Back Again',
      subtitle: 'Login to your account',
      emailPlaceholder: 'Email address',
      passwordPlaceholder: 'Password',
      forgotPassword: 'Forgot Password ?',
      noAccount: "Don't have account?",
      registerAction: 'Sign Up',
      loginButton: 'Login',
      loginWithGoogle: 'Login with Google',
    },
    register: {
      title: 'Sign up now',
      subtitle: 'Begin Your Journey Today',
      emailPlaceholder: 'Email address',
      phonePlaceholder: 'Phone number',
      firstNamePlaceholder: 'First name',
      lastNamePlaceholder: 'Last name',
      passwordPlaceholder: 'Password',
      confirmPasswordPlaceholder: 'Confirm password',
      hasAccount: 'Already have account?',
      loginAction: 'Login',
      registerButton: 'Sign Up',
      registerWithGoogle: 'Sign up with Google',
      avatarTitle: 'Profile picture',
      avatarText: 'Optional',
      termsText: 'I agree to the',
      termsLink: 'Terms & Conditions',
      privacyLink: 'Privacy Policy',
    },
    validation: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      phoneRequired: 'Phone number is required',
      phoneInvalid: 'Please enter a valid phone number',
      passwordRequired: 'Password is required',
      passwordMin: 'Password must be at least 6 characters',
      firstNameRequired: 'First name is required',
      lastNameRequired: 'Last name is required',
      confirmPasswordRequired: 'Please confirm your password',
      passwordsNoMatch: 'Passwords do not match',
      termsRequired: 'You must agree to the terms and conditions',
    },
    errors: {
      loginFailed: 'Incorrect email or password',
      registerFailed: 'Error registering user',
    },
  },
};

export default Strings; 