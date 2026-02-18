/**
 * Stamp Duty Calculator for all Australian States and Territories
 * 
 * Calculates stamp duty (transfer duty) based on property value and state.
 * Includes first home buyer concessions where applicable.
 * 
 * Note: These are general calculations. Actual stamp duty may vary based on
 * specific circumstances. Always verify with official state revenue offices.
 */

const STAMP_DUTY_RATES = {
  NSW: {
    // NSW uses tiered brackets
    brackets: [
      { min: 0, max: 16000, base: 0, rate: 1.25 },
      { min: 16000, max: 32000, base: 200, rate: 1.5 },
      { min: 32000, max: 85000, base: 440, rate: 1.75 },
      { min: 85000, max: 319000, base: 1368, rate: 3.5 },
      { min: 319000, max: 1064000, base: 9558, rate: 4.5 },
      { min: 1064000, max: 3238000, base: 43083, rate: 5.5 },
      { min: 3238000, max: Infinity, base: 162660, rate: 7 },
    ],
    firstHomeBuyer: {
      fullExemption: 800000,
      partialExemption: 1000000,
    },
  },
  VIC: {
    brackets: [
      { min: 0, max: 25000, base: 0, rate: 1.4 },
      { min: 25000, max: 130000, base: 350, rate: 2.4 },
      { min: 130000, max: 960000, base: 2870, rate: 6 },
      { min: 960000, max: Infinity, base: 52670, rate: 5.5 },
    ],
    firstHomeBuyer: {
      fullExemption: 600000,
      partialExemption: 750000,
    },
  },
  QLD: {
    brackets: [
      { min: 0, max: 5000, base: 0, rate: 0 },
      { min: 5000, max: 75000, base: 0, rate: 1.5 },
      { min: 75000, max: 540000, base: 1050, rate: 3.5 },
      { min: 540000, max: 1000000, base: 17325, rate: 4.5 },
      { min: 1000000, max: Infinity, base: 38025, rate: 5.75 },
    ],
    firstHomeBuyer: {
      fullExemption: 500000,
      partialExemption: null,
    },
  },
  SA: {
    brackets: [
      { min: 0, max: 12000, base: 0, rate: 1 },
      { min: 12000, max: 30000, base: 120, rate: 2 },
      { min: 30000, max: 50000, base: 480, rate: 3 },
      { min: 50000, max: 100000, base: 1080, rate: 3.5 },
      { min: 100000, max: 200000, base: 2830, rate: 4 },
      { min: 200000, max: 250000, base: 6830, rate: 4.25 },
      { min: 250000, max: 300000, base: 8955, rate: 4.75 },
      { min: 300000, max: 500000, base: 11330, rate: 5 },
      { min: 500000, max: Infinity, base: 21330, rate: 5.5 },
    ],
    firstHomeBuyer: {
      fullExemption: 650000,
      partialExemption: null,
    },
  },
  WA: {
    brackets: [
      { min: 0, max: 120000, base: 0, rate: 1.9 },
      { min: 120000, max: 150000, base: 2280, rate: 2.85 },
      { min: 150000, max: 360000, base: 3135, rate: 3.8 },
      { min: 360000, max: 725000, base: 11115, rate: 4.75 },
      { min: 725000, max: Infinity, base: 28453, rate: 5.15 },
    ],
    firstHomeBuyer: {
      fullExemption: 430000,
      partialExemption: 530000,
    },
  },
  TAS: {
    brackets: [
      { min: 0, max: 3000, base: 0, rate: 0 },
      { min: 3000, max: 25000, base: 50, rate: 1.75 },
      { min: 25000, max: 75000, base: 435, rate: 2.25 },
      { min: 75000, max: 200000, base: 1560, rate: 3.5 },
      { min: 200000, max: 375000, base: 5935, rate: 4 },
      { min: 375000, max: 725000, base: 12935, rate: 4.25 },
      { min: 725000, max: Infinity, base: 27810, rate: 4.5 },
    ],
    firstHomeBuyer: {
      fullExemption: 600000,
      partialExemption: null,
    },
  },
  NT: {
    // NT uses a simplified calculation
    rate: 0.0645, // 6.45% for properties over threshold
    threshold: 525000,
    firstHomeBuyer: {
      fullExemption: 650000,
      partialExemption: null,
    },
  },
  ACT: {
    brackets: [
      { min: 0, max: 200000, base: 0, rate: 0 },
      { min: 200000, max: 300000, base: 100, rate: 2.2 },
      { min: 300000, max: 500000, base: 2300, rate: 3.4 },
      { min: 500000, max: 750000, base: 9100, rate: 4.32 },
      { min: 750000, max: 1000000, base: 19900, rate: 5.9 },
      { min: 1000000, max: 1455000, base: 34650, rate: 6.4 },
      { min: 1455000, max: Infinity, base: 63770, rate: 7 },
    ],
    firstHomeBuyer: {
      fullExemption: null,
      partialExemption: null,
    },
  },
};

