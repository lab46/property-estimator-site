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
      weeksRented = 52,
      
      // Monthly Expenses (from form)
      councilRatesMonthly = 0,
      waterRatesMonthly = 0,
      insuranceMonthly = 0,
      maintenanceMonthly = 0,
      emergencyServicesLevyMonthly = 0,
      landTaxMonthly = 0,
      wealthFeeMonthly = 0,
      strataMonthly = 0,
      propertyManagementFee = 0, // as percentage
      
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
    const annualRent = weeklyRent * weeksRented;
    
    // Calculate property management fee as percentage of annual rent
    const propertyManagementAnnual = (annualRent * propertyManagementFee) / 100;
    
    // Convert monthly expenses to annual
    const annualExpenses = {
      propertyManagement: propertyManagementAnnual,
      councilRates: councilRatesMonthly * 12,
      waterRates: waterRatesMonthly * 12,
      insurance: insuranceMonthly * 12,
      maintenance: maintenanceMonthly * 12,
      emergencyServicesLevy: emergencyServicesLevyMonthly * 12,
      landTax: landTaxMonthly * 12,
      wealthFee: wealthFeeMonthly * 12,
      strata: strataMonthly * 12,
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
    const propertyManagementMonthly = propertyManagementAnnual / 12;
    const totalMonthlyExpenses = propertyManagementMonthly + councilRatesMonthly + waterRatesMonthly + insuranceMonthly + 
                                  maintenanceMonthly + emergencyServicesLevyMonthly + 
                                  landTaxMonthly + wealthFeeMonthly + strataMonthly;
    
    // Calculate monthly rent from weekly rent and weeks rented
    const monthlyRent = (weeklyRent * weeksRented) / 12;
    
    const yearByYear = calculateYearByYear({
      purchasePrice,
      loanAmount,
      interestRate,
      loanTerm,
      initialMonthlyRent: monthlyRent,
      monthlyExpenses: totalMonthlyExpenses,
      capitalGrowthRate,
      rentalGrowthRate,
    });

    // Return comprehensive results
    return {
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
    };
  } catch (error) {
    console.error('Calculation error:', error);
    throw error;
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
  return calculateStampDuty(purchasePrice, state, isFirstHomeBuyer);
}

/**
 * Calculate monthly loan repayment (quick calculation)
 * @param {number} loanAmount - Loan amount
 * @param {number} interestRate - Annual interest rate
 * @param {number} loanTerm - Loan term in years
 * @returns {object} Loan repayment calculation
 */
export function calculateLoanRepaymentsOnly(loanAmount, interestRate, loanTerm) {
  return calculateLoanRepayments(loanAmount, interestRate, loanTerm);
}
