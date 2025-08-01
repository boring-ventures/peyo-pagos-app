import { createId } from "@paralleldrive/cuid2";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cardSyncService } from "../services/cardSyncService";
import { moonService } from "../services/moonService";
import { supabase } from "../services/supabaseClient";
import { walletBalanceService } from "../services/walletBalanceService";
import { Card, CreateCardResponse } from "../types/Card";

interface CardState {
  // Card data
  cards: Card[];
  currentCard: Card | null;

  // Loading states
  isLoading: boolean;
  isCreatingCard: boolean;
  isLoadingCards: boolean;

  // Error states
  error: string | null;
  createCardError: string | null;

  // Cache management
  lastFetchedAt: Date | null;
  cacheValidityMs: number; // 5 minutes for card data

  // Actions
  loadUserCards: (profileId: string, forceRefresh?: boolean) => Promise<void>;
  createCard: (
    profileId: string,
    cardProductId: string,
    userId: string
  ) => Promise<CreateCardResponse>;
  getCardById: (cardId: string) => Promise<Card | null>;
  refreshCards: (profileId: string) => Promise<void>;
  toggleCardFreeze: (cardId: string, freeze: boolean) => Promise<boolean>;
  syncMoonCards: (profileId: string) => Promise<{
    success: boolean;
    synced: number;
    errors: string[];
    details: { created: number; updated: number; skipped: number };
  }>;

  // Utility methods
  clearError: () => void;
  clearCreateCardError: () => void;
  clearAllData: () => void;
  isCardsCacheFresh: () => boolean;

  // Card display helpers
  getMaskedPan: (pan: string) => string;
  getActiveCards: () => Card[];
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      // Initial state
      cards: [],
      currentCard: null,
      isLoading: false,
      isCreatingCard: false,
      isLoadingCards: false,
      error: null,
      createCardError: null,
      lastFetchedAt: null,
      cacheValidityMs: 5 * 60 * 1000, // 5 minutes

      // Load user cards from Supabase
      loadUserCards: async (profileId: string, forceRefresh = false) => {
        const state = get();

        // Check cache freshness unless forcing refresh
        if (!forceRefresh && state.isCardsCacheFresh()) {
          console.log("📱 Using cached cards data");
          return;
        }

        set({ isLoadingCards: true, error: null });

        try {
          console.log("📱 Loading cards for profile:", profileId);

          const { data, error } = await supabase
            .from("cards")
            .select("*")
            .eq("profile_id", profileId)
            .eq("is_active", true)
            .order("createdAt", { ascending: false });

          if (error) {
            console.error("❌ Error loading cards:", error);
            set({ error: "Error cargando tarjetas", isLoadingCards: false });
            return;
          }

          const cards = (data || []) as Card[];
          console.log(`✅ Loaded ${cards.length} cards`);

          set({
            cards,
            currentCard: cards.length > 0 ? cards[0] : null,
            lastFetchedAt: new Date(),
            isLoadingCards: false,
          });
        } catch (err) {
          console.error("💥 Error loading cards:", err);
          set({
            error: "Error inesperado cargando tarjetas",
            isLoadingCards: false,
          });
        }
      },

