// ==== CORRIGÉ : storage.js ====
// Storage module for localStorage + Telegram.WebApp.CloudStorage compatibility

const Storage = {
  // Detect if we're in Telegram WebApp environment
  isTelegram: typeof Telegram !== 'undefined' && Telegram.WebApp,

  // Save data to storage
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);

      if (this.isTelegram) {
        // Use Telegram cloud storage
        Telegram.WebApp.CloudStorage.setItem(key, serialized);
      } else {
        // Use localStorage
        localStorage.setItem(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  },

  // Load data from storage
  load(key) {
    try {
      let data;

      if (this.isTelegram) {
        // Try Telegram cloud storage first
        data = Telegram.WebApp.CloudStorage.getItem(key);
      } else {
        // Use localStorage
        data = localStorage.getItem(key);
      }

      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Storage load error:', error);
      return null;
    }
  },

  // Remove item from storage
  remove(key) {
    try {
      if (this.isTelegram) {
        Telegram.WebApp.CloudStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  // Clear all storage
  clear() {
    try {
      if (this.isTelegram) {
        Telegram.WebApp.CloudStorage.clear();
      } else {
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  // Check if storage is available
  isAvailable() {
    try {
      if (this.isTelegram) {
        return true;
      }
      // Test localStorage
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}