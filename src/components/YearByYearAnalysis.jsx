import { useState } from 'react';

function YearByYearAnalysis({ data }) {
  const [showAll, setShowAll] = useState(false);
  
  if (!data || !data.yearlyData) {
    return null;
  }

  const { yearlyData, summary } = data;
  const displayData = showAll ? yearlyData : yearlyData.slice(0, 10);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Year-by-Year Analysis</h2>
      
      {/* Summary Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Key Insights</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Self-Sufficient Status</p>
            {summary.selfSufficientYear ? (
              <p className="text-lg font-bold text-green-600">
                Year {summary.selfSufficientYear}
              </p>
            ) : (
              <p className="text-lg font-bold text-amber-600">
                Not within loan term
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600">Final Property Value</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(summary.finalPropertyValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Final Equity (Loan Paid Off)</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(summary.finalEquity)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Final Monthly Rent</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(summary.finalMonthlyRent)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property Value
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loan Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equity %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Rent
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Cash Flow
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((yearData) => (
              <tr 
                key={yearData.year}
                className={yearData.isSelfSufficient ? 'bg-green-50' : ''}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {yearData.year}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(yearData.propertyValue)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(yearData.loanBalance)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {formatCurrency(yearData.equity)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                  {yearData.equityPercentage}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(yearData.monthlyRent)}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                  yearData.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(yearData.monthlyCashFlow)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {yearData.isSelfSufficient ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Self-Sufficient
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Negative
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More/Less Button */}
      {yearlyData.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="btn-secondary"
          >
            {showAll ? 'Show Less' : `Show All ${yearlyData.length} Years`}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 text-sm text-gray-600">
        <p className="font-medium mb-2">Understanding the Analysis:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Self-Sufficient:</strong> Property generates enough rental income to cover all expenses and loan repayments</li>
          <li><strong>Equity:</strong> Property value minus remaining loan balance</li>
          <li><strong>Monthly Cash Flow:</strong> Rental income minus all expenses and loan repayments</li>
          <li className="text-green-600"><strong>Green rows:</strong> Property is cash flow positive (self-sufficient)</li>
        </ul>
      </div>
    </div>
  );
}

export default YearByYearAnalysis;
