import { offlineDB } from "./db";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://bingo-backend-ccn6.onrender.com/api";
export const isOnline = () => {
  return navigator.onLine;
};

export async function saveGameOffline(game) {
  if (!game || !game.game_id) {
    return;
  }

  await offlineDB.games.put({
    ...game,
    created_at: game.created_at || new Date().toISOString(),
  });
}

export async function saveCalledBallOffline(gameId, number) {
  if (!gameId || !number) {
    return;
  }

  await offlineDB.calledBalls.add({
    game_id: gameId,
    number: number,
    called_at: new Date().toISOString(),
  });
}

export async function saveSoldCartelaOffline(data) {
  if (!data) {
    return;
  }

  await offlineDB.soldCartelas.add({
    ...data,
    sold_at: data.sold_at || new Date().toISOString(),
  });
}

export async function getLocalPackage(houseId) {
  if (!houseId) {
    return null;
  }

  return await offlineDB.package.get(String(houseId));
}

export async function saveLocalPackage(houseId, packageData) {
  if (!houseId) {
    return;
  }

  await offlineDB.package.put({
    house_id: String(houseId),
    ...packageData,
    updated_at: new Date().toISOString(),
  });
}

export async function getLocalGames(houseId) {
  if (!houseId) {
    return [];
  }

  return await offlineDB.games
    .where("house_id")
    .equals(String(houseId))
    .toArray();
}

export async function getLocalSoldCartelas(houseId) {
  if (!houseId) {
    return [];
  }

  return await offlineDB.soldCartelas
    .where("house_id")
    .equals(String(houseId))
    .toArray();
}

export async function addToSyncQueue(type, data) {
  await offlineDB.syncQueue.add({
    type: type,
    data: data,
    created_at: new Date().toISOString(),
    synced: false,
  });
}


export async function getPendingSyncItems() {
  return await offlineDB.syncQueue
    .where("synced")
    .equals(false)
    .toArray();
}

// ============================================================
// SYNC OFFLINE GAMES WHEN INTERNET RETURNS
// ============================================================

