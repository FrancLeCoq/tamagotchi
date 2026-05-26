// ==== CORRIGÉ : weather.js ====
// Fix: Canvas initialization with 0x0 dimensions -> force default size

const Weather = {
  canvas: null,
  ctx: null,
  initialized: false,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return false;
    }

    // Fix: Force default size and proper styling
    this.canvas.width = this.canvas.width || 800;
    this.canvas.height = this.canvas.height || 600;
    this.canvas.style.display = 'block';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '0';

    this.ctx = this.canvas.getContext('2d');
    this.initialized = true;

    // Retry initialization if needed
    if (!this.ctx) {
      setTimeout(() => this.init(canvasId), 100);
      return false;
    }

    return true;
  },

  // Draw sky background
  drawSky() {
    if (!this.initialized) return;

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Light sky blue
    gradient.addColorStop(1, '#1E90FF'); // Dodger blue

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  // Draw clouds
  drawClouds() {
    if (!this.initialized) return;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    // Cloud 1
    this.ctx.beginPath();
    this.ctx.arc(100, 100, 40, 0, Math.PI * 2);
    this.ctx.arc(140, 100, 50, 0, Math.PI * 2);
    this.ctx.arc(180, 100, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // Cloud 2
    this.ctx.beginPath();
    this.ctx.arc(400, 150, 30, 0, Math.PI * 2);
    this.ctx.arc(430, 150, 40, 0, Math.PI * 2);
    this.ctx.arc(460, 150, 35, 0, Math.PI * 2);
    this.ctx.fill();

    // Cloud 3
    this.ctx.beginPath();
    this.ctx.arc(600, 80, 35, 0, Math.PI * 2);
    this.ctx.arc(640, 80, 45, 0, Math.PI * 2);
    this.ctx.arc(680, 80, 30, 0, Math.PI * 2);
    this.ctx.fill();
  },

  // Draw sun
  drawSun() {
    if (!this.initialized) return;

    const sun = {
      x: this.canvas.width - 100,
      y: 100,
      radius: 50
    };

    // Sun circle
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Sun rays
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const rayLength = sun.radius + 20;
      this.ctx.beginPath();
      this.ctx.moveTo(sun.x, sun.y);
      this.ctx.lineTo(
        sun.x + Math.cos(angle) * rayLength,
        sun.y + Math.sin(angle) * rayLength
      );
      this.ctx.stroke();
    }
  },

  // Draw moon
  drawMoon() {
    if (!this.initialized) return;

    this.ctx.fillStyle = '#F5F5DC';
    this.ctx.beginPath();
    this.ctx.arc(100, 100, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // Moon craters
    this.ctx.fillStyle = '#D3D3D3';
    this.ctx.beginPath();
    this.ctx.arc(90, 90, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(110, 110, 6, 0, Math.PI * 2);
    this.ctx.fill();
  },

  // Draw rain
  drawRain() {
    if (!this.initialized) return;

    this.ctx.strokeStyle = 'rgba(173, 216, 230, 0.7)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const length = 10 + Math.random() * 15;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + length);
      this.ctx.stroke();
    }
  },

  // Main render function
  render(weatherType) {
    if (!this.initialized) {
      if (!this.init('weather-canvas')) {
        return;
      }
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawSky();
    this.drawClouds();

    switch (weatherType) {
      case 'sunny':
        this.drawSun();
        break;
      case 'night':
        this.drawMoon();
        break;
      case 'rain':
        this.drawRain();
        this.drawClouds();
        break;
      default:
        this.drawSun();
    }
  }
};

// Auto-initialize on load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  Weather.init('weather-canvas');
} else {
  document.addEventListener('DOMContentLoaded', () => {
    Weather.init('weather-canvas');
  });
}