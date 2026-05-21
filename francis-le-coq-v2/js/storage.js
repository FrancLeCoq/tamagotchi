/* ═══════════════════════════════════════════════════════
   🐓 Storage — Save/Load via localStorage + Telegram
   ═══════════════════════════════════════════════════════ */

const Storage = {
    KEY: 'francis_save',
    tg: null,

    init() {
        if (window.Telegram?.WebApp?.CloudStorage) {
            this.tg = window.Telegram.WebApp.CloudStorage;
        }
    },

    save(data) {
        const json = JSON.stringify(data);
        try { localStorage.setItem(this.KEY, json); } catch(e) {}
        if (this.tg) {
            try { this.tg.setItem(this.KEY, json); } catch(e) {}
        }
    },

    load(callback) {
        // Try Telegram first, fallback to localStorage
        if (this.tg) {
            this.tg.getItem(this.KEY, (err, val) => {
                if (!err && val) {
                    try { callback(JSON.parse(val)); return; } catch(e) {}
                }
                callback(this._loadLocal());
            });
        } else {
            callback(this._loadLocal());
        }
    },

    _loadLocal() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
    },

    clear() {
        try { localStorage.removeItem(this.KEY); } catch(e) {}
        if (this.tg) {
            try { this.tg.removeItem(this.KEY); } catch(e) {}
        }
    }
};
