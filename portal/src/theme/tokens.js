// AapnuBazaar Admin Design Tokens
export const brandColors = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EBFBEE',
  borderGreen: '#B2F2BB',
  orange: '#FF6B00',
  lightOrange: '#FFF4E6',
  borderOrange: '#FFD8A8',
  blueAccent: '#2563EB',
  lightBlue: '#EFF6FF',
  borderBlue: '#BFDBFE',
  adminBg: '#F3F7FB',
  white: '#FFFFFF',
  primaryText: '#14213D',
  secondaryText: '#64748B',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  success: '#16A34A',
  successLight: '#DCFCE7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
};

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
