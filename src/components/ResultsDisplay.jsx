import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import YearByYearAnalysis from './YearByYearAnalysis';

function ResultsDisplay({ results, onReset, inputData }) {
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
    const remainingLoan = lastYear.remainingLoan || 0;
    const cumulativeCashFlow = lastYear.cumulativeCashFlow;
    
    // Net position = Property Value - Remaining Loan + Cumulative Cash Flow - Initial Investment
    const netPosition = finalPropertyValue - remainingLoan + cumulativeCashFlow - initialInvestment;
    
    return {
      initialInvestment,
      finalPropertyValue,
      remainingLoan,
      cumulativeCashFlow,
      netPosition,
      roi: (netPosition / initialInvestment) * 100,
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
      const propertyData = {
        name: inputData?.propertyAddress || `Property - ${new Date().toLocaleDateString()}`,
        ...inputData,
      };
      
      await api.saveProperty(propertyData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
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
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <button onClick={onReset} className="btn-secondary">
          ← Calculate Another Property
        </button>
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
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Purchase Price</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(results.summary.purchasePrice)}
            </div>
          </div>

          {/* Loan Amount */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Loan Amount</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(results.summary.loanAmount)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              LVR: {formatPercent(results.loanDetails.lvr)}
            </div>
          </div>

          {/* Total Interest */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Interest ({results.loanDetails.loanTermYears}y)</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(results.loanDetails.totalInterest)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Over {results.loanDetails.loanTermYears} years
            </div>
          </div>

          {/* Monthly Repayment */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Repayment</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(results.loanDetails.monthlyRepayment)}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {formatCurrency(results.loanDetails.monthlyRepayment / 4.33)}/week
            </div>
          </div>

          {/* Property Value at End */}
          {netProfit && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Est. Value (Year {netProfit.loanTerm})</div>
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
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Rental Income</div>
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
            
            // Project expenses with growth (assuming same as rental growth if available)
            let totalExpenses = 0;
            const expenseGrowthRate = inputData?.rentalGrowthRate || 3;
            for (let year = 1; year <= loanTerm; year++) {
              totalExpenses += annualExpenses * Math.pow(1 + expenseGrowthRate / 100, year - 1);
            }
            
            const totalHoldingCosts = totalLoanRepayments + totalExpenses;
            
            return (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Holding Costs</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalHoldingCosts)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Loan + Expenses ({loanTerm}y)
                </div>
              </div>
            );
          })()}

          {/* Cumulative Cash Flow */}
          {cashFlowImpact && (
            <div className={`bg-white rounded-lg p-4 shadow-sm ${cashFlowImpact.isNegative ? 'ring-2 ring-red-300' : 'ring-2 ring-green-300'}`}>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Cash Flow ({cashFlowImpact.loanTerm}y)
              </div>
              <div className={`text-2xl font-bold ${cashFlowImpact.isNegative ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(cashFlowImpact.totalCashFlow)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {cashFlowImpact.isNegative ? '⚠️ Out-of-pocket' : '✅ Income generated'}
              </div>
            </div>
          )}

          {/* Net Profit/Loss */}
          {netProfit && (
            <div className={`bg-white rounded-lg p-4 shadow-sm ring-2 ${netProfit.netPosition >= 0 ? 'ring-green-400' : 'ring-red-400'}`}>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Net Profit/Loss
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
                = Property Value - Loan - Initial Investment + Cash Flow
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
                <div className="font-semibold text-gray-900">Initial Investment</div>
                <div className="text-gray-700">
                  {formatCurrency(results.summary.depositAmount + (results.stampDuty?.total || 0) + results.summary.additionalCosts)}
                </div>
                <div className="text-xs text-gray-500">Deposit + Stamp Duty + Costs</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">📈</span>
              <div>
                <div className="font-semibold text-gray-900">Growth Assumptions</div>
                <div className="text-gray-700">
                  Capital: {inputData?.capitalGrowthRate || 5}%/yr • Rental: {inputData?.rentalGrowthRate || 3}%/yr
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">{results.cashFlow.isPositive ? '✅' : '⚠️'}</span>
              <div>
                <div className="font-semibold text-gray-900">Cash Flow Status</div>
                <div className={`font-medium ${results.cashFlow.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {results.cashFlow.isPositive ? 'Positive' : 'Negative'} - {formatCurrency(results.cashFlow.cashFlow.annual)}/year
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
          <div className="text-sm text-gray-600 mb-1">Stamp Duty</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(results.stampDuty?.total || 0)}
          </div>
          {results.stampDuty?.concessionApplied && (
            <div className="text-xs text-green-600 mt-1">
              {results.stampDuty.concessionType} - Saved {formatCurrency(results.stampDuty.savingsAmount)}
            </div>
          )}
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
        <h2 className="text-xl font-bold mb-4">Upfront Costs</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Purchase Price</span>
            <span className="font-semibold">{formatCurrency(results.summary.purchasePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Stamp Duty</span>
            <span className="font-semibold">{formatCurrency(results.stampDuty?.total || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Additional Costs</span>
            <span className="font-semibold">{formatCurrency(results.summary.additionalCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Your Deposit</span>
            <span className="font-semibold text-red-600">-{formatCurrency(results.summary.depositAmount)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold">Total Upfront (excl. deposit)</span>
            <span className="font-bold">{formatCurrency(results.summary.stampDuty + results.summary.additionalCosts)}</span>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Loan Details</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Loan Amount</span>
              <span className="font-semibold">{formatCurrency(results.summary.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interest Rate</span>
              <span className="font-semibold">{formatPercent(results.loanDetails.annualInterestRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loan Term</span>
              <span className="font-semibold">{results.loanDetails.loanTermYears} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">LVR</span>
              <span className="font-semibold">{formatPercent(results.loanDetails.lvr)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Repayment</span>
              <span className="font-semibold">{formatCurrency(results.loanDetails.monthlyRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Repayment</span>
              <span className="font-semibold">{formatCurrency(results.loanDetails.totalRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Interest</span>
              <span className="font-semibold text-red-600">{formatCurrency(results.loanDetails.totalInterest)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equity Milestones */}
      {results.projection && (() => {
        const equityMatchYear = results.projection.find(p => p.remainingLoan !== undefined && p.equity >= p.remainingLoan);
        const usableEquityMatchYear = results.projection.find(p => p.remainingLoan !== undefined && (p.equity * 0.8) >= p.remainingLoan);
        
        return (equityMatchYear || usableEquityMatchYear) ? (
          <div className="card bg-green-50 border-2 border-green-200">
            <h2 className="text-xl font-bold mb-4 text-green-800">🎯 Equity Milestones</h2>
            <div className="space-y-4">
              {usableEquityMatchYear && (
                <div className="bg-white rounded-lg p-4 border border-green-300">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💰</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 mb-2">Usable Equity Matches Remaining Loan</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        By <span className="font-bold text-green-700">Year {usableEquityMatchYear.year}</span>, your usable equity (80% of total equity) will match or exceed your remaining loan balance.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600">Property Value</div>
                          <div className="font-semibold">{formatCurrency(usableEquityMatchYear.propertyValue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Equity</div>
                          <div className="font-semibold">{formatCurrency(usableEquityMatchYear.equity)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Usable Equity (80%)</div>
                          <div className="font-bold text-green-700">{formatCurrency(usableEquityMatchYear.equity * 0.8)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Remaining Loan</div>
                          <div className="font-semibold">{formatCurrency(usableEquityMatchYear.remainingLoan)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {equityMatchYear && (
                <div className="bg-white rounded-lg p-4 border border-green-300">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏆</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 mb-2">Full Equity Matches Remaining Loan</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        By <span className="font-bold text-green-700">Year {equityMatchYear.year}</span>, your total equity will match or exceed your remaining loan balance.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600">Property Value</div>
                          <div className="font-semibold">{formatCurrency(equityMatchYear.propertyValue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Equity</div>
                          <div className="font-bold text-green-700">{formatCurrency(equityMatchYear.equity)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Equity Percentage</div>
                          <div className="font-semibold">{equityMatchYear.equityPercentage}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Remaining Loan</div>
                          <div className="font-semibold">{formatCurrency(equityMatchYear.remainingLoan)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null;
      })()}

      {/* Cash Flow Breakdown */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cash Flow Analysis</h2>
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
              Considering capital growth, rental growth, and all costs, here's your projected net position 
              at the end of year {netProfit.loanTerm}:
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
                  <div className="text-sm text-gray-600 mb-1">Final Property Value</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(netProfit.finalPropertyValue)}
                  </div>
                  <div className="text-xs text-gray-500">After {netProfit.loanTerm} years growth</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Remaining Loan Balance</div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatCurrency(netProfit.remainingLoan)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Cumulative Cash Flow</div>
                  <div className={`text-lg font-semibold ${netProfit.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit.cumulativeCashFlow)}
                  </div>
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
              </div>
            </div>

            <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-900">
              <strong>Calculation:</strong> Net Position = Property Value - Remaining Loan + Cumulative Cash Flow - Initial Investment
            </div>
          </div>
        </div>
      )}

      {/* Interest Rate Stress Tests */}
      {results.stressTests && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Interest Rate Stress Tests</h2>
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
          <h2 className="text-xl font-bold mb-4">30-Year Property Value & Equity</h2>
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
          <h2 className="text-xl font-bold mb-4">Cash Flow Over Time</h2>
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
