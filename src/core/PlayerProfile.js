const STORAGE_KEY = "starfall-protocol:player-profile";
const PROFILE_VERSION = 1;
const STARTER_CHARACTER = "operator-01";

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  const uniqueEntries = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.id !== "string" || !/^[a-z0-9-]{1,48}$/i.test(entry.id)) continue;
    if (typeof entry.name !== "string" || !entry.name.trim()) continue;
    uniqueEntries.set(entry.id, {
      id: entry.id,
      name: entry.name.trim().slice(0, 80),
      description: typeof entry.description === "string" ? entry.description.trim().slice(0, 240) : "",
    });
  }
  return [...uniqueEntries.values()];
}

function normalizeProfile(value) {
  const unlockedCharacters = Array.isArray(value?.unlockedCharacters)
    ? [...new Set(value.unlockedCharacters.filter((id) => typeof id === "string" && /^[a-z0-9-]{1,48}$/i.test(id)))]
    : [];
  if (!unlockedCharacters.includes(STARTER_CHARACTER)) unlockedCharacters.unshift(STARTER_CHARACTER);
  const selectedCharacter = unlockedCharacters.includes(value?.selectedCharacter)
    ? value.selectedCharacter
    : STARTER_CHARACTER;
  return {
    version: PROFILE_VERSION,
    unlockedCharacters,
    selectedCharacter,
    unlockedWeapons: normalizeEntries(value?.unlockedWeapons),
    defeatedEnemies: normalizeEntries(value?.defeatedEnemies),
  };
}

export class PlayerProfile {
  getProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return normalizeProfile(null);
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== PROFILE_VERSION) {
        const profile = normalizeProfile(null);
        this.#save(profile);
        return profile;
      }
      return normalizeProfile(parsed);
    } catch (error) {
      return normalizeProfile(null);
    }
  }

  selectCharacter(characterId) {
    const profile = this.getProfile();
    if (!profile.unlockedCharacters.includes(characterId)) return false;
    profile.selectedCharacter = characterId;
    return this.#save(profile);
  }

  unlockCharacter(characterId) {
    if (typeof characterId !== "string" || !/^[a-z0-9-]{1,48}$/i.test(characterId)) return false;
    const profile = this.getProfile();
    if (!profile.unlockedCharacters.includes(characterId)) profile.unlockedCharacters.push(characterId);
    return this.#save(profile);
  }

  unlockWeapon(weapon) {
    return this.#registerEntry("unlockedWeapons", weapon);
  }

  recordEnemyDefeat(enemy) {
    return this.#registerEntry("defeatedEnemies", enemy);
  }

  #registerEntry(collection, entry) {
    if (!entry || typeof entry.id !== "string" || !/^[a-z0-9-]{1,48}$/i.test(entry.id)
      || typeof entry.name !== "string" || !entry.name.trim()) return false;
    const profile = this.getProfile();
    const records = profile[collection];
    const normalized = {
      id: entry.id,
      name: entry.name.trim().slice(0, 80),
      description: typeof entry.description === "string" ? entry.description.trim().slice(0, 240) : "",
    };
    const existingIndex = records.findIndex((record) => record.id === normalized.id);
    if (existingIndex >= 0) records[existingIndex] = normalized;
    else records.push(normalized);
    return this.#save(profile);
  }

  #save(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      return true;
    } catch (error) {
      return false;
    }
  }
}