      // Create new card
      createCard: async (
        profileId: string,
        cardProductId: string,
        userId: string
      ): Promise<CreateCardResponse> => {
        set({ isCreatingCard: true, createCardError: null });

        try {
          console.log("💳 Creating new card for profile:", profileId);
          console.log("💳 Creating Moon card with product ID:", cardProductId);
          console.log("👤 User ID for Moon API:", userId);

          // First, get the card product details to get the minimum_value
          const productResponse = await moonService.getCardProducts(10);
          if (!productResponse.success || !productResponse.data) {
            const errorMsg = "Error obteniendo detalles del producto de tarjeta";
            set({
              createCardError: errorMsg,
              isCreatingCard: false,
            });
            return { success: false, error: errorMsg };
          }

          // Find the specific product
          const cardProduct = productResponse.data.card_products.find(
            product => product.id === cardProductId
          );

          if (!cardProduct) {
            const errorMsg = `Producto de tarjeta con ID ${cardProductId} no encontrado. Productos disponibles: ${productResponse.data.card_products.map(p => p.id).join(', ')}`;
            console.error("❌", errorMsg);
            set({
              createCardError: "Producto de tarjeta no encontrado",
              isCreatingCard: false,
            });
            return { success: false, error: "Producto de tarjeta no encontrado" };
          }

          console.log("📋 Card product details:", {
            id: cardProduct.id,
            name: cardProduct.name,
            minimum_value: cardProduct.minimum_value,
            maximum_value: cardProduct.maximum_value
          });

          // Use the minimum_value as the amount for card creation
          const amount = cardProduct.minimum_value;

          // Check user's actual balance from wallet service
          console.log("💰 Checking user's wallet balance...");
          
          // Get the correct bridgeCustomerId from kyc_profiles
          const { data: kycProfile, error: kycError } = await supabase
            .from('kyc_profiles')
            .select('bridge_customer_id')
            .eq('profile_id', profileId)
            .single();
            
          let safeAmount = amount;
          let userBalance = 0;
          
          if (kycError || !kycProfile?.bridge_customer_id) {
            console.warn("⚠️ No bridge_customer_id found, using $1 as safe amount");
            safeAmount = 1;
            userBalance = 0;
          } else {
            const bridgeCustomerId = kycProfile.bridge_customer_id;
            console.log("🌉 Using bridge customer ID for balance check:", bridgeCustomerId);
            
            const balanceResponse = await walletBalanceService.calculateTotalBalance(bridgeCustomerId);
            
            if (balanceResponse.success && balanceResponse.data) {
              userBalance = balanceResponse.data.totalUSDCBalance;
              console.log("💰 User's actual balance:", userBalance);
              
              // Use the minimum between user balance and product minimum, but at least $1
              safeAmount = Math.max(1, Math.min(amount, userBalance));
              console.log("💰 Safe amount calculated:", safeAmount);
            } else {
              console.warn("⚠️ Could not get user balance from Bridge:", balanceResponse.error);
              console.warn("⚠️ Using $1 as safe amount");
              safeAmount = 1;
              userBalance = 0;
            }
          }
          
          console.log("💰 Original minimum amount:", amount);
          console.log("💰 Safe amount to use:", safeAmount);

          // Call Moon API to create card with required parameters
          // First try without end_customer_id to test if it's optional
          console.log("🔄 First attempt: Creating card without end_customer_id...");
          let moonResponse = await moonService.createCard(cardProductId, "", safeAmount);

          // If first attempt fails, try with end_customer_id
          if (!moonResponse.success && moonResponse.error?.includes("end_customer_id")) {
            console.log("🔄 Second attempt: Creating card with end_customer_id...");
            moonResponse = await moonService.createCard(cardProductId, userId, safeAmount);
          }

          // If the safe amount fails, try with $1 as a last resort
          if (!moonResponse.success && moonResponse.error?.includes("Amount greater than balance")) {
            console.log("🔄 Trying with $1 as fallback...");
            moonResponse = await moonService.createCard(cardProductId, userId, 1);
          }

          if (!moonResponse.success || !moonResponse.data) {
            const errorMsg = moonResponse.error || "Error creando tarjeta en Moon API";
            
            // Handle specific balance-related errors
            if (errorMsg.includes("Amount greater than balance") || errorMsg.includes("Insufficient balance")) {
              const attemptedAmount = safeAmount === 1 ? "$1 (monto mínimo)" : `$${safeAmount}`;
              const balanceInfo = userBalance > 0 ? `Tu balance actual es $${userBalance.toFixed(2)}.` : "No se pudo verificar tu balance en Bridge.";
              const balanceErrorMsg = `Balance insuficiente. Se intentó crear la tarjeta con ${attemptedAmount} pero tu cuenta no tiene fondos suficientes. ${balanceInfo} El monto mínimo para esta tarjeta es $${cardProduct.minimum_value}. Por favor, agrega fondos a tu cuenta antes de crear la tarjeta.`;
              set({
                createCardError: balanceErrorMsg,
                isCreatingCard: false,
              });
              return { success: false, error: balanceErrorMsg };
            }
            
            set({
              createCardError: errorMsg,
              isCreatingCard: false,
            });
            return { success: false, error: errorMsg };
          }

          const moonCard = moonResponse.data;
          console.log(
            "🔍 Debug - Moon Response Full:",
            JSON.stringify(moonResponse, null, 2)
          );
          console.log(
            "🔍 Debug - Moon Card Data:",
            JSON.stringify(moonCard, null, 2)
          );
          console.log("🔍 Debug - Original Moon Card ID:", moonCard?.id);

          // Generate our own unique moon_card_id since sandbox always returns the same ID
          const uniqueMoonCardId = createId();
          console.log("🔍 Debug - Generated Unique Moon Card ID:", uniqueMoonCardId);

          // Handle missing available_balance by using balance as fallback
          let availableBalance = moonCard.available_balance;
          if (availableBalance === undefined || availableBalance === null) {
            console.log("⚠️ available_balance not provided by Moon API, using balance as fallback");
            availableBalance = moonCard.balance;
            console.log("✅ Using balance as available_balance:", availableBalance);
          } else {
            console.log("✅ available_balance provided by Moon API:", availableBalance);
          }

          console.log("📊 Final values for Supabase:");
          console.log("  - balance:", moonCard.balance);
          console.log("  - available_balance:", availableBalance);
          console.log("  - expiration:", moonCard.expiration);
          console.log("  - display_expiration:", moonCard.display_expiration);
          console.log("  - card_product_id:", moonCard.card_product_id);
          console.log("  - pan:", moonCard.pan);
          console.log("  - cvv:", moonCard.cvv);
          console.log("  - support_token:", moonCard.support_token);

          // Validate that we have all required fields (except id which we generate)
          const missingFields: string[] = [];
          if (moonCard.balance === undefined || moonCard.balance === null)
            missingFields.push("balance");
          if (moonCard.expiration === undefined || moonCard.expiration === null)
            missingFields.push("expiration");
          if (
            moonCard.display_expiration === undefined ||
            moonCard.display_expiration === null
          )
            missingFields.push("display_expiration");
          if (
            moonCard.card_product_id === undefined ||
            moonCard.card_product_id === null
          )
            missingFields.push("card_product_id");
          if (moonCard.pan === undefined || moonCard.pan === null)
            missingFields.push("pan");
          if (moonCard.cvv === undefined || moonCard.cvv === null)
            missingFields.push("cvv");
          if (
            moonCard.support_token === undefined ||
            moonCard.support_token === null
          )
            missingFields.push("support_token");

          if (missingFields.length > 0) {
            const errorMsg = `Campos faltantes en la respuesta de Moon API: ${missingFields.join(
              ", "
            )}`;
            console.error("❌", errorMsg);
            set({
              createCardError: errorMsg,
              isCreatingCard: false,
            });
            return { success: false, error: errorMsg };
          }

          console.log("✅ All required fields validated successfully");

          // Generate our own UUID for Supabase (React Native compatible)
          const cardId = createId();
          console.log("🆔 Generated Supabase card ID:", cardId);

          // Prepare card data for Supabase using our generated moon_card_id
          const cardData = {
            id: cardId,
            profile_id: profileId,
            moon_card_id: uniqueMoonCardId, // Use our generated ID instead of moonCard.id
            balance: Number(moonCard.balance),
            available_balance: Number(availableBalance), // Use the fallback value
            expiration: moonCard.expiration,
            display_expiration: moonCard.display_expiration,
            card_product_id: moonCard.card_product_id,
            pan: moonCard.pan,
            cvv: moonCard.cvv,
            support_token: moonCard.support_token,
            terminated: Boolean(moonCard.terminated),
            frozen: Boolean(moonCard.frozen),
            is_active: true,
            updatedAt: new Date().toISOString(), // Add required updatedAt field
          };

          console.log("📦 Card data to insert:", JSON.stringify(cardData, null, 2));

          // Save to Supabase
          console.log("💾 Attempting to save card to Supabase...");
          console.log("💾 Profile ID:", profileId);
          console.log("💾 Moon Card ID (generated):", uniqueMoonCardId);
          console.log("💾 Supabase Card ID:", cardId);
          
          try {
            console.log("💾 Executing Supabase insert...");
            const { data, error } = await supabase
              .from("cards")
              .insert(cardData)
              .select()
              .single();

            if (error) {
              console.error("❌ Error saving card to Supabase:", error);
              console.error("❌ Error details:", JSON.stringify(error, null, 2));
              
              // Check if it's a duplicate moon_card_id error
              if (error.code === '23505' && error.message.includes('moon_card_id')) {
                console.error("❌ Duplicate moon_card_id detected, generating new one...");
                // Generate a new unique moon_card_id and retry
                const newUniqueMoonCardId = createId();
                console.log("🔄 New moon_card_id:", newUniqueMoonCardId);
                
                const retryCardData = {
                  ...cardData,
                  moon_card_id: newUniqueMoonCardId,
                };
                
                console.log("🔄 Retrying with new moon_card_id...");
                const { data: retryData, error: retryError } = await supabase
                  .from("cards")
                  .insert(retryCardData)
                  .select()
                  .single();
                  
                if (retryError) {
                  console.error("❌ Retry failed:", retryError);
                  set({
                    createCardError: "Error guardando tarjeta (duplicado)",
                    isCreatingCard: false,
                  });
                  return { success: false, error: "Error guardando tarjeta (duplicado)" };
                }
                
                const newCard = retryData as Card;
                console.log("✅ Card created successfully on retry:", newCard.id);
                
                // Update store with new card
                const state = get();
                set({
                  cards: [newCard, ...state.cards],
                  currentCard: newCard,
                  isCreatingCard: false,
                  lastFetchedAt: new Date(),
                });
                
                return { success: true, card: newCard };
              }
              
              set({
                createCardError: "Error guardando tarjeta",
                isCreatingCard: false,
              });
              return { success: false, error: "Error guardando tarjeta" };
            }

            const newCard = data as Card;
            console.log("✅ Card created successfully in Supabase:", newCard.id);
            console.log("✅ Using generated moon_card_id:", newCard.moon_card_id);
            console.log("✅ Card data from Supabase:", JSON.stringify(newCard, null, 2));

            // Update store with new card
            const state = get();
            set({
              cards: [newCard, ...state.cards],
              currentCard: newCard,
              isCreatingCard: false,
              lastFetchedAt: new Date(),
            });

            console.log("✅ Store updated with new card");
            return { success: true, card: newCard };
          } catch (dbError) {
            console.error("💥 Database operation error:", dbError);
            console.error("💥 Database error stack:", dbError instanceof Error ? dbError.stack : 'No stack available');
            set({
              createCardError: "Error de base de datos",
              isCreatingCard: false,
            });
            return { success: false, error: "Error de base de datos" };
          }
        } catch (err) {
          console.error("💥 Error creating card:", err);
          console.error("💥 Error stack:", err instanceof Error ? err.stack : 'No stack available');
          const errorMsg = "Error inesperado creando tarjeta";
          set({
            createCardError: errorMsg,
            isCreatingCard: false,
          });
          return { success: false, error: errorMsg };
        }
      },

