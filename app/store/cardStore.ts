import { createId } from "@paralleldrive/cuid2";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { moonService } from "../services/moonService";
import { supabase } from "../services/supabaseClient";
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
    cardProductId: string
  ) => Promise<CreateCardResponse>;
  getCardById: (cardId: string) => Promise<Card | null>;
  refreshCards: (profileId: string) => Promise<void>;
  toggleCardFreeze: (cardId: string, freeze: boolean) => Promise<boolean>;

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
        cardProductId: string
      ): Promise<CreateCardResponse> => {
        set({ isCreatingCard: true, createCardError: null });

        try {
          console.log("💳 Creating new card for profile:", profileId);

          // Call Moon API to create card
          const moonResponse = await moonService.createCard(cardProductId);

          if (!moonResponse.success || !moonResponse.data) {
            const errorMsg =
              moonResponse.error || "Error creando tarjeta en Moon API";
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

          // Validate that we have all required fields (except id which we generate)
          const missingFields: string[] = [];
          if (moonCard.balance === undefined || moonCard.balance === null)
            missingFields.push("balance");
          if (
            moonCard.available_balance === undefined ||
            moonCard.available_balance === null
          )
            missingFields.push("available_balance");
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

          // Generate our own UUID for Supabase (React Native compatible)
          const cardId = createId();

          // Prepare card data for Supabase using our generated moon_card_id
          const cardData = {
            id: cardId,
            profile_id: profileId,
            moon_card_id: uniqueMoonCardId, // Use our generated ID instead of moonCard.id
            balance: moonCard.balance,
            available_balance: moonCard.available_balance,
            expiration: moonCard.expiration,
            display_expiration: moonCard.display_expiration,
            card_product_id: moonCard.card_product_id,
            pan: moonCard.pan,
            cvv: moonCard.cvv,
            support_token: moonCard.support_token,
            terminated: moonCard.terminated,
            frozen: moonCard.frozen,
            is_active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save to Supabase
          const { data, error } = await supabase
            .from("cards")
            .insert(cardData)
            .select()
            .single();

          if (error) {
            console.error("❌ Error saving card to Supabase:", error);
            set({
              createCardError: "Error guardando tarjeta",
              isCreatingCard: false,
            });
            return { success: false, error: "Error guardando tarjeta" };
          }

          const newCard = data as Card;
          console.log("✅ Card created successfully:", newCard.id);
          console.log("✅ Using generated moon_card_id:", newCard.moon_card_id);

          // Update store with new card
          const state = get();
          set({
            cards: [newCard, ...state.cards],
            currentCard: newCard,
            isCreatingCard: false,
            lastFetchedAt: new Date(),
          });

          return { success: true, card: newCard };
        } catch (err) {
          console.error("💥 Error creating card:", err);
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
