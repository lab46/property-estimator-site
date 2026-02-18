import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { saveProperty } from '../services/api';
import YearByYearAnalysis from './YearByYearAnalysis';

function ResultsDisplay({ results, onReset, getAccessToken }) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    
    try {
      const propertyData = {
        name: `Property - ${new Date().toLocaleDateString()}`,
        address: '',
        state: results.stampDuty?.state || 'NSW',
        purchasePrice: results.summary.purchasePrice,
        deposit: results.summary.depositAmount,
        interestRate: results.loanDetails.annualInterestRate,
        loanTerm: results.loanDetails.loanTermYears,
        weeklyRent: results.cashFlow.income.weekly,weekly,
        propertyManagementFee: results.cashFlow.costs.breakdown?.propertyManagement 
          ? (results.cashFlow.costs.breakdown.propertyManagement / results.cashFlow.income.annual) * 100 
          : 0,
        councilRates: results.cashFlow.costs.breakdown?.councilRates || 0,
        waterRates: results.cashFlow.costs.breakdown?.waterRates || 0,
        insurance: results.cashFlow.costs.breakdown?.insurance || 0,
        maintenance: results.cashFlow.costs.breakdown?.maintenance || 0,
        capitalGrowthRate: 5,
        rentalGrowthRate: 3,
        isFirstHome: results.stampDuty?.isFirstHome || false,
        calculationResults: results,
      };
      
      await saveProperty(propertyData, getAccessToken);
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
        <h2 className="text-xl font-bold mb-4">Annual Cash Flow</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-green-600">
            <span>Rental Income</span>
            <span className="font-semibold">+{formatCurrency(results.cashFlow.income.annual)}</span>
          </div>
          <div className="border-t pt-3 space-y-2 text-red-600">
            <div className="flex justify-between">
              <span>Loan Repayments</span>
              <span className="font-semibold">-{formatCurrency(results.cashFlow.costs.loanRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Property Management</span>
              <span>-{formatCurrency(results.cashFlow.costs.breakdown.propertyManagement)}</span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Council Rates</span>
              <span>-{formatCurrency(results.cashFlow.costs.breakdown.councilRates)}</span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Water Rates</span>
              <span>-{formatCurrency(results.cashFlow.costs.breakdown.waterRates)}</span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Insurance</span>
              <span>-{formatCurrency(results.cashFlow.costs.breakdown.insurance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="pl-4 text-sm">Maintenance</span>
              <span>-{formatCurrency(results.cashFlow.costs.breakdown.maintenance)}</span>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold">Net Cash Flow</span>
            <span className={`font-bold ${results.cashFlow.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(results.cashFlow.cashFlow.annual)}
            </span>
          </div>
          <div className="text-sm text-gray-600 text-center">
            {formatCurrency(results.cashFlow.cashFlow.monthly)}/month or {formatCurrency(results.cashFlow.cashFlow.weekly)}/week
          </div>
        </div>
      </div>

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
