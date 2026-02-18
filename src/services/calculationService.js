/**
 * Property Investment Calculator Service
 * 
 * Central service that coordinates all calculation modules to perform
 * complete property investment analysis client-side.
 */

import { calculateStampDuty } from '../calculators/stampDuty.js';
import { calculateLoanRepayments, calculateLVR } from '../calculators/loanCalculator.js';
import { calculateCashFlow, calculateRentalYield, calculateNetRentalYield } from '../calculators/cashFlowCalculator.js';
import { calculate30YearProjection, calculateInvestmentMetrics } from '../calculators/projectionCalculator.js';
import { calculateYearByYear } from '../calculators/yearByYearCalculator.js';

/**
 * Perform complete property investment calculation
 * @param {object} propertyData - All property and investment parameters
 * @returns {object} Complete calculation results
 */
export function calculatePropertyInvestment(propertyData) {
  try {
    const {
      // Property Details
      purchasePrice,
      state,
      isFirstHomeBuyer = false,
      additionalUpfrontCosts = 0,
      
      // Loan Details
      depositAmount,
      interestRate,
      loanTerm,
      
      // Rental Details
      weeklyRent,
      
      // Annual Expenses
      propertyManagementFee = 0, // Annual fee or percentage
      councilRates = 0,
      waterRates = 0,
      insurance = 0,
      maintenanceCosts = 0,
      
      // Growth Assumptions
      capitalGrowthRate = 5, // % per year
      rentalGrowthRate = 3,   // % per year
    } = propertyData;

    // Validate required fields
    if (!purchasePrice || !state || !depositAmount || !interestRate || !loanTerm || !weeklyRent) {
      throw new Error('Missing required fields');
    }

    // Calculate stamp duty
    const stampDuty = calculateStampDuty(purchasePrice, state, isFirstHomeBuyer);

    // Calculate loan details
    const loanAmount = purchasePrice - depositAmount;
    const loanDetails = calculateLoanRepayments(loanAmount, interestRate, loanTerm);
    const lvrDetails = calculateLVR(loanAmount, purchasePrice);

    // Calculate upfront costs
    const totalUpfrontCosts = depositAmount + stampDuty.total + additionalUpfrontCosts;

    // Calculate annual values
    const annualRent = weeklyRent * 52;
    const annualExpenses = {
      propertyManagement: propertyManagementFee,
      councilRates,
      waterRates,
      insurance,
      maintenance: maintenanceCosts,
    };

    // Calculate cash flow
    const cashFlow = calculateCashFlow(annualRent, loanDetails.annualRepayment, annualExpenses);

    // Calculate rental yields
    const grossYield = calculateRentalYield(annualRent, purchasePrice);
    const netYield = calculateNetRentalYield(annualRent, purchasePrice, annualExpenses);

    // Calculate 30-year projection
    const projection = calculate30YearProjection({
      purchasePrice,
      annualRent,
      loanDetails: {
        loanAmount,
        annualInterestRate: interestRate,
        loanTermYears: loanTerm,
        annualRepayment: loanDetails.annualRepayment,
      },
      annualExpenses,
      capitalGrowthRate,
      rentalGrowthRate,
    });

    // Calculate investment metrics
    const investmentMetrics = calculateInvestmentMetrics(projection, totalUpfrontCosts);

    // Calculate year-by-year breakdown
    const yearByYear = calculateYearByYear({
      purchasePrice,
      loanAmount,
      interestRate,
      loanTerm,
      initialMonthlyRent: weeklyRent * 52 / 12,
      monthlyExpenses: Object.values(annualExpenses).reduce((sum, val) => sum + val, 0) / 12,
      capitalGrowthRate,
      rentalGrowthRate,
    });

    // Return comprehensive results
    return {
      success: true,
      data: {
        // Summary
        summary: {
          purchasePrice,
          depositAmount,
          loanAmount,
          totalUpfrontCosts,
          stampDuty: stampDuty.total,
          additionalCosts: additionalUpfrontCosts,
        },

        // Stamp Duty
        stampDuty,

        // Loan Details
        loanDetails: {
          ...loanDetails,
          ...lvrDetails,
        },

        // Cash Flow
        cashFlow,

        // Rental Yields
        yields: {
          gross: grossYield,
          net: netYield,
        },

        // Investment Metrics
        investmentMetrics,

        // 30-Year Projection
        projection,

        // Year-by-Year Details
        yearByYear,

        // Input Parameters
        inputs: propertyData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate only stamp duty (quick calculation)
 * @param {number} purchasePrice - Property price
 * @param {string} state - Australian state
 * @param {boolean} isFirstHomeBuyer - First home buyer status
 * @returns {object} Stamp duty calculation
 */
export function calculateStampDutyOnly(purchasePrice, state, isFirstHomeBuyer = false) {
  try {
    const result = calculateStampDuty(purchasePrice, state, isFirstHomeBuyer);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate monthly loan repayment (quick calculation)
 * @param {number} loanAmount - Loan amount
 * @param {number} interestRate - Annual interest rate
 * @param {number} loanTerm - Loan term in years
 * @returns {object} Loan repayment calculation
 */
export function calculateLoanRepaymentsOnly(loanAmount, interestRate, loanTerm) {
  try {
    const result = calculateLoanRepayments(loanAmount, interestRate, loanTerm);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