      // Get card by ID
      getCardById: async (cardId: string): Promise<Card | null> => {
        // First check local store
        const state = get();
        const localCard = state.cards.find((card) => card.id === cardId);
        if (localCard) {
          return localCard;
        }

        // If not found locally, fetch from Supabase
        try {
          const { data, error } = await supabase
            .from("cards")
            .select("*")
            .eq("id", cardId)
            .eq("is_active", true)
            .single();

          if (error || !data) {
            return null;
          }

          return data as Card;
        } catch (err) {
          console.error("Error fetching card by ID:", err);
          return null;
        }
      },

      // Refresh cards data
      refreshCards: async (profileId: string) => {
        await get().loadUserCards(profileId, true);
      },

      // Toggle card freeze status
      toggleCardFreeze: async (
        cardId: string,
        freeze: boolean
      ): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          // Update in Supabase
          const { error } = await supabase
            .from("cards")
            .update({
              frozen: freeze,
              updatedAt: new Date().toISOString(),
            })
            .eq("id", cardId);

          if (error) {
            console.error("Error updating card freeze status:", error);
            set({
              error: "Error actualizando estado de tarjeta",
              isLoading: false,
            });
            return false;
          }

          // Update local store
          const state = get();
          const updatedCards = state.cards.map((card) =>
            card.id === cardId
              ? { ...card, frozen: freeze, updatedAt: new Date().toISOString() }
              : card
          );