export async function syncOfflineGames({
  apiUrl = API_URL,
  cashierId = null,
} = {}) {
  if (!navigator.onLine) {
    console.log("📴 SYNC SKIPPED - OFFLINE");
    return {
      success: false,
      synced: 0,
      message: "Offline",
    };
  }

  console.log("🔄 OFFLINE GAME SYNC STARTED");

  let syncedCount = 0;

  try {
    // ----------------------------------------------------------
    // Get all locally-created games that are not synced
    // ----------------------------------------------------------

    const offlineGames = await offlineDB.games
      .filter((game) =>
        game.offline_created === true &&
        game.synced !== true
      )
      .toArray();

    console.log(
      "📦 OFFLINE GAMES WAITING FOR SYNC:",
      offlineGames.length
    );

    for (const localGame of offlineGames) {
      if (!localGame.game_id) {
        console.warn(
          "⚠️ SKIPPING GAME WITHOUT game_id:",
          localGame
        );
        continue;
      }

      const gameId = String(localGame.game_id);

      try {
        // ------------------------------------------------------
        // Get locally saved sold cartelas for this game
        // ------------------------------------------------------

        const soldCartelas =
          await offlineDB.soldCartelas
            .where("game_id")
            .equals(gameId)
            .toArray();

        const cartelaIds =
          soldCartelas.map((item) =>
            String(item.cartela_id)
          );

        // ------------------------------------------------------
        // Rebuild the game in the SAME structure used online
        // ------------------------------------------------------

        const gameToSync = {
          ...localGame,

          id: gameId,
          game_id: gameId,

          house_id:
            String(localGame.house_id || ""),

          cashier_id:
            String(
              localGame.cashier_id ||
              cashierId ||
              ""
            ),

          cards_sold:
            Number(
              localGame.cards_sold ??
              localGame.cardsSold ??
              cartelaIds.length ??
              0
            ),

          cardsSold:
            Number(
              localGame.cardsSold ??
              localGame.cards_sold ??
              cartelaIds.length ??
              0
            ),

          bet:
            Number(localGame.bet || 0),

          commission:
            Number(localGame.commission || 0),

          commissionDeducted:
            Number(
              localGame.commissionDeducted ||
              0
            ),

          house_commission:
            Number(
              localGame.house_commission ||
              localGame.commissionDeducted ||
              0
            ),

          grossIncome:
            Number(
              localGame.grossIncome ||
              0
            ),

          netIncome:
            Number(
              localGame.netIncome ||
              0
            ),

          prize:
            Number(
              localGame.prize ||
              localGame.netIncome ||
              0
            ),

          soldCartelas:
            localGame.soldCartelas ||
            cartelaIds.map((id) => ({
              id,
              cartela_id: id,
            })),

          offline_created: true,
        };

        console.log(
          "☁️ SYNCING OFFLINE GAME:",
          gameId
        );

        // ------------------------------------------------------
        // Send the SAME game_id to the backend
        // ------------------------------------------------------

        const response = await fetch(
          `${apiUrl}/games`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              game: gameToSync,
              cashierId:
                gameToSync.cashier_id ||
                cashierId,
              soldCartelas: cartelaIds,
            }),
          }
        );

        // ------------------------------------------------------
        // Backend rejected the sync
        // ------------------------------------------------------

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "❌ OFFLINE GAME SYNC FAILED:",
            gameId,
            response.status,
            errorText
          );

          continue;
        }

        const result =
          await response.json();

        if (!result || !result.game) {
          console.error(
            "❌ SERVER DID NOT RETURN GAME:",
            gameId
          );

          continue;
        }

        const serverGame = result.game;

        // ------------------------------------------------------
        // Mark local game as synchronized
        // ------------------------------------------------------

        await offlineDB.games.put({
          ...localGame,

          ...serverGame,

          id: gameId,
          game_id: gameId,

          house_id:
            String(
              serverGame.house_id ||
              localGame.house_id ||
              ""
            ),

          cashier_id:
            String(
              serverGame.cashier_id ||
              localGame.cashier_id ||
              cashierId ||
              ""
            ),

          synced: true,
          offline_created: false,

          synced_at:
            new Date().toISOString(),

          updated_at:
            new Date().toISOString(),
        });

        // ------------------------------------------------------
        // Mark sold cartelas as synchronized
        // ------------------------------------------------------

        for (const cartela of soldCartelas) {
          await offlineDB.soldCartelas.put({
            ...cartela,

            game_id: gameId,

            synced: true,
            offline_created: false,

            updated_at:
              new Date().toISOString(),
          });
        }

        syncedCount++;

        console.log(
          "✅ OFFLINE GAME SYNCED:",
          gameId
        );

      } catch (gameError) {
        console.error(
          "❌ ERROR SYNCING GAME:",
          localGame.game_id,
          gameError
        );
      }
    }

    console.log(
      "🏁 OFFLINE GAME SYNC FINISHED:",
      syncedCount
    );

    return {
      success: true,
      synced: syncedCount,
    };

  } catch (error) {
    console.error(
      "❌ OFFLINE SYNC FAILED:",
      error
    );

    return {
      success: false,
      synced: syncedCount,
      error,
    };
  }
}
export async function createOfflineGame(game) {
  if (!game || !game.game_id) {
    return;
  }

  await offlineDB.games.put({
    ...game,

    game_id: String(game.game_id),
    house_id: String(game.house_id || ""),

    created_at:
      game.created_at || new Date().toISOString(),

    status:
      game.status || "Active",

    cards_sold:
      Number(game.cards_sold || 0),

    commission:
      Number(game.commission || 0),

    bet:
      Number(game.bet || 0),

    prize:
      Number(game.prize || 0),

    synced: false,

    offline_created:
      game.offline_created ?? false,

    local_updated_at:
      new Date().toISOString(),
  });
}
export async function saveLocalSetting(key, value) {
  if (!key) {
    return;
  }

  await offlineDB.settings.put({
    key: String(key),
    value,
    updated_at: new Date().toISOString(),
    synced: false,
  });
}

export async function getLocalSetting(key) {
  if (!key) {
    return null;
  }

  return await offlineDB.settings.get(String(key));
}// ============================================================
// OFFLINE LOGIN
// ============================================================

async function createPasswordVerifier(password) {
  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  const hashArray = Array.from(
    new Uint8Array(hashBuffer)
  );

  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function saveOfflineLogin(
  username,
  password,
  user
) {
  if (!username || !password || !user) return;

  const verifier =
    await createPasswordVerifier(password);

  await offlineDB.settings.put({
    key: `offline_login_${username.trim().toLowerCase()}`,

    username: username.trim(),

    passwordVerifier: verifier,

    user: user,

    updated_at: new Date().toISOString(),

    offlineLoginEnabled: true,
  });

  console.log(
    "💾 OFFLINE LOGIN SAVED:",
    username
  );
}

export async function verifyOfflineLogin(
  username,
  password
) {
  if (!username || !password) {
    return null;
  }

  const key =
    `offline_login_${username.trim().toLowerCase()}`;

  const saved =
    await offlineDB.settings.get(key);

  if (
    !saved ||
    !saved.offlineLoginEnabled ||
    !saved.passwordVerifier ||
    !saved.user
  ) {
    console.log(
      "📴 NO OFFLINE LOGIN FOUND:",
      username
    );

    return null;
  }

  const verifier =
    await createPasswordVerifier(password);

  if (
    verifier !== saved.passwordVerifier
  ) {
    console.log(
      "❌ OFFLINE LOGIN PASSWORD DOES NOT MATCH"
    );

    return null;
  }

  console.log(
    "✅ OFFLINE LOGIN VERIFIED:",
    saved.user
  );

  return saved.user;
}