export const AVATAR_DIMS = {
  width: 180,
  height: 130,
  baseScale: 0.05,
  horizontal: { startX: 100, spacing: 2, centerY: 75 },
  vertical: { centerX: 90, startY: 15, spacingY: 30 }
};

export const SLOT_DESKTOP = {
  width: 200,
  height: 400,
  spacing: 6,
  paddingH: 20,
  paddingV: 12
};

// Configuracion de giro 
export const SPIN_CONFIG = {
  spinTime: 2800,
  maxSpeed: 95,
  spacing: 90,
  decelerationCurve: 0.28,
  initialAcceleration: 0.22,
  winEffectDuration: 1400
};

export const COLORS = {
  background: 0x061c12,
  panel: 0x2d3436,
  card: 0x3a4143,
  border: 0x636e72,
  text: 0xffffff,
  textLight: 0xdfe6e9,
  accent: 0xffd93d,
  accentDark: 0xcca800,
  slotBg: 0xffffff,
  slotDark: 0xf5f6fa,
  slotBorder: 0xb2bec3,
  windowBg: 0x1e252b,
  windowInner: 0xffffff,
  buttonPrimary: 0x2ed573,
  buttonSecondary: 0xffa502,
  buttonDanger: 0xff4757,
  buttonInfo: 0x1e90ff,
  buttonPurple: 0x9c27b0
};

// Paleta del AvatarAdjuster 
export const ADJUSTER_COLORS = {
  light: {
    background: 0xf5f5f5,
    panel: 0xffffff,
    card: 0xfafafa,
    border: 0xdddddd,
    text: 0x333333,
    textSecondary: 0x666666,
    accent: 0xffd93d,
    buttonBg: 0xeeeeee,
    buttonText: 0x333333,
    grid: 0xcccccc,
    selectorBg: 0xffffff,
    selectorBorder: 0xdddddd
  },
  dark: {
    background: 0x1e2b38,
    panel: 0x2c3e50,
    card: 0x1e2b38,
    border: 0x4a5b6b,
    text: 0xffffff,
    textSecondary: 0xcccccc,
    accent: 0xffd93d,
    buttonBg: 0x4a5b6b,
    buttonText: 0xffffff,
    grid: 0x4a5b6b,
    selectorBg: 0x0a0f14,
    selectorBorder: 0x4a5b6b
  }
};