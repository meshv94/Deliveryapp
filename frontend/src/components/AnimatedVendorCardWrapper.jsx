import React, { useState } from 'react';
import { Box } from '@mui/material';

/**
 * Vendor Card Entrance Animation Wrapper
 * Provides fade-in + slide-in animation on load
 * Uses CSS animations - lightweight and performant
 * Includes stagger effect for multiple cards
 */
const AnimatedVendorCardWrapper = ({ children, index = 0, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    // Trigger animation on mount with stagger
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay + index * 80); // Stagger: 80ms between cards

    return () => clearTimeout(timer);
  }, [index, delay]);

  return (
    <Box
      sx={{
        animation: isVisible ? 'cardEntranceAnimation 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
        opacity: 0, // Start invisible
        transform: 'translateY(20px)', // Start below
      }}
    >
      {children}
    </Box>
  );
};

export default AnimatedVendorCardWrapper;
