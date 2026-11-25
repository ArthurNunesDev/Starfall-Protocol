const STORAGE_KEY = "starfall-protocol:active-session";
const SESSION_VERSION = 1;

export class GameSession {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const session = JSON.parse(raw);
      const isValid = session
        && session.version === SESSION_VERSION
        && session.status === "running"
        && Number.isFinite(session.elapsedTime)
        && session.elapsedTime >= 0
        && Number.isFinite(session.player?.x)
        && Number.isFinite(session.player?.y)
        && Number.isFinite(session.camera?.x)
        && Number.isFinite(session.camera?.y);

      if (!isValid) {
        this.clear();
        return null;
      }

      return session;
    } catch (error) {
      this.clear();
      return null;
    }
  }

  save(session) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: SESSION_VERSION,
        status: "running",
        elapsedTime: session.elapsedTime,
        characterId: session.characterId || "operator-01",
        player: {
          x: session.player.x,
          y: session.player.y,
        },
        camera: {
          x: session.camera.x,
          y: session.camera.y,
        },
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // A indisponibilidade do armazenamento não deve interromper a partida.
    }
  }
}