          set({
            cards: updatedCards,
            currentCard:
              state.currentCard?.id === cardId
                ? { ...state.currentCard, frozen: freeze }
                : state.currentCard,
            isLoading: false,
          });

          return true;
        } catch (err) {
          console.error("Error toggling card freeze:", err);
          set({ error: "Error inesperado", isLoading: false });
          return false;
        }
      },

      // Utility methods
      clearError: () => set({ error: null }),
      clearCreateCardError: () => set({ createCardError: null }),
      clearAllData: () =>
        set({
          cards: [],
          currentCard: null,
          error: null,
          createCardError: null,
          lastFetchedAt: null,
        }),

      isCardsCacheFresh: () => {
        const state = get();
        if (!state.lastFetchedAt) return false;

        const now = new Date().getTime();
        const lastFetch = new Date(state.lastFetchedAt).getTime();
        return now - lastFetch < state.cacheValidityMs;
      },

      // Card display helpers
      getMaskedPan: (pan: string) => {
        if (!pan || pan.length < 4) return "****";
        return `**** **** **** ${pan.slice(-4)}`;
      },

      getActiveCards: () => {
        return get().cards.filter((card) => card.is_active && !card.terminated);
      },

      // Sync Moon cards to Supabase
      syncMoonCards: async (profileId: string) => {
        console.log("🔄 Starting Moon cards sync from store...");
        const result = await cardSyncService.syncMoonCardsToSupabase(profileId);
        
        if (result.success) {
          // Refresh cards after successful sync
          await get().loadUserCards(profileId, true);
        }
        
        return result;
      },
    }),
    {
      name: "card-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cards: state.cards,
        currentCard: state.currentCard,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
