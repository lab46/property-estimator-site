import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { calculateProperty } from '../services/api';
import PropertyForm from '../components/PropertyForm';
import ResultsDisplay from '../components/ResultsDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

function CalculatorPage() {
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to use the property calculator.
          </p>
          <button onClick={() => loginWithRedirect()} className="btn-primary">
            Login
          </button>
        </div>
      </div>
    );
  }

  const handleCalculate = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculations now happen client-side, no API call needed
      const result = await calculateProperty(formData);
      setResults(result);
    } catch (err) {
      setError(err.message || 'Failed to calculate property returns');
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Investment Calculator</h1>
        <p className="text-gray-600">
          Enter property details to calculate investment returns, cash flow, and 30-year projections.
        </p>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Calculation Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!results ? (
        <PropertyForm onCalculate={handleCalculate} />
      ) : (
        <ResultsDisplay 
          results={results} 
          onReset={handleReset}
          getAccessToken={getAccessTokenSilently}
        />
      )}
    </div>
  );
}

export default CalculatorPage;