/**
 * Calculate stamp duty for a property
 * @param {number} propertyValue - Purchase price of the property
 * @param {string} state - Australian state/territory (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
 * @param {boolean} isFirstHome - Whether buyer is a first home buyer
 * @returns {object} Stamp duty calculation result
 */
export function calculateStampDuty(propertyValue, state, isFirstHome = false) {
  const stateData = STAMP_DUTY_RATES[state.toUpperCase()];

  if (!stateData) {
    throw new Error(`Invalid state: ${state}. Must be one of: NSW, VIC, QLD, SA, WA, TAS, NT, ACT`);
  }

  // Check first home buyer concessions
  if (isFirstHome && stateData.firstHomeBuyer) {
    const { fullExemption, partialExemption } = stateData.firstHomeBuyer;

    if (fullExemption && propertyValue <= fullExemption) {
      return {
        state,
        propertyValue,
        isFirstHome,
        total: 0,
        concessionApplied: true,
        concessionType: 'Full Exemption',
        savingsAmount: calculateFullStampDuty(propertyValue, stateData),
      };
    }

    if (partialExemption && propertyValue <= partialExemption) {
      const fullDuty = calculateFullStampDuty(propertyValue, stateData);
      const discount = calculatePartialConcession(propertyValue, fullExemption, partialExemption, fullDuty);
      
      return {
        state,
        propertyValue,
        isFirstHome,
        total: fullDuty - discount,
        concessionApplied: true,
        concessionType: 'Partial Concession',
        savingsAmount: discount,
      };
    }
  }

  // Calculate standard stamp duty
  const duty = calculateFullStampDuty(propertyValue, stateData);

  return {
    state,
    propertyValue,
    isFirstHome,
    total: duty,
    concessionApplied: false,
    concessionType: null,
    savingsAmount: 0,
  };
}

/**
 * Calculate full stamp duty without concessions
 */
function calculateFullStampDuty(propertyValue, stateData) {
  // NT uses simple percentage calculation
  if (stateData.rate !== undefined) {
    if (propertyValue <= stateData.threshold) {
      return 0;
    }
    return Math.round(propertyValue * stateData.rate);
  }

  // Bracket-based calculation for other states
  for (const bracket of stateData.brackets) {
    if (propertyValue <= bracket.max) {
      const amountInBracket = propertyValue - bracket.min;
      const duty = bracket.base + (amountInBracket * bracket.rate / 100);
      return Math.round(duty);
    }
  }

  // Should never reach here if brackets are properly defined
  throw new Error('Property value exceeds all brackets');
}

/**
 * Calculate partial concession for first home buyers
 */
function calculatePartialConcession(propertyValue, fullExemption, partialExemption, fullDuty) {
  const range = partialExemption - fullExemption;
  const excess = propertyValue - fullExemption;
  const discountPercentage = 1 - (excess / range);
  return Math.round(fullDuty * discountPercentage);
}
