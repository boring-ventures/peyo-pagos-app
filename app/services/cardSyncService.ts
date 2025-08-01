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
      // Step 1: Get existing cards from Supabase for this profile
      console.log("📊 Step 1: Getting existing cards from Supabase...");
      const { data: existingCards, error: fetchError } = await supabase
        .from("cards")
        .select("moon_card_id, id, balance, available_balance, expiration, display_expiration, terminated, frozen")
        .eq("profile_id", profileId)
        .eq("is_active", true);

      if (fetchError) {
        result.errors.push(`Failed to fetch existing cards: ${fetchError.message}`);
        return result;
      }

      if (!existingCards || existingCards.length === 0) {
        console.log("📊 No existing cards found in Supabase for this user");
        result.success = true;
        return result;
      }

      const existingCardsMap = new Map();
      const userMoonCardIds = new Set();
      
      existingCards.forEach(card => {
        existingCardsMap.set(card.moon_card_id, card);
        userMoonCardIds.add(card.moon_card_id);
      });
      
      console.log(`📊 Found ${existingCardsMap.size} existing cards in Supabase for user`);

      // Step 2: Get all cards from Moon API
      console.log("📊 Step 2: Getting cards from Moon API...");
      const moonResponse = await moonService.listCards(1, 10); // Use perPage=10 as per Moon API docs
      
      if (!moonResponse.success || !moonResponse.data) {
        result.errors.push(`Failed to get Moon cards: ${moonResponse.error}`);
        return result;
      }

      const moonCards = moonResponse.data.cards;
      console.log(`📊 Found ${moonCards.length} total cards in Moon API`);

      // Step 3: Filter Moon cards to only include user's cards
      const userMoonCards = moonCards.filter(moonCard => userMoonCardIds.has(moonCard.id));
      console.log(`📊 Filtered to ${userMoonCards.length} cards that belong to this user`);

      if (userMoonCards.length === 0) {
        console.log("📊 No user cards found in Moon API response");
        result.success = true;
        return result;
      }

      // Step 4: Process each user's Moon card and sync with Supabase
      console.log("📊 Step 4: Processing and syncing user's cards...");
      for (const moonCard of userMoonCards) {
        try {
          const moonCardId = moonCard.id;
          const existingCard = existingCardsMap.get(moonCardId);

          if (!existingCard) {
            console.warn(`⚠️ Card ${moonCardId} not found in existing cards map, skipping`);
            result.details.skipped++;
            continue;
          }

          // Validate required fields from Moon API response
          const missingFields: string[] = [];
          if (!moonCard.balance && moonCard.balance !== 0) missingFields.push("balance");
          if (!moonCard.expiration) missingFields.push("expiration");
          if (!moonCard.display_expiration) missingFields.push("display_expiration");
          if (!moonCard.card_product_id) missingFields.push("card_product_id");
          if (!moonCard.pan) missingFields.push("pan");
          if (!moonCard.cvv) missingFields.push("cvv");
          if (!moonCard.support_token) missingFields.push("support_token");

          if (missingFields.length > 0) {
            console.warn(`⚠️ Card ${moonCardId} missing fields: ${missingFields.join(", ")}`);
            result.errors.push(`Card ${moonCardId} missing fields: ${missingFields.join(", ")}`);
            result.details.skipped++;
            continue;
          }

          // Update existing card - check if data has changed
          const availableBalance = moonCard.available_balance !== undefined ? moonCard.available_balance : moonCard.balance;
          
          const hasChanges = 
            Number(existingCard.balance) !== Number(moonCard.balance) ||
            Number(existingCard.available_balance) !== Number(availableBalance) ||
            existingCard.expiration !== moonCard.expiration ||
            existingCard.display_expiration !== moonCard.display_expiration ||
            existingCard.terminated !== Boolean(moonCard.terminated) ||
            existingCard.frozen !== Boolean(moonCard.frozen);

          if (hasChanges) {
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
          } else {
            console.log(`⏭️ Card ${moonCardId} already up to date, skipping`);
            result.details.skipped++;
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

      // Get card details from Moon using the correct method
      const moonResponse = await moonService.getCard(moonCardId);
      
      if (!moonResponse.success || !moonResponse.data) {
        return {
          success: false,
          error: `Failed to get Moon card: ${moonResponse.error}`,
        };
      }

      const moonCard = moonResponse.data.card; // Note: getCard returns { card: MoonCardData }
      const availableBalance = moonCard.available_balance !== undefined ? moonCard.available_balance : moonCard.balance;

      // Validate required fields
      const missingFields: string[] = [];
      if (!moonCard.balance && moonCard.balance !== 0) missingFields.push("balance");
      if (!moonCard.expiration) missingFields.push("expiration");
      if (!moonCard.display_expiration) missingFields.push("display_expiration");
      if (!moonCard.card_product_id) missingFields.push("card_product_id");
      if (!moonCard.pan) missingFields.push("pan");
      if (!moonCard.cvv) missingFields.push("cvv");
      if (!moonCard.support_token) missingFields.push("support_token");

      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Card missing required fields: ${missingFields.join(", ")}`,
        };
      }

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