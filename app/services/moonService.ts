import Constants from 'expo-constants';
import { MoonApiResponse, MoonCardData, MoonCardProductsResponse, MoonCardResponse } from '../types/Card';

// Moon API Configuration
const MOON_API_BASE_URL = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_MOON_API_BASE_URL ||
  process.env.EXPO_PUBLIC_MOON_API_BASE_URL ||
  'https://api.usemoon.ai';

const MOON_API_KEY = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_MOON_API_KEY ||
  process.env.EXPO_PUBLIC_MOON_API_KEY;

// Debug logging for configuration
console.log('🔧 Moon API Configuration:');
console.log('  Base URL:', MOON_API_BASE_URL);
console.log('  API Key:', MOON_API_KEY ? '***' + MOON_API_KEY.slice(-4) : 'MISSING');

if (!MOON_API_KEY) {
  console.warn('⚠️ Moon API key is missing. Card features will not work.');
}

if (!MOON_API_BASE_URL) {
  console.warn('⚠️ Moon API base URL is missing. Using default.');
}

/**
 * Generate idempotency key for Moon API calls
 */
const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Moon API HTTP client with common headers
 */
const moonRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<MoonApiResponse<T>> => {
  if (!MOON_API_KEY) {
    return {
      error: {
        code: 'MOON_API_KEY_MISSING',
        message: 'Moon API key is not configured',
      },
    };
  }

  try {
    const url = `${MOON_API_BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    
    const headers: Record<string, string> = {
      'x-api-key': MOON_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    console.log(`🌙 Moon API ${method}: ${endpoint}`);
    console.log(`🔗 Full URL: ${url}`);
    console.log(`📋 Headers:`, JSON.stringify(headers, null, 2));

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('🚨 Moon API Error:', errorData);
      return {
        error: {
          code: errorData.code || `HTTP_${response.status}`,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData,
        },
      };
    }

    const data = await response.json();
    console.log('✅ Moon API Success:', endpoint);
    
    return { data };

  } catch (error) {
    console.error('💥 Moon API Network Error:', error);
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: 'Error de conexión con Moon API',
        details: error,
      },
    };
  }
};

/**
 * Moon Service - Handles all Moon API interactions
 */
export const moonService = {
  /**
   * Create a new card
   * @param cardProductId - The card product ID to create
   */
  createCard: async (cardProductId: string): Promise<{
    success: boolean;
    data?: MoonCardData;
    error?: string;
  }> => {
    try {
      console.log('💳 Creating Moon card with product ID:', cardProductId);
      
      const response = await moonRequest<MoonCardResponse>(
        `/v1/api-gateway/card/${encodeURIComponent(cardProductId)}`,
        {
          method: 'POST',
          body: JSON.stringify({}), // Moon API expects empty body for card creation
        }
      );

      if (response.error) {
        console.error('❌ Moon API error creating card:', response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      if (!response.data) {
        return {
          success: false,
          error: 'No se recibieron datos de la tarjeta',
        };
      }

      console.log('✅ Moon card created successfully:', response.data.card.id);
      
      return {
        success: true,
        data: response.data.card,
      };

    } catch (error) {
      console.error('💥 Error creating Moon card:', error);
      return {
        success: false,
        error: 'Error inesperado creando tarjeta',
      };
    }
  },

  /**
   * Get card details by Moon card ID
   * @param moonCardId - The Moon card ID
   */
  getCard: async (moonCardId: string): Promise<{
    success: boolean;
    data?: MoonCardResponse;
    error?: string;
  }> => {
    try {
      console.log('🔍 Getting Moon card details:', moonCardId);
      
      const response = await moonRequest<MoonCardResponse>(
        `/v1/api-gateway/card/${encodeURIComponent(moonCardId)}`
      );

      if (response.error) {
        console.error('❌ Moon API error getting card:', response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      if (!response.data) {
        return {
          success: false,
          error: 'No se encontró la tarjeta',
        };
      }

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      console.error('💥 Error getting Moon card:', error);
      return {
        success: false,
        error: 'Error inesperado obteniendo tarjeta',
      };
    }
  },

  /**
   * List all cards (if Moon API supports this endpoint)
   * Note: This endpoint might not exist in Moon API, keeping for future use
   */
  listCards: async (): Promise<{
    success: boolean;
    data?: MoonCardResponse[];
    error?: string;
  }> => {
    try {
      console.log('📋 Listing Moon cards');
      
      const response = await moonRequest<MoonCardResponse[]>('/v1/api-gateway/cards');

      if (response.error) {
        console.error('❌ Moon API error listing cards:', response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        data: response.data || [],
      };

    } catch (error) {
      console.error('💥 Error listing Moon cards:', error);
      return {
        success: false,
        error: 'Error inesperado listando tarjetas',
      };
    }
  },

  /**
   * Freeze or unfreeze a card
   * @param moonCardId - The Moon card ID
   * @param freeze - Whether to freeze (true) or unfreeze (false) the card
   */
  toggleCardFreeze: async (moonCardId: string, freeze: boolean): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      console.log(`${freeze ? '🧊' : '🔥'} ${freeze ? 'Freezing' : 'Unfreezing'} Moon card:`, moonCardId);
      
      const response = await moonRequest(
        `/v1/api-gateway/card/${encodeURIComponent(moonCardId)}/${freeze ? 'freeze' : 'unfreeze'}`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      if (response.error) {
        console.error(`❌ Moon API error ${freeze ? 'freezing' : 'unfreezing'} card:`, response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      console.log(`✅ Moon card ${freeze ? 'frozen' : 'unfrozen'} successfully`);
      
      return {
        success: true,
      };

    } catch (error) {
      console.error(`💥 Error ${freeze ? 'freezing' : 'unfreezing'} Moon card:`, error);
      return {
        success: false,
        error: 'Error inesperado actualizando tarjeta',
      };
    }
  },

  /**
   * Get card balance (if separate from card details)
   * @param moonCardId - The Moon card ID
   */
  getCardBalance: async (moonCardId: string): Promise<{
    success: boolean;
    data?: { balance: number; available_balance: number };
    error?: string;
  }> => {
    try {
      console.log('💰 Getting Moon card balance:', moonCardId);
      
      const response = await moonRequest<{ balance: number; available_balance: number }>(
        `/v1/api-gateway/card/${encodeURIComponent(moonCardId)}/balance`
      );

      if (response.error) {
        console.error('❌ Moon API error getting balance:', response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      console.error('💥 Error getting Moon card balance:', error);
      return {
        success: false,
        error: 'Error inesperado obteniendo balance',
      };
    }
  },

  /**
   * Get available card products
   * @param perPage - Items per page (default: 10)
   */
  getCardProducts: async (
    perPage: number = 10
  ): Promise<{
    success: boolean;
    data?: MoonCardProductsResponse;
    error?: string;
  }> => {
    try {
      console.log('🔍 Getting Moon card products, perPage:', perPage);
      
      const queryParams = new URLSearchParams({
        perPage: perPage.toString(),
      });
      
      const response = await moonRequest<MoonCardProductsResponse>(
        `/v1/api-gateway/card/card-products?${queryParams.toString()}`
      );

      if (response.error) {
        console.error('❌ Moon API error getting card products:', response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      if (!response.data || !response.data.card_products) {
        return {
          success: false,
          error: 'No se encontraron productos de tarjetas',
        };
      }

      console.log('✅ Card products retrieved:', response.data.card_products.length);
      
      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      console.error('💥 Error getting Moon card products:', error);
      return {
        success: false,
        error: 'Error inesperado obteniendo productos de tarjetas',
      };
    }
  },

  /**
   * Health check for Moon API
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await moonRequest('/health');
      return !response.error;
    } catch {
      return false;
    }
  },
}; 