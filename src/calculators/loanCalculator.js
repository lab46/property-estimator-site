/**
 * Loan Calculator
 * 
 * Calculates loan repayments using standard amortization formulas.
 * Provides monthly and annual repayment amounts, total interest paid,
 * and total amount to be repaid over the loan term.
 */

/**
 * Calculate loan repayment details
 * @param {number} loanAmount - Principal loan amount
 * @param {number} annualInterestRate - Annual interest rate as percentage (e.g., 5.5 for 5.5%)
 * @param {number} loanTermYears - Loan term in years
 * @returns {object} Loan calculation details
 */
export function calculateLoanRepayments(loanAmount, annualInterestRate, loanTermYears) {
  if (loanAmount <= 0) {
    throw new Error('Loan amount must be greater than 0');
  }
  
  if (annualInterestRate < 0 || annualInterestRate > 100) {
    throw new Error('Interest rate must be between 0 and 100');
  }
  
  if (loanTermYears <= 0 || loanTermYears > 50) {
    throw new Error('Loan term must be between 1 and 50 years');
  }

  // Convert annual rate to monthly rate (as decimal)
  const monthlyRate = (annualInterestRate / 100) / 12;
  
  // Total number of payments
  const numberOfPayments = loanTermYears * 12;
  
  // Calculate monthly repayment using amortization formula
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  // Where: M = monthly payment, P = principal, r = monthly rate, n = number of payments
  
  let monthlyRepayment;
  if (monthlyRate === 0) {
    // If interest rate is 0, simple division
    monthlyRepayment = loanAmount / numberOfPayments;
  } else {
    const factor = Math.pow(1 + monthlyRate, numberOfPayments);
    monthlyRepayment = loanAmount * (monthlyRate * factor) / (factor - 1);
  }
  
  // Calculate totals
  const totalRepayment = monthlyRepayment * numberOfPayments;
  const totalInterest = totalRepayment - loanAmount;
  
  // Calculate annual repayment
  const annualRepayment = monthlyRepayment * 12;
  
  return {
    loanAmount: Math.round(loanAmount),
    annualInterestRate,
    loanTermYears,
    monthlyRepayment: Math.round(monthlyRepayment * 100) / 100,
    annualRepayment: Math.round(annualRepayment * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    numberOfPayments,
  };
}

/**
 * Generate loan amortization schedule
 * @param {number} loanAmount - Principal loan amount
 * @param {number} annualInterestRate - Annual interest rate as percentage
 * @param {number} loanTermYears - Loan term in years
 * @param {number} yearlyInterval - How often to return data (1 = every year, 5 = every 5 years)
 * @returns {array} Array of payment details for each interval
 */
export function generateAmortizationSchedule(loanAmount, annualInterestRate, loanTermYears, yearlyInterval = 1) {
  const { monthlyRepayment } = calculateLoanRepayments(loanAmount, annualInterestRate, loanTermYears);
  const monthlyRate = (annualInterestRate / 100) / 12;
  
  const schedule = [];
  let remainingBalance = loanAmount;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  
  for (let year = 0; year <= loanTermYears; year++) {
    if (year % yearlyInterval === 0 || year === loanTermYears) {
      schedule.push({
        year,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
        totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
        totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
        equityBuilt: Math.round((loanAmount - remainingBalance) * 100) / 100,
      });
    }
    
    // Calculate payments for this year
    for (let month = 0; month < 12 && remainingBalance > 0; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyRepayment - interestPayment;
      
      remainingBalance -= principalPayment;
      totalPrincipalPaid += principalPayment;
      totalInterestPaid += interestPayment;
      
      // Prevent negative balance due to rounding
      if (remainingBalance < 0) remainingBalance = 0;
    }
  }
  
  return schedule;
}

/**
 * Calculate loan-to-value ratio (LVR)
 * @param {number} loanAmount - Loan amount
 * @param {number} propertyValue - Property purchase price
 * @returns {object} LVR details
 */
export function calculateLVR(loanAmount, propertyValue) {
  if (propertyValue <= 0) {
    throw new Error('Property value must be greater than 0');
  }
  
  const lvr = (loanAmount / propertyValue) * 100;
  const requiresLMI = lvr > 80; // Lenders Mortgage Insurance typically required above 80% LVR
  
  return {
    lvr: Math.round(lvr * 100) / 100,
    requiresLMI,
    deposit: propertyValue - loanAmount,
    depositPercentage: Math.round(((propertyValue - loanAmount) / propertyValue) * 100 * 100) / 100,
  };
}
