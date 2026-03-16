import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import YearByYearAnalysis from './YearByYearAnalysis';

// Tooltip component
function InfoTooltip({ content }) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      {isVisible && (
        <div className="absolute z-50 w-64 p-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6 transform">
          <div className="whitespace-normal">{content}</div>
          <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}

function ResultsDisplay({ results, onReset, onEdit, inputData }) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [cashFlowPeriod, setCashFlowPeriod] = useState('annual'); // 'weekly', 'fortnightly', 'monthly', 'annual'

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate cash flow based on selected period
  const getCashFlowForPeriod = () => {
    const annual = results.cashFlow.cashFlow.annual;
    switch (cashFlowPeriod) {
      case 'weekly':
        return { value: annual / 52, label: 'Weekly' };
      case 'fortnightly':
        return { value: annual / 26, label: 'Fortnightly' };
      case 'monthly':
        return { value: annual / 12, label: 'Monthly' };
      case 'annual':
      default:
        return { value: annual, label: 'Annual' };
    }
  };

  // Calculate total cash flow loss/gain over loan period
  const calculateTotalCashFlowImpact = () => {
    if (!results.projection) return null;
    
    const loanTerm = results.loanDetails.loanTermYears;
    const lastYear = results.projection[loanTerm];
    
    if (!lastYear) return null;
    
    return {
      totalCashFlow: lastYear.cumulativeCashFlow,
      isNegative: lastYear.cumulativeCashFlow < 0,
      loanTerm
    };
  };

  // Calculate net profit including capital growth
  const calculateNetProfit = () => {
    if (!results.projection) return null;
    
    const loanTerm = results.loanDetails.loanTermYears;
    const lastYear = results.projection[loanTerm];
    
    if (!lastYear) return null;
    
    const initialInvestment = results.summary.depositAmount + 
                             (results.stampDuty?.total || 0) + 
                             results.summary.additionalCosts;
    
    const finalPropertyValue = lastYear.propertyValue;
    const cumulativeCashFlow = lastYear.cumulativeCashFlow;
    
    // Total capital deployed = Initial Investment + out-of-pocket costs (negative cash flow)
    // If cashflow is negative (e.g., -$352,041), you paid out $352,041
    const totalCapitalDeployed = initialInvestment + Math.abs(Math.min(0, cumulativeCashFlow));
    
    // Net profit = Property Value - Total Capital Deployed
    // = Property Value - (Initial Investment + |Negative Cashflow|)
    const netPosition = finalPropertyValue - totalCapitalDeployed;
    
    // ROI based on total capital deployed
    const roi = (netPosition / totalCapitalDeployed) * 100;
    
    return {
      initialInvestment,
      finalPropertyValue,
      remainingLoan: lastYear.remainingLoan || 0,
      cumulativeCashFlow,
      netPosition,
      totalCapitalDeployed,
      roi,
      loanTerm
    };
  };

  const cashFlowImpact = calculateTotalCashFlowImpact();
  const netProfit = calculateNetProfit();

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    
    try {
      // Save only the input data, not calculated results
      // Include propertyId if this is an existing property being updated
      const propertyData = {
        name: inputData?.propertyAddress || `Property - ${new Date().toLocaleDateString()}`,
        ...inputData,
        // Explicitly preserve propertyId if it exists (for updates)
        ...(inputData?.propertyId && { propertyId: inputData.propertyId }),
      };
      
      console.log('Attempting to save property:', propertyData);
      console.log('PropertyId present:', !!propertyData.propertyId, propertyData.propertyId);
      await api.saveProperty(propertyData);
      console.log('Property saved successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save property error:', err);
      setSaveError(err.message || 'Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  // Prepare chart data - sample every 5 years for clarity
  const projectionChartData = results.projection
    ?.filter((item, index) => index % 5 === 0 || index === results.projection.length - 1)
    .map(item => ({
      year: item.year,
      'Property Value': item.propertyValue,
      'Equity': item.equity,
      'Remaining Loan': item.remainingLoan,
    }));

  const cashFlowChartData = results.projection
    ?.filter((item, index) => index % 5 === 0 || index === results.projection.length - 1)
    .map(item => ({
      year: item.year,
      'Annual Cash Flow': item.annualCashFlow,
      'Cumulative Cash Flow': item.cumulativeCashFlow,
    }));

  return (
    <div className="space-y-6">
      {/* Property Address Header */}
      {inputData?.propertyAddress && (
        <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            <div>
              <h1 className="text-2xl font-bold">{inputData.propertyAddress}</h1>
              <p className="text-indigo-100 text-sm">{inputData.state || ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-3">
          <button onClick={onReset} className="btn-secondary">
            ← Calculate Another Property
          </button>
          <button onClick={onEdit} className="btn-secondary">
            ✏️ Edit This Property
          </button>
        </div>
        <div className="flex gap-3">
          {saveSuccess && (
            <span className="text-green-600 font-medium flex items-center">
              ✓ Saved Successfully
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Property'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="card bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      {/* Executive Summary Section */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">📊</span>
          <h2 className="text-2xl font-bold text-gray-900">Investment Summary</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Purchase Price */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
              Purchase Price
              <InfoTooltip content="The property's purchase price as entered in your calculation." />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(results.summary.purchasePrice)}
            </div>
          </div>

          {/* Loan Amount */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
              Loan Amount
              <InfoTooltip content={`Loan Amount = Purchase Price - Deposit. Your loan is ${formatPercent(results.loanDetails.lvr)} of the property value (LVR = Loan to Value Ratio).`} />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(results.summary.loanAmount)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              LVR: {formatPercent(results.loanDetails.lvr)}
            </div>
          </div>

          {/* Monthly Repayment */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
              Monthly Repayment
              <InfoTooltip content={`Your monthly loan repayment calculated using the standard mortgage formula: P × [r(1+r)^n]/[(1+r)^n-1], where P = loan amount, r = monthly interest rate, n = number of months. This is a ${results.loanDetails.loanType || 'principal and interest'} loan.`} />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(results.loanDetails.monthlyRepayment)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {formatCurrency(results.loanDetails.monthlyRepayment / 4.33)}/week
            </div>
          </div>

          {/* Monthly Cashflow */}
          {results.cashFlow && (
            <div className={`bg-white rounded-lg p-4 shadow-sm ${results.cashFlow.isPositive ? 'ring-2 ring-green-300' : 'ring-2 ring-red-300'}`}>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                Monthly Cash Flow
                <InfoTooltip content={`Monthly cash flow = Monthly Rental Income - Monthly Holding Costs. ${results.cashFlow.isPositive ? 'Positive means the property generates more income than expenses.' : 'Negative means you need to pay out of pocket each year to cover the shortfall.'}`} />
              </div>
              <div className={`text-2xl font-bold ${results.cashFlow.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(results.cashFlow.cashFlow.annual / 12)}/month
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {results.cashFlow.isPositive ? '✅ Income generated' : '⚠️ Out-of-pocket'}/month
              </div>
            </div>
          )}

          {/* Total Interest */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
              Total Interest ({results.loanDetails.loanTermYears}y)
              <InfoTooltip content={`Total interest you'll pay over ${results.loanDetails.loanTermYears} years at ${formatPercent(results.loanDetails.annualInterestRate)} interest rate. Calculated as: (Monthly Payment × 12 × ${results.loanDetails.loanTermYears}) - Loan Amount.`} />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(results.loanDetails.totalInterest)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Over {results.loanDetails.loanTermYears} years
            </div>
          </div>

          {/* Property Value at End */}
          {netProfit && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                Est. Value (Year {netProfit.loanTerm})
                <InfoTooltip content={`Estimated property value after ${netProfit.loanTerm} years, calculated as: ${formatCurrency(results.summary.purchasePrice)} × (1 + ${inputData?.capitalGrowthRate || 5}%)^${netProfit.loanTerm}. Based on your capital growth assumption of ${inputData?.capitalGrowthRate || 5}% per year.`} />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(netProfit.finalPropertyValue)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Capital Growth Applied
              </div>
            </div>
          )}

          {/* Total Rental Income */}
          {results.projection && (() => {
            const loanTerm = results.loanDetails.loanTermYears;
            const totalRentalIncome = results.projection
              .slice(0, loanTerm + 1)
              .reduce((sum, year) => sum + (year.annualRent || 0), 0);
            
            return (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                  Total Rental Income
                  <InfoTooltip content={`Total rental income collected over ${loanTerm} years. Starting rent: ${formatCurrency(inputData?.weeklyRent ? inputData.weeklyRent * 52 : 0)}/year, growing at ${inputData?.rentalGrowthRate || 3}% per year. Each year's rent is calculated as: Previous Year Rent × (1 + ${inputData?.rentalGrowthRate || 3}%).`} />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRentalIncome)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Over {loanTerm} years
                </div>
              </div>
            );
          })()}

          {/* Total Holding Costs */}
          {results.projection && (() => {
            const loanTerm = results.loanDetails.loanTermYears;
            const totalLoanRepayments = results.loanDetails.monthlyRepayment * 12 * loanTerm;
            
            // Calculate total expenses over loan term
            const annualExpenses = 
              results.cashFlow.costs.breakdown.propertyManagement +
              results.cashFlow.costs.breakdown.councilRates +
              results.cashFlow.costs.breakdown.waterRates +
              results.cashFlow.costs.breakdown.insurance +
              results.cashFlow.costs.breakdown.maintenance +
              (results.cashFlow.costs.breakdown.emergencyServicesLevy || 0) +
              (results.cashFlow.costs.breakdown.landTax || 0) +
              (results.cashFlow.costs.breakdown.wealthFee || 0) +
              (results.cashFlow.costs.breakdown.strata || 0);
            
            // Project expenses with holding cost growth rate
            let totalExpenses = 0;
            const expenseGrowthRate = inputData?.holdingCostGrowthRate || inputData?.rentalGrowthRate || 3;
            for (let year = 1; year <= loanTerm; year++) {
              totalExpenses += annualExpenses * Math.pow(1 + expenseGrowthRate / 100, year - 1);
            }
            
            const totalHoldingCosts = totalLoanRepayments + totalExpenses;
            
            return (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                  Total Holding Costs
                  <InfoTooltip content={`Total cost to hold the property over ${loanTerm} years. Includes: Loan Repayments (${formatCurrency(totalLoanRepayments)}) + All Expenses growing at ${expenseGrowthRate}% per year (holding cost growth rate). This is what you'll pay out over the investment period.`} />
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalHoldingCosts)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Total Repayments + Expenses ({loanTerm}y, with {expenseGrowthRate}% holding cost growth)
                </div>
              </div>
            );
          })()}

          {/* Cumulative Cash Flow */}
          {cashFlowImpact && (
            <div className={`bg-white rounded-lg p-4 shadow-sm ${cashFlowImpact.isNegative ? 'ring-2 ring-red-300' : 'ring-2 ring-green-300'}`}>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                Cash Flow ({cashFlowImpact.loanTerm}y)
                <InfoTooltip content={`Cumulative cash flow over ${cashFlowImpact.loanTerm} years = Total Rental Income - Total Holding Costs. ${cashFlowImpact.isNegative ? 'Negative means you need to pay out of pocket each year to cover the shortfall.' : 'Positive means the property generates more income than expenses.'}`} />
              </div>
              <div className={`text-2xl font-bold ${cashFlowImpact.isNegative ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(cashFlowImpact.totalCashFlow)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {cashFlowImpact.isNegative ? '⚠️ Out-of-pocket' : '✅ Income generated'} over {cashFlowImpact.loanTerm} years
              </div>
            </div>
          )}

          {/* Net Profit/Loss */}
          {netProfit && (
            <div className={`bg-white rounded-lg p-4 shadow-sm ring-2 ${netProfit.netPosition >= 0 ? 'ring-green-400' : 'ring-red-400'}`}>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                Estimated Net Profit/Loss (Year {netProfit.loanTerm})
                <InfoTooltip content={`Your net profit = Property Value (${formatCurrency(netProfit.finalPropertyValue)}) - Total Capital Deployed (${formatCurrency(netProfit.totalCapitalDeployed)}). Total Capital = Initial Investment + Out-of-Pocket Costs from negative cashflow. ROI of ${netProfit.roi.toFixed(1)}% is calculated on total capital deployed.`} />
              </div>
              <div className={`text-2xl font-bold ${netProfit.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit.netPosition)}
              </div>
              <div className="text-xs font-semibold mt-1">
                ROI: <span className={netProfit.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {netProfit.roi.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                = Property Value - Total Capital Deployed
              </div>
            </div>
          )}
        </div>

        {/* Quick Insights */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">💵</span>
              <div>
                <div className="font-semibold text-gray-900 flex items-center">
                  Initial Investment
                  <InfoTooltip content="Total upfront capital required = Deposit + Stamp Duty + Additional Costs (LMI, legal fees, etc.)" />
                </div>
                <div className="text-gray-700">
                  {formatCurrency(results.summary.depositAmount + (results.stampDuty?.total || 0) + results.summary.additionalCosts)}
                </div>
                <div className="text-xs text-gray-500">Deposit + Stamp Duty + Costs</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">📈</span>
              <div>
                <div className="font-semibold text-gray-900 flex items-center">
                  Growth Assumptions
                  <InfoTooltip content="Annual growth rates used in projections. Capital growth affects property value, rental growth affects income, and holding cost growth affects expenses over time." />
                </div>
                <div className="text-gray-700">
                  Capital: {inputData?.capitalGrowthRate || 5}%/yr • Rental: {inputData?.rentalGrowthRate || 3}%/yr • Holding Costs: {inputData?.holdingCostGrowthRate || 3}%/yr
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">{results.cashFlow.isPositive ? '✅' : '⚠️'}</span>
              <div>
                <div className="font-semibold text-gray-900 flex items-center">
                  Cash Flow Status
                  <InfoTooltip content={`Year 1 cash flow = Rental Income - (Loan Repayments + All Expenses). ${results.cashFlow.isPositive ? 'Positive means the property pays for itself.' : 'Negative means you need to cover the shortfall from your own funds.'}`} />
                </div>
                <div className={`font-medium ${results.cashFlow.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {results.cashFlow.isPositive ? 'Positive' : 'Negative'} [{formatCurrency(results.cashFlow.cashFlow.annual)}/year]
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-primary-50">
          <div className="text-sm text-gray-600 mb-1">Purchase Price</div>
          <div className="text-2xl font-bold text-primary-600">
            {formatCurrency(results.summary.purchasePrice)}
          </div>
        </div>

        <div className="card bg-green-50">
          <div className="text-sm text-gray-600 mb-1">Stamp Duty (approx.)</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(results.stampDuty?.total || 0)}
          </div>
          {results.stampDuty?.concessionApplied && (
            <div className="text-xs text-green-600 mt-1">
              {results.stampDuty.concessionType} - Saved {formatCurrency(results.stampDuty.savingsAmount)}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">⚠️ Estimate only - verify with state revenue office</div>
        </div>

        <div className="card bg-blue-50">
          <div className="text-sm text-gray-600 mb-1">Monthly Repayment</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(results.loanDetails.monthlyRepayment)}
          </div>
        </div>

        <div className={`card ${results.cashFlow.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-sm text-gray-600 mb-1">Annual Cash Flow</div>
          <div className={`text-2xl font-bold ${results.cashFlow.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(results.cashFlow.cashFlow.annual)}
          </div>
        </div>
      </div>

      {/* Upfront Costs */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          Upfront Costs
          <InfoTooltip content="All costs you need to pay upfront when purchasing the property, including stamp duty and other transaction costs. Your deposit reduces what you need to pay from cash on hand." />
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              Purchase Price
              <InfoTooltip content="The agreed sale price of the property." />
            </span>
            <span className="font-semibold">{formatCurrency(results.summary.purchasePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              Stamp Duty (approx.)
              <InfoTooltip content={`Approximate government tax on property transfer. ${results.stampDuty?.concessionApplied ? `You received a ${results.stampDuty.concessionType} saving ${formatCurrency(results.stampDuty.savingsAmount)}.` : ''} ⚠️ This is an estimate only - actual stamp duty may vary. Verify with your state revenue office.`} />
            </span>
            <span className="font-semibold">{formatCurrency(results.stampDuty?.total || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              Additional Costs
              <InfoTooltip content="Other upfront costs including legal fees, building inspection, conveyancing, and any Lenders Mortgage Insurance (LMI) if LVR > 80%." />
            </span>
            <span className="font-semibold">{formatCurrency(results.summary.additionalCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center">
              Your Deposit
              <InfoTooltip content="Your cash deposit paid upfront, reducing the loan amount needed." />
            </span>
            <span className="font-semibold text-red-600">-{formatCurrency(results.summary.depositAmount)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold flex items-center">
              Total Upfront (excl. deposit)
              <InfoTooltip content="Total cash needed at settlement = Purchase Price + Stamp Duty + Additional Costs - Deposit. This is what you pay from your own funds (excluding the loan)." />
            </span>
            <span className="font-bold">{formatCurrency(results.summary.stampDuty + results.summary.additionalCosts)}</span>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          Loan Details
          <InfoTooltip content="Summary of your loan structure including amount borrowed, interest rate, repayment details, and total interest cost over the loan term." />
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                Loan Amount
                <InfoTooltip content="Total amount borrowed from the bank = Purchase Price - Deposit" />
              </span>
              <span className="font-semibold">{formatCurrency(results.summary.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                Interest Rate
                <InfoTooltip content="Annual interest rate on your loan. This is used to calculate your monthly repayments." />
              </span>
              <span className="font-semibold">{formatPercent(results.loanDetails.annualInterestRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                Loan Term
                <InfoTooltip content="Number of years you'll take to repay the loan if you make minimum repayments." />
              </span>
              <span className="font-semibold">{results.loanDetails.loanTermYears} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                LVR
                <InfoTooltip content="Loan to Value Ratio = (Loan Amount / Property Value) × 100. Banks typically require LMI if LVR > 80%." />
              </span>
              <span className="font-semibold">{formatPercent(results.loanDetails.lvr)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                Monthly Repayment
                <InfoTooltip content="Your fixed monthly loan repayment calculated using standard mortgage formula. This stays constant if interest rate doesn't change." />
              </span>
              <span className="font-semibold">{formatCurrency(results.loanDetails.monthlyRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                Total Repayment
                <InfoTooltip content={`Total you'll pay back to the bank = Monthly Repayment × 12 × ${results.loanDetails.loanTermYears} years = ${formatCurrency(results.loanDetails.totalRepayment)}`} />
              </span>
              <span className="font-semibold">{formatCurrency(results.loanDetails.totalRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 flex items-center">
                Total Interest
                <InfoTooltip content="Total interest cost = Total Repayment - Loan Amount. This is the cost of borrowing money." />
              </span>
              <span className="font-semibold text-red-600">{formatCurrency(results.loanDetails.totalInterest)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Breakdown */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            Cash Flow Analysis
            <InfoTooltip content="Year 1 cash flow breakdown showing rental income minus all expenses and loan repayments. Select different periods to view weekly, fortnightly, monthly, or annual figures." />
          </h2>
          <select 
            value={cashFlowPeriod} 
            onChange={(e) => setCashFlowPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-green-600">
            <span>Rental Income</span>
            <span className="font-semibold">
              +{formatCurrency(results.cashFlow.income.annual / (cashFlowPeriod === 'weekly' ? 52 : cashFlowPeriod === 'fortnightly' ? 26 : cashFlowPeriod === 'monthly' ? 12 : 1))}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Adjusted according to the number of weeks rented per year
          </div>
          <div className="border-t pt-3 space-y-2 text-red-600">
            <div className="flex justify-between">
              <span>Loan Repayments</span>
              <span className="font-semibold">
                -{formatCurrency(results.cashFlow.costs.loanRepayment / (cashFlowPeriod === 'weekly' ? 52 : cashFlowPeriod === 'fortnightly' ? 26 : cashFlowPeriod === 'monthly' ? 12 : 1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Property Management</span>
              <span>
                -{formatCurrency(results.cashFlow.costs.breakdown.propertyManagement / (cashFlowPeriod === 'weekly' ? 52 : cashFlowPeriod === 'fortnightly' ? 26 : cashFlowPeriod === 'monthly' ? 12 : 1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Council Rates</span>
              <span>
                -{formatCurrency(results.cashFlow.costs.breakdown.councilRates / (cashFlowPeriod === 'weekly' ? 52 : cashFlowPeriod === 'fortnightly' ? 26 : cashFlowPeriod === 'monthly' ? 12 : 1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Water Rates</span>
              <span>
                -{formatCurrency(results.cashFlow.costs.breakdown.waterRates / (cashFlowPeriod === 'weekly' ? 52 : cashFlowPeriod === 'fortnightly' ? 26 : cashFlowPeriod === 'monthly' ? 12 : 1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Insurance</span>
              <span>
                -{formatCurrency(results.cashFlow.costs.breakdown.insurance / (cashFlowPeriod === 'weekly' ? 52 : cashFlowPeriod === 'fortnightly' ? 26 : cashFlowPeriod === 'monthly' ? 12 : 1))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Maintenance</span>
              <span>
                -{formatCurrency(results.cashFlow.costs.breakdown.maintenance / (cashFlowPeriod === 'weekly' ? 52 : cashFlowPeriod === 'fortnightly' ? 26 : cashFlowPeriod === 'monthly' ? 12 : 1))}
              </span>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold">Net Cash Flow ({getCashFlowForPeriod().label})</span>
            <span className={`font-bold ${results.cashFlow.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(getCashFlowForPeriod().value)}
            </span>
          </div>
        </div>
      </div>

      {/* Total Cash Flow Impact Over Loan Period */}
      {cashFlowImpact && (
        <div className={`card ${cashFlowImpact.isNegative ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            {cashFlowImpact.isNegative ? '⚠️' : '✅'} 
            Cash Flow Impact Over {cashFlowImpact.loanTerm} Years
            <InfoTooltip content={`Total cumulative cash flow over ${cashFlowImpact.loanTerm} years = Sum of (Rental Income - All Expenses - Loan Repayments) for each year. ${cashFlowImpact.isNegative ? 'Negative means you need to fund the shortfall from your own savings.' : 'Positive means the property generates surplus income.'}`} />
          </h2>
          <div className="space-y-4">
            {cashFlowImpact.isNegative ? (
              <div className="bg-white rounded-lg p-4 border border-red-300">
                <p className="text-red-800 mb-3">
                  This property is <span className="font-bold">cashflow negative</span>. Over the {cashFlowImpact.loanTerm}-year loan period, 
                  you will need to contribute from your own funds to cover the shortfall.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Out-of-Pocket Cost</div>
                    <div className="text-3xl font-bold text-red-600">
                      {formatCurrency(Math.abs(cashFlowImpact.totalCashFlow))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Average Annual Cost</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(Math.abs(cashFlowImpact.totalCashFlow) / cashFlowImpact.loanTerm)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      (~{formatCurrency(Math.abs(cashFlowImpact.totalCashFlow) / cashFlowImpact.loanTerm / 12)}/month)
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <p className="text-green-800 mb-3">
                  This property is <span className="font-bold">cashflow positive</span>. Over the {cashFlowImpact.loanTerm}-year loan period, 
                  you will generate positive cash flow.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Cash Generated</div>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(cashFlowImpact.totalCashFlow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Average Annual Income</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(cashFlowImpact.totalCashFlow / cashFlowImpact.loanTerm)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      (~{formatCurrency(cashFlowImpact.totalCashFlow / cashFlowImpact.loanTerm / 12)}/month)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Net Profit Projection */}
      {netProfit && (
        <div className="card bg-blue-50 border-2 border-blue-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            💰 Net Investment Return ({netProfit.loanTerm} Years)
          </h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Considering capital growth, rental income, and all costs (including loan repayments and expenses), 
              here's your projected net position at the end of year {netProfit.loanTerm}:
            </p>
            
            <div className="bg-white rounded-lg p-4 border border-blue-300">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Initial Investment</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {formatCurrency(netProfit.initialInvestment)}
                  </div>
                  <div className="text-xs text-gray-500">Deposit + Stamp Duty + Costs</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Capital Deployed</div>
                  <div className="text-lg font-semibold text-orange-600">
                    {formatCurrency(netProfit.totalCapitalDeployed)}
                  </div>
                  <div className="text-xs text-gray-500">Initial + Out-of-Pocket Costs</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Final Property Value</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(netProfit.finalPropertyValue)}
                  </div>
                  <div className="text-xs text-gray-500">After {netProfit.loanTerm} years growth</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Cumulative Cash Flow</div>
                  <div className={`text-lg font-semibold ${netProfit.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit.cumulativeCashFlow)}
                  </div>
                  <div className="text-xs text-gray-500">Rental Income - All Costs</div>
                </div>
              </div>
              
              <div className="border-t-2 border-blue-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-gray-800">Net Profit/Loss</span>
                  <span className={`text-3xl font-bold ${netProfit.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit.netPosition)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Return on Investment (ROI)</span>
                  <span className={`text-xl font-bold ${netProfit.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netProfit.roi.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  ROI calculated on total capital deployed ({formatCurrency(netProfit.totalCapitalDeployed)})
                </div>
              </div>
            </div>

            <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-900">
              <div className="mb-2"><strong>Net Profit Calculation:</strong></div>
              <div className="font-mono text-xs">
                = Property Value ({formatCurrency(netProfit.finalPropertyValue)})<br/>
                - Total Capital Deployed ({formatCurrency(netProfit.totalCapitalDeployed)})<br/>
                = <strong>{formatCurrency(netProfit.netPosition)}</strong>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <strong>Total Capital Deployed breakdown:</strong><br/>
                • Initial Investment: {formatCurrency(netProfit.initialInvestment)}<br/>
                {netProfit.cumulativeCashFlow < 0 && (
                  <>
                    • Out-of-Pocket Costs: {formatCurrency(Math.abs(netProfit.cumulativeCashFlow))}<br/>
                    <span className="text-xs">(This is the negative cashflow you had to cover over {netProfit.loanTerm} years)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interest Rate Stress Tests */}
      {results.stressTests && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            Interest Rate Stress Tests
            <InfoTooltip content="Shows how your monthly repayment and cash flow would change if interest rates increase. Use this to assess your ability to handle rate rises." />
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Rate Increase</th>
                  <th className="text-left py-3 px-4">New Rate</th>
                  <th className="text-left py-3 px-4">Monthly Repayment</th>
                  <th className="text-left py-3 px-4">Annual Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-gray-50">
                  <td className="py-3 px-4 font-medium">Current</td>
                  <td className="py-3 px-4">{formatPercent(results.loanDetails.annualInterestRate)}</td>
                  <td className="py-3 px-4">{formatCurrency(results.loanDetails.monthlyRepayment)}</td>
                  <td className="py-3 px-4">{formatCurrency(results.cashFlow.cashFlow.annual)}</td>
                </tr>
                {results.stressTests.map((test, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">+{formatPercent(test.rateIncrease)}</td>
                    <td className="py-3 px-4">{formatPercent(test.newRate)}</td>
                    <td className="py-3 px-4 text-red-600">{formatCurrency(test.monthlyRepayment)}</td>
                    <td className={`py-3 px-4 ${test.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(test.annualCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property Value & Equity Chart */}
      {projectionChartData && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            30-Year Property Value & Equity
            <InfoTooltip content={`Visual projection showing: Property Value (growing at ${inputData?.capitalGrowthRate || 5}%/year), Equity (Property Value - Loan), and Remaining Loan (decreasing as you pay it off). The gap between property value and loan balance is your equity.`} />
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="Property Value" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Equity" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Remaining Loan" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cash Flow Chart */}
      {cashFlowChartData && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            Cash Flow Over Time
            <InfoTooltip content="Annual Cash Flow (income minus expenses each year) and Cumulative Cash Flow (running total). Negative cumulative shows total out-of-pocket costs; positive shows total profit from operations." />
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Annual Cash Flow" fill="#3b82f6" />
              <Bar dataKey="Cumulative Cash Flow" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Key Milestones */}
      {results.projection && (() => {
        return (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Key Investment Milestones</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[10, 20, 30].map(year => {
                const milestone = results.projection[year];
                if (!milestone) return null;
                
                const usableEquity = milestone.equity * 0.8;
                const remainingLoan = milestone.remainingLoan || 0;
                const equityExceedsLoan = remainingLoan > 0 && milestone.equity >= remainingLoan;
                const usableEquityExceedsLoan = remainingLoan > 0 && usableEquity >= remainingLoan;
                return (
                  <div 
                    key={year} 
                    className={`border rounded-lg p-4 ${
                      usableEquityExceedsLoan 
                        ? 'bg-green-50 border-green-300 border-2' 
                        : equityExceedsLoan 
                          ? 'bg-blue-50 border-blue-300 border-2' 
                          : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">Year {year}</h3>
                      {usableEquityExceedsLoan && (
                        <span className="text-xl" title="Usable equity exceeds loan">💰</span>
                      )}
                      {!usableEquityExceedsLoan && equityExceedsLoan && (
                        <span className="text-xl" title="Total equity exceeds loan">🏆</span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Value</span>
                        <span className="font-semibold">{formatCurrency(milestone.propertyValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equity</span>
                        <span className={`font-semibold ${equityExceedsLoan ? 'text-green-700' : ''}`}>
                          {formatCurrency(milestone.equity)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usable Equity (80%)</span>
                        <span className={`font-semibold ${usableEquityExceedsLoan ? 'text-green-700' : ''}`}>
                          {formatCurrency(usableEquity)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equity %</span>
                        <span className="font-semibold">{milestone.equityPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Remaining Loan</span>
                        <span className="font-semibold">{formatCurrency(remainingLoan)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cumulative Cash Flow</span>
                        <span className={`font-semibold ${milestone.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(milestone.cumulativeCashFlow)}
                        </span>
                      </div>
                    </div>
                    {usableEquityExceedsLoan && (
                      <div className="mt-3 pt-3 border-t border-green-300 text-xs text-green-800 font-medium">
                        ✓ Usable equity covers remaining loan
                      </div>
                    )}
                    {!usableEquityExceedsLoan && equityExceedsLoan && (
                      <div className="mt-3 pt-3 border-t border-blue-300 text-xs text-blue-800 font-medium">
                        ✓ Total equity covers remaining loan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Year-by-Year Analysis */}
      {results.yearByYear && (
        <YearByYearAnalysis data={results.yearByYear} />
      )}
    </div>
  );
}

export default ResultsDisplay;
