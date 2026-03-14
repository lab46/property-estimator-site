import { useAuth0 } from '@auth0/auth0-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function ComparePage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (location.state?.properties) {
      setProperties(location.state.properties);
    }
  }, [location.state]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to compare properties.
          </p>
          <button onClick={() => loginWithRedirect()} className="btn-primary">
            Login
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return `${value}%`;
  };

  if (properties.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Compare Properties</h1>
          <button onClick={() => navigate('/saved')} className="btn-primary">
            Back to Saved Properties
          </button>
        </div>
        <div className="card">
          <p className="text-gray-600 text-center py-8">
            No properties selected. Go to saved properties and select properties to compare.
          </p>
        </div>
      </div>
    );
  }

  const comparisonRows = [
    { label: 'Property Name', key: 'name', format: (v) => v || 'N/A' },
    { label: 'Address', key: 'propertyAddress', format: (v) => v || 'N/A' },
    { label: 'State', key: 'state', format: (v) => v || 'N/A' },
    { label: 'Purchase Price', key: 'purchasePrice', format: formatCurrency },
    { label: 'Deposit Amount', key: 'depositAmount', format: formatCurrency },
    { label: 'Loan Amount', key: null, format: (v, prop) => formatCurrency((prop.purchasePrice || 0) - (prop.depositAmount || 0) + (prop.additionalUpfrontCosts || 0)) },
    { label: 'Interest Rate', key: 'interestRate', format: formatPercent },
    { label: 'Loan Term (years)', key: 'loanTerm', format: (v) => v || 'N/A' },
    { label: 'Weekly Rent', key: 'weeklyRent', format: formatCurrency },
    { label: 'Annual Rental Income', key: null, format: (v, prop) => formatCurrency((prop.weeklyRent || 0) * (prop.weeksRented || 52)) },
    { label: 'Rental Yield', key: null, format: (v, prop) => {
      if (!prop.weeklyRent || !prop.purchasePrice) return 'N/A';
      const weeksRented = prop.weeksRented || 52;
      return formatPercent(((prop.weeklyRent * weeksRented) / prop.purchasePrice * 100).toFixed(2));
    }},
    { label: 'LMI / Additional Upfront', key: 'additionalUpfrontCosts', format: formatCurrency },
    { label: 'First Home Buyer', key: 'isFirstHomeBuyer', format: (v) => v ? 'Yes' : 'No' },
    { label: 'Council Rates (monthly)', key: 'councilRatesMonthly', format: formatCurrency },
    { label: 'Water Rates (monthly)', key: 'waterRatesMonthly', format: formatCurrency },
    { label: 'Strata/Body Corp (monthly)', key: 'strataMonthly', format: formatCurrency },
    { label: 'Insurance (monthly)', key: 'insuranceMonthly', format: formatCurrency },
    { label: 'Property Management Fee', key: 'propertyManagementFee', format: formatPercent },
    { label: 'Maintenance (monthly)', key: 'maintenanceMonthly', format: formatCurrency },
    { label: 'Land Tax (monthly)', key: 'landTaxMonthly', format: formatCurrency },
    { label: 'Emergency Services Levy (monthly)', key: 'emergencyServicesLevyMonthly', format: formatCurrency },
    { label: 'Wealth Fee (monthly)', key: 'wealthFeeMonthly', format: formatCurrency },
    { label: 'Total Monthly Expenses', key: null, format: (v, prop) => {
      const total = (prop.councilRatesMonthly || 0) + 
                   (prop.waterRatesMonthly || 0) + 
                   (prop.strataMonthly || 0) + 
                   (prop.insuranceMonthly || 0) + 
                   (prop.maintenanceMonthly || 0) + 
                   (prop.landTaxMonthly || 0) + 
                   (prop.emergencyServicesLevyMonthly || 0) + 
                   (prop.wealthFeeMonthly || 0);
      return formatCurrency(total);
    }},
    { label: 'Monthly Cash Flow', key: null, format: (v, prop) => {
      // Calculate monthly mortgage payment
      const principal = (prop.purchasePrice || 0) - (prop.depositAmount || 0) + (prop.additionalUpfrontCosts || 0);
      const monthlyRate = (prop.interestRate || 0) / 100 / 12;
      const numPayments = (prop.loanTerm || 30) * 12;
      const monthlyMortgage = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      // Calculate monthly rental income
      const monthlyRent = ((prop.weeklyRent || 0) * (prop.weeksRented || 52)) / 12;
      const propertyManagementCost = monthlyRent * ((prop.propertyManagementFee || 0) / 100);
      const netRentalIncome = monthlyRent - propertyManagementCost;
      
      // Calculate monthly expenses
      const monthlyExpenses = (prop.councilRatesMonthly || 0) + 
                             (prop.waterRatesMonthly || 0) + 
                             (prop.strataMonthly || 0) + 
                             (prop.insuranceMonthly || 0) + 
                             (prop.maintenanceMonthly || 0) + 
                             (prop.landTaxMonthly || 0) + 
                             (prop.emergencyServicesLevyMonthly || 0) + 
                             (prop.wealthFeeMonthly || 0);
      
      const cashFlow = netRentalIncome - monthlyMortgage - monthlyExpenses;
      return formatCurrency(cashFlow);
    }},
    { label: 'Capital Growth Rate', key: 'capitalGrowthRate', format: formatPercent },
    { label: 'Rental Growth Rate', key: 'rentalGrowthRate', format: formatPercent },
  ];

  // Helper function to get numeric value for comparison
  const getNumericValue = (property, row) => {
    if (row.label === 'Weekly Rent') {
      return property.weeklyRent || 0;
    }
    if (row.label === 'Annual Rental Income') {
      return (property.weeklyRent || 0) * (property.weeksRented || 52);
    }
    if (row.label === 'Rental Yield') {
      if (!property.weeklyRent || !property.purchasePrice) return 0;
      const weeksRented = property.weeksRented || 52;
      return ((property.weeklyRent * weeksRented) / property.purchasePrice * 100);
    }
    if (row.label === 'Total Monthly Expenses') {
      return (property.councilRatesMonthly || 0) + 
             (property.waterRatesMonthly || 0) + 
             (property.strataMonthly || 0) + 
             (property.insuranceMonthly || 0) + 
             (property.maintenanceMonthly || 0) + 
             (property.landTaxMonthly || 0) + 
             (property.emergencyServicesLevyMonthly || 0) + 
             (property.wealthFeeMonthly || 0);
    }
    if (row.label === 'Monthly Cash Flow') {
      const principal = (property.purchasePrice || 0) - (property.depositAmount || 0) + (property.additionalUpfrontCosts || 0);
      const monthlyRate = (property.interestRate || 0) / 100 / 12;
      const numPayments = (property.loanTerm || 30) * 12;
      const monthlyMortgage = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      const monthlyRent = ((property.weeklyRent || 0) * (property.weeksRented || 52)) / 12;
      const propertyManagementCost = monthlyRent * ((property.propertyManagementFee || 0) / 100);
      const netRentalIncome = monthlyRent - propertyManagementCost;
      
      const monthlyExpenses = (property.councilRatesMonthly || 0) + 
                             (property.waterRatesMonthly || 0) + 
                             (property.strataMonthly || 0) + 
                             (property.insuranceMonthly || 0) + 
                             (property.maintenanceMonthly || 0) + 
                             (property.landTaxMonthly || 0) + 
                             (property.emergencyServicesLevyMonthly || 0) + 
                             (property.wealthFeeMonthly || 0);
      
      return netRentalIncome - monthlyMortgage - monthlyExpenses;
    }
    return null;
  };

  // Determine if a cell should be highlighted
  const shouldHighlight = (property, row, index) => {
    const highlightRows = ['Weekly Rent', 'Annual Rental Income', 'Rental Yield', 'Total Monthly Expenses', 'Monthly Cash Flow'];
    if (!highlightRows.includes(row.label)) return false;

    const values = properties.map(p => getNumericValue(p, row));
    const currentValue = values[index];
    
    if (currentValue === null || currentValue === 0) return false;

    // For expenses, lower is better
    if (row.label === 'Total Monthly Expenses') {
      return currentValue === Math.min(...values.filter(v => v > 0));
    }
    
    // For cash flow, only highlight if at least one property has positive cash flow
    if (row.label === 'Monthly Cash Flow') {
      const hasPositiveCashFlow = values.some(v => v > 0);
      if (!hasPositiveCashFlow) return false; // Don't highlight if all are negative
      return currentValue === Math.max(...values);
    }
    
    // For income/yield/rent, higher is better
    return currentValue === Math.max(...values);
  };

  // Get label for Monthly Cash Flow row
  const getCashFlowLabel = (row) => {
    if (row.label !== 'Monthly Cash Flow') return row.label;
    
    const cashFlows = properties.map(p => getNumericValue(p, row));
    const hasPositiveCashFlow = cashFlows.some(v => v > 0);
    
    if (!hasPositiveCashFlow) {
      return 'Monthly Cash Flow (best = least negative)';
    }
    return 'Monthly Cash Flow';
  };

  // Get CSS class for cash flow cells - only highlight best if all negative
  const getCashFlowClass = (property, row, index) => {
    if (row.label !== 'Monthly Cash Flow') return '';
    
    const cashFlows = properties.map(p => getNumericValue(p, row));
    const currentCashFlow = cashFlows[index];
    const hasPositiveCashFlow = cashFlows.some(v => v > 0);
    
    // Color coding for text
    let colorClass = '';
    if (currentCashFlow > 0) {
      colorClass = 'text-green-900';
    } else if (currentCashFlow < 0) {
      colorClass = 'text-red-900';
    }
    
    // If all are negative, highlight the least negative (best) with blue background
    if (!hasPositiveCashFlow && currentCashFlow === Math.max(...cashFlows)) {
      return `${colorClass} bg-blue-100 font-bold`;
    }
    
    return colorClass;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Compare Properties</h1>
        <button onClick={() => navigate('/saved')} className="btn-primary">
          Back to Saved Properties
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10">
                Metric
              </th>
              {properties.map((property) => (
                <th key={property.propertyId} className="text-left py-3 px-4 font-semibold text-gray-700 min-w-[200px]">
                  {property.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                  {getCashFlowLabel(row)}
                </td>
                {properties.map((property, propIndex) => {
                  const isHighlighted = shouldHighlight(property, row, propIndex);
                  const cashFlowClass = getCashFlowClass(property, row, propIndex);
                  return (
                    <td 
                      key={property.propertyId} 
                      className={`py-3 px-4 ${
                        isHighlighted 
                          ? 'bg-green-100 font-bold text-green-900' 
                          : cashFlowClass 
                            ? cashFlowClass 
                            : 'text-gray-900'
                      }`}
                    >
                      {row.key ? row.format(property[row.key], property) : row.format(null, property)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-600 card">
        <p className="font-semibold mb-2">Tips for comparison:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="inline-block w-4 h-4 bg-green-100 border border-green-300 rounded mr-1"></span>Green highlighting shows the best value for key metrics</li>
          <li><span className="inline-block w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-1"></span>Blue highlighting indicates the least negative cash flow when all properties are negatively geared</li>
          <li><span className="font-bold text-green-900">Green text</span> indicates positive monthly cash flow (property generates income)</li>
          <li><span className="font-bold text-red-900">Red text</span> indicates negative monthly cash flow (out-of-pocket cost to hold)</li>
          <li>Higher weekly rent and rental yield indicate better cash flow potential</li>
          <li>Lower monthly expenses mean lower out-of-pocket costs to hold the property</li>
          <li>Consider total upfront costs including deposit and additional costs</li>
          <li>Higher capital growth rates may offset lower initial yields over time</li>
        </ul>
      </div>
    </div>
  );
}

export default ComparePage;
