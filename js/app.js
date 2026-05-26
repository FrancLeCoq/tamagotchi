// ==== CORRIGÉ : app.js ====
// Fix: Save/load using Storage module for Telegram WebApp compatibility
// Fix: Cheat code handling and resume button visibility

const App = {
  // Game state
  pet: null,
  gameState: null,
  lastSaveTime: null,

  // DOM elements
  elements: {
    resumeButton: null,
    newGameButton: null,
    saveButton: null,
    loadButton: null,
    cheatInput: null
  },

  // Initialize the app
  init() {
    // Initialize Storage module first
    if (!Storage.isAvailable()) {
      console.warn('Storage not available, using in-memory only');
    }

    // Load saved game
    this.loadGame();

    // Setup DOM elements
    this.setupDOM();

    // Setup event listeners
    this.setupEvents();

    // Initialize cheat codes
    this.setupCheatCodes();

    // Start game loop
    this.startGameLoop();
  },

  // Setup DOM element references
  setupDOM() {
    this.elements.resumeButton = document.getElementById('resume-button');
    this.elements.newGameButton = document.getElementById('new-game-button');
    this.elements.saveButton = document.getElementById('save-button');
    this.elements.loadButton = document.getElementById('load-button');
    this.elements.cheatInput = document.getElementById('cheat-input');
  },

  // Setup event listeners
  setupEvents() {
    if (this.elements.resumeButton) {
      this.elements.resumeButton.addEventListener('click', () => this.resumeGame());
    }

    if (this.elements.newGameButton) {
      this.elements.newGameButton.addEventListener('click', () => this.newGame());
    }

    if (this.elements.saveButton) {
      this.elements.saveButton.addEventListener('click', () => this.saveGame());
    }

    if (this.elements.loadButton) {
      this.elements.loadButton.addEventListener('click', () => this.loadGame());
    }

    // Auto-save every 30 seconds
    setInterval(() => this.saveGame(), 30000);
  },

  // Setup cheat codes
  setupCheatCodes() {
    const cheatCodes = ['FRANCA', 'FRANCB', 'FRANCC', 'FRANCD', 'FRANCE'];

    if (this.elements.cheatInput) {
      this.elements.cheatInput.addEventListener('input', (e) => {
        const input = e.target.value.toUpperCase();

        for (const code of cheatCodes) {
          if (input === code) {
            this.activateCheat(code);
            e.target.value = '';
            break;
          }
        }
      });
    }
  },

  // Activate cheat code
  activateCheat(code) {
    console.log(`Cheat code activated: ${code}`);

    switch (code) {
      case 'FRANCA':
        // Give food
        if (this.pet) this.pet.feed();
        break;
      case 'FRANCB':
        // Full health
        if (this.pet) this.pet.setHealth(100);
        break;
      case 'FRANCC':
        // Max happiness
        if (this.pet) this.pet.setHappiness(100);
        break;
      case 'FRANCD':
        // Clean
        if (this.pet) this.pet.clean();
        break;
      case 'FRANCE':
        // Level up
        if (this.pet) this.pet.levelUp();
        break;
    }

    // Show notification
    this.showNotification(`Cheat: ${code}`);
  },

  // Show notification
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2000);
  },

  // New game
  newGame() {
    this.pet = new Pet();
    this.gameState = { started: true, timestamp: Date.now() };
    this.lastSaveTime = null;

    // Hide resume button, show game
    this.updateUI();

    // Save initial state
    this.saveGame();
  },

  // Resume game
  resumeGame() {
    const savedState = this.loadGame();
    if (savedState) {
      this.gameState = savedState.gameState;
      this.pet = savedState.pet;
      this.lastSaveTime = savedState.timestamp;
      this.updateUI();
    }
  },

  // Save game using Storage module
  saveGame() {
    if (!this.pet || !this.gameState) return;

    const saveData = {
      pet: this.pet.getState(),
      gameState: this.gameState,
      timestamp: Date.now()
    };

    // Use Storage module which handles both localStorage and Telegram
    Storage.save('francis-le-coq-save', saveData);
    this.lastSaveTime = Date.now();

    // Show resume button
    this.updateUI();
  },

  // Load game using Storage module
  loadGame() {
    // Use Storage module which handles both localStorage and Telegram
    const saveData = Storage.load('francis-le-coq-save');

    if (saveData) {
      this.pet = new Pet();
      this.pet.setState(saveData.pet);
      this.gameState = saveData.gameState;
      this.lastSaveTime = saveData.timestamp;

      // Show resume button
      this.updateUI();
      return saveData;
    }

    return null;
  },

  // Update UI based on game state
  updateUI() {
    const hasSavedGame = this.lastSaveTime || this.loadGame() !== null;

    if (this.elements.resumeButton) {
      // Fix: Show resume button only if there's a saved game
      this.elements.resumeButton.style.display = hasSavedGame ? 'block' : 'none';
    }

    if (this.elements.newGameButton) {
      this.elements.newGameButton.style.display = hasSavedGame ? 'none' : 'block';
    }
  },

  // Game loop
  startGameLoop() {
    const gameLoop = () => {
      if (this.pet) {
        this.pet.update();
      }

      if (this.gameState) {
        // Render weather and other elements
        if (typeof Weather !== 'undefined') {
          Weather.render('sunny');
        }
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  App.init();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
}