import { createId } from "@paralleldrive/cuid2";
import { Card } from "../types/Card";
import { moonService } from "./moonService";
import { supabase } from "./supabaseClient";

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  details: {
    created: number;
    updated: number;
    skipped: number;
  };
}

export const cardSyncService = {
  /**
   * Sync all Moon cards to Supabase for a specific profile
   */
  syncMoonCardsToSupabase: async (profileId: string): Promise<SyncResult> => {
    console.log("🔄 Starting Moon cards sync for profile:", profileId);
    
    const result: SyncResult = {
      success: false,
      synced: 0,
      errors: [],
      details: {
        created: 0,
        updated: 0,
        skipped: 0,
      },
    };

    try {
      // Get all cards from Moon
      const moonResponse = await moonService.getAllCards(1, 100); // Get up to 100 cards
      
      if (!moonResponse.success || !moonResponse.data) {
        result.errors.push(`Failed to get Moon cards: ${moonResponse.error}`);
        return result;
      }

      const moonCards = moonResponse.data.cards;
      console.log(`📊 Found ${moonCards.length} cards in Moon`);

      // Get existing cards from Supabase for this profile
      const { data: existingCards, error: fetchError } = await supabase
        .from("cards")
        .select("moon_card_id, id")
        .eq("profile_id", profileId)
        .eq("is_active", true);

      if (fetchError) {
        result.errors.push(`Failed to fetch existing cards: ${fetchError.message}`);
        return result;
      }

      const existingMoonCardIds = new Set(existingCards?.map(card => card.moon_card_id) || []);
      console.log(`📊 Found ${existingMoonCardIds.size} existing cards in Supabase`);

      // Process each Moon card
      for (const moonCard of moonCards) {
        try {
          const moonCardId = moonCard.id;
          const isNewCard = !existingMoonCardIds.has(moonCardId);

          if (isNewCard) {
            // Create new card in Supabase
            const cardId = createId();
            const availableBalance = moonCard.available_balance || moonCard.balance;

            const cardData = {
              id: cardId,
              profile_id: profileId,
              moon_card_id: moonCardId,
              balance: Number(moonCard.balance),
              available_balance: Number(availableBalance),
              expiration: moonCard.expiration,
              display_expiration: moonCard.display_expiration,
              card_product_id: moonCard.card_product_id,
              pan: moonCard.pan,
              cvv: moonCard.cvv,
              support_token: moonCard.support_token,
              terminated: Boolean(moonCard.terminated),
              frozen: Boolean(moonCard.frozen),
              is_active: true,
              updatedAt: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
              .from("cards")
              .insert(cardData);

            if (insertError) {
              console.error(`❌ Failed to insert card ${moonCardId}:`, insertError);
              result.errors.push(`Failed to insert card ${moonCardId}: ${insertError.message}`);
            } else {
              console.log(`✅ Created new card: ${moonCardId}`);
              result.details.created++;
            }
          } else {
            // Update existing card
            const existingCard = existingCards?.find(card => card.moon_card_id === moonCardId);
            if (existingCard) {
              const availableBalance = moonCard.available_balance || moonCard.balance;

              const updateData = {
                balance: Number(moonCard.balance),
                available_balance: Number(availableBalance),
                expiration: moonCard.expiration,
                display_expiration: moonCard.display_expiration,
                terminated: Boolean(moonCard.terminated),
                frozen: Boolean(moonCard.frozen),
                updatedAt: new Date().toISOString(),
              };

              const { error: updateError } = await supabase
                .from("cards")
                .update(updateData)
                .eq("id", existingCard.id);

              if (updateError) {
                console.error(`❌ Failed to update card ${moonCardId}:`, updateError);
                result.errors.push(`Failed to update card ${moonCardId}: ${updateError.message}`);
              } else {
                console.log(`✅ Updated existing card: ${moonCardId}`);
                result.details.updated++;
              }
            }
          }

          result.synced++;
        } catch (cardError) {
          console.error(`❌ Error processing card ${moonCard.id}:`, cardError);
          result.errors.push(`Error processing card ${moonCard.id}: ${cardError instanceof Error ? cardError.message : 'Unknown error'}`);
        }
      }

      result.success = result.errors.length === 0;
      console.log(`✅ Sync completed: ${result.synced} cards processed`);
      console.log(`📊 Details: ${result.details.created} created, ${result.details.updated} updated, ${result.details.skipped} skipped`);

      return result;
    } catch (error) {
      console.error("💥 Sync error:", error);
      result.errors.push(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  },

  /**
   * Sync a single Moon card to Supabase
   */
  syncSingleMoonCard: async (profileId: string, moonCardId: string): Promise<{
    success: boolean;
    card?: Card;
    error?: string;
  }> => {
    try {
      console.log(`🔄 Syncing single Moon card: ${moonCardId}`);

      // Get card details from Moon
      const moonResponse = await moonService.getCardDetails(moonCardId);
      
      if (!moonResponse.success || !moonResponse.data) {
        return {
          success: false,
          error: `Failed to get Moon card: ${moonResponse.error}`,
        };
      }

      const moonCard = moonResponse.data;
      const availableBalance = moonCard.available_balance || moonCard.balance;

      // Check if card already exists in Supabase
      const { data: existingCard, error: fetchError } = await supabase
        .from("cards")
        .select("*")
        .eq("moon_card_id", moonCardId)
        .eq("profile_id", profileId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        return {
          success: false,
          error: `Failed to check existing card: ${fetchError.message}`,
        };
      }

      if (existingCard) {
        // Update existing card
        const updateData = {
          balance: Number(moonCard.balance),
          available_balance: Number(availableBalance),
          expiration: moonCard.expiration,
          display_expiration: moonCard.display_expiration,
          terminated: Boolean(moonCard.terminated),
          frozen: Boolean(moonCard.frozen),
          updatedAt: new Date().toISOString(),
        };

        const { data: updatedCard, error: updateError } = await supabase
          .from("cards")
          .update(updateData)
          .eq("id", existingCard.id)
          .select()
          .single();

        if (updateError) {
          return {
            success: false,
            error: `Failed to update card: ${updateError.message}`,
          };
        }

        console.log(`✅ Updated existing card: ${moonCardId}`);
        return {
          success: true,
          card: updatedCard as Card,
        };
      } else {
        // Create new card
        const cardId = createId();
        const cardData = {
          id: cardId,
          profile_id: profileId,
          moon_card_id: moonCardId,
          balance: Number(moonCard.balance),
          available_balance: Number(availableBalance),
          expiration: moonCard.expiration,
          display_expiration: moonCard.display_expiration,
          card_product_id: moonCard.card_product_id,
          pan: moonCard.pan,
          cvv: moonCard.cvv,
          support_token: moonCard.support_token,
          terminated: Boolean(moonCard.terminated),
          frozen: Boolean(moonCard.frozen),
          is_active: true,
          updatedAt: new Date().toISOString(),
        };

        const { data: newCard, error: insertError } = await supabase
          .from("cards")
          .insert(cardData)
          .select()
          .single();

        if (insertError) {
          return {
            success: false,
            error: `Failed to create card: ${insertError.message}`,
          };
        }

        console.log(`✅ Created new card: ${moonCardId}`);
        return {
          success: true,
          card: newCard as Card,
        };
      }
    } catch (error) {
      console.error("💥 Single card sync error:", error);
      return {
        success: false,
        error: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
}; 