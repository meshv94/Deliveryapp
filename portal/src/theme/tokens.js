// AapnuBazaar Admin Design Tokens supporting Light and Dark modes
export const getDesignTokens = (mode = 'light') => {
  const isDark = mode === 'dark';

  if (isDark) {
    return {
      // Primary Brand (Emerald Green)
      green: '#10B981',
      primaryGreen: '#10B981',
      darkGreen: '#059669',
      lightGreen: 'rgba(16, 185, 129, 0.16)',
      borderGreen: 'rgba(16, 185, 129, 0.35)',

      // Secondary Brand (Orange)
      orange: '#FB923C',
      lightOrange: 'rgba(251, 146, 60, 0.16)',
      borderOrange: 'rgba(251, 146, 60, 0.35)',

      // Blue Accent
      blue: '#60A5FA',
      blueAccent: '#60A5FA',
      lightBlue: 'rgba(96, 165, 250, 0.16)',
      borderBlue: 'rgba(96, 165, 250, 0.35)',

      // Purple Accent
      purple: '#A78BFA',
      lightPurple: 'rgba(167, 139, 250, 0.16)',
      borderPurple: 'rgba(167, 139, 250, 0.35)',

      // Amber / Warning
      amber: '#FBBF24',
      amberLight: 'rgba(251, 191, 36, 0.16)',
      warning: '#FBBF24',
      warningLight: 'rgba(251, 191, 36, 0.16)',

      // Red / Error
      red: '#F87171',
      redLight: 'rgba(248, 113, 113, 0.16)',
      error: '#F87171',
      errorLight: 'rgba(248, 113, 113, 0.16)',

      // Success
      success: '#34D399',
      successLight: 'rgba(52, 211, 153, 0.16)',

      // Surfaces & Backgrounds - Sleek Black / Dark Slate
      bg: '#0A0E1A',
      adminBg: '#0A0E1A',
      white: '#111827',
      cardBg: '#111827',
      paperBg: '#111827',
      innerCard: '#182236',
      inputBg: '#111827',
      paperHover: '#1E293B',
      tableHover: 'rgba(255, 255, 255, 0.04)',

      // Typography - High Contrast & Crisp
      text: '#FFFFFF',
      primaryText: '#FFFFFF',
      muted: '#94A3B8',
      secondaryText: '#94A3B8',
      placeholder: '#64748B',

      // Borders & Dividers
      border: '#24324D',
      borderLight: '#1E293B',
      divider: '#24324D',
    };
  }

  return {
    // Primary Brand (Emerald Green)
    green: '#087F5B',
    primaryGreen: '#087F5B',
    darkGreen: '#075B43',
    lightGreen: '#EBFBEE',
    borderGreen: '#B2F2BB',

    // Secondary Brand (Orange)
    orange: '#FF6B00',
    lightOrange: '#FFF4E6',
    borderOrange: '#FFD8A8',

    // Blue Accent
    blue: '#2563EB',
    blueAccent: '#2563EB',
    lightBlue: '#EFF6FF',
    borderBlue: '#BFDBFE',

    // Purple Accent
    purple: '#7C3AED',
    lightPurple: '#EDE9FE',
    borderPurple: '#DDD6FE',

    // Amber / Warning
    amber: '#D97706',
    amberLight: '#FEF3C7',
    warning: '#D97706',
    warningLight: '#FEF3C7',

    // Red / Error
    red: '#DC2626',
    redLight: '#FEE2E2',
    error: '#DC2626',
    errorLight: '#FEE2E2',

    // Success
    success: '#16A34A',
    successLight: '#DCFCE7',

    // Surfaces & Backgrounds - Clean Bright
    bg: '#F3F7FB',
    adminBg: '#F3F7FB',
    white: '#FFFFFF',
    cardBg: '#FFFFFF',
    paperBg: '#FFFFFF',
    innerCard: '#F8FAFC',
    inputBg: '#FFFFFF',
    paperHover: '#F8FAFC',
    tableHover: '#F8FAFC',

    // Typography
    text: '#0F172A',
    primaryText: '#0F172A',
    muted: '#64748B',
    secondaryText: '#64748B',
    placeholder: '#94A3B8',

    // Borders & Dividers
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#F1F5F9',
  };
};

export const brandColors = getDesignTokens('light');

export const cardStyles = {
  borderRadius: '20px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 20px rgba(20, 33, 61, 0.04)',
};

export const pillStyles = (type = 'green') => {
  if (type === 'orange') {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      px: 1.5,
      py: 0.5,
      borderRadius: '50px',
      backgroundColor: brandColors.lightOrange,
      color: brandColors.orange,
      fontSize: '12px',
      fontWeight: 700,
    };
  }
  if (type === 'blue') {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      px: 1.5,
      py: 0.5,
      borderRadius: '50px',
      backgroundColor: brandColors.lightBlue,
      color: brandColors.blueAccent,
      fontSize: '12px',
      fontWeight: 700,
    };
  }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    px: 1.5,
    py: 0.5,
    borderRadius: '50px',
    backgroundColor: brandColors.lightGreen,
    color: brandColors.primaryGreen,
    fontSize: '12px',
    fontWeight: 700,
  };
};
