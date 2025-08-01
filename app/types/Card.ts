// Moon Cards Types
// Based on the provided database schema and Moon API response structure

export interface MoonCardData {
  id: string; // Moon Card ID
  balance: number | string;
  true_balance?: number | string;
  available_balance: number | string;
  expiration: string; // ISO date string
  display_expiration: string; // MM/YY format
  card_product_id: string;
  pan: string; // Primary Account Number
  cvv: string;
  support_token: string;
  terminated: boolean | number;
  frozen: boolean | number;
  activated?: boolean;
  gift_card_info?: any;
}

export interface MoonCardResponse {
  card: MoonCardData;
}

// Moon Card Products Types
export interface MoonCardProduct {
  id: string;
  name: string;
  minimum_value: number;
  maximum_value: number;
  fee_amount: number;
  fee_type: string;
  categories: string[];
}

export interface MoonPagination {
  currentPage: number;
  from: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface MoonCardProductsResponse {
  pagination: MoonPagination;
  card_products: MoonCardProduct[];
}

export interface Card {
  id: string; // Our Supabase UUID
  "createdAt": string; // Match database schema with quotes
  "updatedAt": string; // Match database schema with quotes
  profile_id: string;
  moon_card_id: string; // Moon's UUID
  balance: number;
  available_balance: number;
  expiration: string;
  display_expiration: string;
  card_product_id: string;
  pan: string;
  cvv: string;
  support_token: string;
  terminated: boolean;
  frozen: boolean;
  is_active: boolean;
}

export interface CreateCardRequest {
  card_product_id: string;
}

export interface CreateCardResponse {
  success: boolean;
  card?: Card;
  error?: string;
}

export interface MoonApiError {
  code: string;
  message: string;
  details?: any;
}

export interface MoonApiResponse<T> {
  data?: T;
  error?: MoonApiError;
}

export interface CardDisplayProps {
  card: Card;
  onPress?: () => void;
  showFullPan?: boolean;
  style?: any;
}

export interface CardCreationState {
  isCreating: boolean;
  error: string | null;
  success: boolean;
} 