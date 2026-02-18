/**
 * Cash Flow Calculator
 * 
 * Calculates property investment cash flow by combining rental income,
 * loan repayments, and all property-related expenses.
 */

/**
 * Calculate annual cash flow
 * @param {number} annualRentalIncome - Total annual rental income
 * @param {number} annualLoanRepayment - Annual loan repayment amount
 * @param {object} annualExpenses - Object containing all annual expenses
 * @returns {object} Cash flow calculation details
 */
export function calculateCashFlow(annualRentalIncome, annualLoanRepayment, annualExpenses) {
  // Sum all expenses
  const totalExpenses = Object.values(annualExpenses).reduce((sum, expense) => sum + expense, 0);
  
  // Calculate total costs (loan + expenses)
  const totalAnnualCosts = annualLoanRepayment + totalExpenses;
  
  // Calculate net cash flow
  const annualCashFlow = annualRentalIncome - totalAnnualCosts;
  const monthlyCashFlow = annualCashFlow / 12;
  const weeklyCashFlow = annualCashFlow / 52;
  
  return {
    income: {
      annual: Math.round(annualRentalIncome * 100) / 100,
      monthly: Math.round((annualRentalIncome / 12) * 100) / 100,
      weekly: Math.round((annualRentalIncome / 52) * 100) / 100,
    },
    costs: {
      loanRepayment: Math.round(annualLoanRepayment * 100) / 100,
      expenses: Math.round(totalExpenses * 100) / 100,
      total: Math.round(totalAnnualCosts * 100) / 100,
      breakdown: {
        propertyManagement: Math.round(annualExpenses.propertyManagement * 100) / 100,
        councilRates: Math.round(annualExpenses.councilRates * 100) / 100,
        waterRates: Math.round(annualExpenses.waterRates * 100) / 100,
        insurance: Math.round(annualExpenses.insurance * 100) / 100,
        maintenance: Math.round(annualExpenses.maintenance * 100) / 100,
      },
    },
    cashFlow: {
      annual: Math.round(annualCashFlow * 100) / 100,
      monthly: Math.round(monthlyCashFlow * 100) / 100,
      weekly: Math.round(weeklyCashFlow * 100) / 100,
    },
    isPositive: annualCashFlow >= 0,
  };
}

/**
 * Calculate rental yield
 * @param {number} annualRentalIncome - Total annual rental income
 * @param {number} propertyValue - Property purchase price
 * @returns {object} Rental yield calculation
 */
export function calculateRentalYield(annualRentalIncome, propertyValue) {
  if (propertyValue <= 0) {
    throw new Error('Property value must be greater than 0');
  }
  
  const grossYield = (annualRentalIncome / propertyValue) * 100;
  
  return {
    grossYield: Math.round(grossYield * 100) / 100,
    annualRent: Math.round(annualRentalIncome * 100) / 100,
    propertyValue: Math.round(propertyValue * 100) / 100,
  };
}

/**
 * Calculate net rental yield (after expenses but before loan repayments)
 * @param {number} annualRentalIncome - Total annual rental income
 * @param {number} propertyValue - Property purchase price
 * @param {object} annualExpenses - Object containing all annual expenses
 * @returns {object} Net rental yield calculation
 */
export function calculateNetRentalYield(annualRentalIncome, propertyValue, annualExpenses) {
  if (propertyValue <= 0) {
    throw new Error('Property value must be greater than 0');
  }
  
  const totalExpenses = Object.values(annualExpenses).reduce((sum, expense) => sum + expense, 0);
  const netIncome = annualRentalIncome - totalExpenses;
  const netYield = (netIncome / propertyValue) * 100;
  
  return {
    netYield: Math.round(netYield * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    propertyValue: Math.round(propertyValue * 100) / 100,
  };
}
