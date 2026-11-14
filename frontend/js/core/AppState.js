/**
 * frontend/js/core/AppState.js
 * Central reactive application state store with observer pattern.
 */

class StateStore {
  constructor() {
    this.state = {
      epoch: 0,                   // 0: 2025.0, 1: 2025.5, 2: 2026.0
      isPlaying: true,
      blinkRate: 2.5,             // Hz
      renderMode: "standard",     // standard | dipole | diff | invert
      contrast: 1.2,
      gaiaVectorsActive: true,
      gaiaMaskActive: false,
      selectedBand: 0,            // 0 = composite, 1..102 = band
      selectedTarget: null,
      zoom: 1.0,
      panX: 0,
      panY: 0
    };
    this.listeners = new Map();
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    if (this.state[key] === value) return;
    const oldVal = this.state[key];
    this.state[key] = value;
    this._notify(key, value, oldVal);
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }

  _notify(key, newVal, oldVal) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => cb(newVal, oldVal));
    }
    if (this.listeners.has("*")) {
      this.listeners.get("*").forEach(cb => cb(key, newVal, oldVal));
    }
  }
}

export const AppState = new StateStore();

