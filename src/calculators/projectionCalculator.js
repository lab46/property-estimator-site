/**
 * 30-Year Projection Calculator
 * 
 * Calculates year-by-year projections for property investment including:
 * - Property value growth
 * - Rental income growth
 * - Equity buildup
 * - Net worth tracking
 * - Cumulative cash flow
 */

import { generateAmortizationSchedule } from './loanCalculator.js';

/**
 * Calculate 30-year property investment projection
 * @param {object} params - Projection parameters
 * @returns {array} Year-by-year projection data
 */
export function calculate30YearProjection(params) {
  const {
    purchasePrice,
    annualRent,
    loanDetails,
    annualExpenses,
    capitalGrowthRate, // Annual property value growth %
    rentalGrowthRate,  // Annual rental income growth %
  } = params;

  const projectionYears = 30;
  const projection = [];
  
  // Get amortization schedule
  const amortization = generateAmortizationSchedule(
    loanDetails.loanAmount,
    loanDetails.annualInterestRate,
    loanDetails.loanTermYears,
    1 // Yearly intervals
  );
  
  // Calculate total annual expenses
  const totalAnnualExpenses = Object.values(annualExpenses).reduce((sum, expense) => sum + expense, 0);
  
  // Track cumulative values
  let cumulativeCashFlow = 0;
  let cumulativeRent = 0;
  let cumulativeExpenses = 0;
  let cumulativeLoanRepayments = 0;
  
  for (let year = 0; year <= projectionYears; year++) {
    // Calculate property value with capital growth
    const propertyValue = purchasePrice * Math.pow(1 + capitalGrowthRate / 100, year);
    
    // Calculate rental income with growth
    const rentThisYear = annualRent * Math.pow(1 + rentalGrowthRate / 100, year);
    
    // Calculate expenses with inflation (assume 2.5% inflation for expenses)
    const expensesThisYear = totalAnnualExpenses * Math.pow(1.025, year);
    
    // Get loan details for this year
    const loanYear = amortization.find(entry => entry.year === year) || amortization[amortization.length - 1];
    const remainingLoanBalance = year < loanDetails.loanTermYears ? loanYear.remainingBalance : 0;
    const equity = propertyValue - remainingLoanBalance;
    
    // Calculate annual loan repayment (0 after loan is paid off)
    const loanRepaymentThisYear = year < loanDetails.loanTermYears ? loanDetails.annualRepayment : 0;
    
    // Calculate cash flow for this year
    const cashFlowThisYear = rentThisYear - loanRepaymentThisYear - expensesThisYear;
    
    // Update cumulative values
    if (year > 0) {
      cumulativeCashFlow += cashFlowThisYear;
      cumulativeRent += rentThisYear;
      cumulativeExpenses += expensesThisYear;
      cumulativeLoanRepayments += loanRepaymentThisYear;
    }
    
    projection.push({
      year,
      propertyValue: Math.round(propertyValue),
      equity: Math.round(equity),
      equityPercentage: Math.round((equity / propertyValue) * 100 * 10) / 10,
      remainingLoan: Math.round(remainingLoanBalance),
      annualRent: Math.round(rentThisYear),
      annualExpenses: Math.round(expensesThisYear),
      annualLoanRepayment: Math.round(loanRepaymentThisYear),
      annualCashFlow: Math.round(cashFlowThisYear),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      cumulativeRent: Math.round(cumulativeRent),
      cumulativeExpenses: Math.round(cumulativeExpenses),
      cumulativeLoanRepayments: Math.round(cumulativeLoanRepayments),
      netWorth: Math.round(equity + cumulativeCashFlow),
    });
  }
  
  return projection;
}

/**
 * Calculate key investment metrics from projection data
 * @param {array} projection - Projection data from calculate30YearProjection
 * @param {number} initialInvestment - Initial cash invested (deposit + stamp duty + costs)
 * @returns {object} Investment metrics
 */
export function calculateInvestmentMetrics(projection, initialInvestment) {
  if (!projection || projection.length === 0) {
    throw new Error('Projection data is required');
  }
  
  const finalYear = projection[projection.length - 1];
  const year10 = projection[10] || finalYear;
  const year20 = projection[20] || finalYear;
  
  // Calculate total return
  const totalReturn = finalYear.netWorth - initialInvestment;
  const returnOnInvestment = (totalReturn / initialInvestment) * 100;
  
  // Calculate average annual return (CAGR - Compound Annual Growth Rate)
  const years = projection.length - 1;
  const cagr = (Math.pow(finalYear.netWorth / initialInvestment, 1 / years) - 1) * 100;
  
  return {
    initialInvestment: Math.round(initialInvestment),
    finalNetWorth: finalYear.netWorth,
    totalReturn: Math.round(totalReturn),
    returnOnInvestment: Math.round(returnOnInvestment * 10) / 10,
    averageAnnualReturn: Math.round(cagr * 10) / 10,
    milestones: {
      year10: {
        netWorth: year10.netWorth,
        equity: year10.equity,
        propertyValue: year10.propertyValue,
        cumulativeCashFlow: year10.cumulativeCashFlow,
      },
      year20: {
        netWorth: year20.netWorth,
        equity: year20.equity,
        propertyValue: year20.propertyValue,
        cumulativeCashFlow: year20.cumulativeCashFlow,
      },
      year30: {
        netWorth: finalYear.netWorth,
        equity: finalYear.equity,
        propertyValue: finalYear.propertyValue,
        cumulativeCashFlow: finalYear.cumulativeCashFlow,
      },
    },
    totalRentReceived: finalYear.cumulativeRent,
    totalExpensesPaid: finalYear.cumulativeExpenses,
    totalLoanRepayments: finalYear.cumulativeLoanRepayments,
  };
}
