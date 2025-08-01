import { useRouter } from "expo-router";

/**
 * Custom hook for handling deposit flow navigation
 * Ensures consistent navigation behavior throughout the deposit flow
 */
export const useDepositNavigation = () => {
  const router = useRouter();

  const navigateToHome = () => {
    router.replace("/(private)/home");
  };

  const navigateToCurrencySelection = () => {
    router.replace("/(private)/deposit/currency-selection");
  };

  const navigateToNetworkSelection = (cryptoType: string, cryptoName: string) => {
    router.replace({
      pathname: "/(private)/deposit/network-selection",
      params: {
        cryptoType,
        cryptoName,
      }
    });
  };

  const navigateToCryptoDetails = (
    cryptoType: string,
    cryptoName: string,
    networkType: string,
    networkName: string,
    chain: string
  ) => {
    router.push({
      pathname: "/(private)/deposit/crypto-details",
      params: {
        cryptoType,
        cryptoName,
        networkType,
        networkName,
        chain,
      }
    });
  };

  const navigateToBolivianosForm = () => {
    router.push("/(private)/deposit/bolivianos-form");
  };

  return {
    navigateToHome,
    navigateToCurrencySelection,
    navigateToNetworkSelection,
    navigateToCryptoDetails,
    navigateToBolivianosForm,
  };
};