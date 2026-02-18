/**
 * Calculate year-by-year equity, rent, and cash flow for the full loan term
 * Identifies when the property becomes self-sufficient (cash flow positive)
 */
export function calculateYearByYear({
  purchasePrice,
  loanAmount,
  interestRate,
  loanTerm,
  initialMonthlyRent,
  monthlyExpenses,
  capitalGrowthRate,
  rentalGrowthRate,
}) {
  const yearlyData = [];
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalPayments = loanTerm * 12;
  
  // Calculate monthly loan payment (principal + interest)
  const monthlyPayment = loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / 
    (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);

  let remainingBalance = loanAmount;
  let currentPropertyValue = purchasePrice;
  let currentMonthlyRent = initialMonthlyRent;
  let selfSufficientYear = null;

  for (let year = 1; year <= loanTerm; year++) {
    // Track values at the start of the year
    const yearStartBalance = remainingBalance;
    const yearStartPropertyValue = currentPropertyValue;
    const yearStartMonthlyRent = currentMonthlyRent;

    // Calculate monthly values for this year
    let yearlyPrincipalPaid = 0;
    let yearlyInterestPaid = 0;

    for (let month = 1; month <= 12; month++) {
      if (remainingBalance > 0) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        
        yearlyInterestPaid += interestPayment;
        yearlyPrincipalPaid += principalPayment;
        remainingBalance -= principalPayment;
        
        // Ensure we don't go negative
        if (remainingBalance < 0) remainingBalance = 0;
      }
    }

    // Apply growth rates at year end
    currentPropertyValue *= (1 + capitalGrowthRate / 100);
    currentMonthlyRent *= (1 + rentalGrowthRate / 100);

    // Calculate equity (property value - remaining loan)
    const equity = currentPropertyValue - remainingBalance;
    const equityPercentage = (equity / currentPropertyValue) * 100;

    // Calculate annual income and expenses
    const annualRent = yearStartMonthlyRent * 12;
    const annualExpenses = monthlyExpenses * 12;
    const annualLoanPayment = monthlyPayment * 12;

    // Calculate cash flow
    const annualCashFlow = annualRent - annualExpenses - annualLoanPayment;
    const monthlyCashFlow = annualCashFlow / 12;

    // Check if property becomes self-sufficient this year
    if (!selfSufficientYear && annualCashFlow >= 0) {
      selfSufficientYear = year;
    }

    yearlyData.push({
      year,
      propertyValue: Math.round(currentPropertyValue),
      loanBalance: Math.round(remainingBalance),
      equity: Math.round(equity),
      equityPercentage: Math.round(equityPercentage * 100) / 100,
      monthlyRent: Math.round(yearStartMonthlyRent),
      annualRent: Math.round(annualRent),
      principalPaid: Math.round(yearlyPrincipalPaid),
      interestPaid: Math.round(yearlyInterestPaid),
      monthlyCashFlow: Math.round(monthlyCashFlow),
      annualCashFlow: Math.round(annualCashFlow),
      isSelfSufficient: annualCashFlow >= 0,
    });
  }

  return {
    yearlyData,
    selfSufficientYear,
    summary: {
      totalYears: loanTerm,
      finalPropertyValue: Math.round(currentPropertyValue),
      finalEquity: Math.round(currentPropertyValue), // Loan fully paid
      finalMonthlyRent: Math.round(currentMonthlyRent),
      selfSufficientYear,
      yearsUntilSelfSufficient: selfSufficientYear || 'Never',
    }
  };
}
