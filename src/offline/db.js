import Dexie from "dexie";

export const offlineDB = new Dexie("BingoOfflineDB");

offlineDB.version(1).stores({
  games: "game_id, house_id, created_at, status",
  calledBalls: "++id, game_id, number, called_at",
  soldCartelas: "++id, game_id, cartela_id, house_id, sold_at",
  package: "house_id",
  performance: "++id, house_id, period, date",
  syncQueue: "++id, type, created_at, synced",
  settings: "key",
});