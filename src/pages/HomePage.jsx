import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

function HomePage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Property Investment Calculator
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Make informed investment decisions with comprehensive property return calculations,
          stamp duty estimates for all Australian states, and 30-year projections.
        </p>
        {!isAuthenticated ? (
          <button
            onClick={() => loginWithRedirect()}
            className="btn-primary text-lg px-8 py-3"
          >
            Get Started
          </button>
        ) : (
          <Link to="/calculator" className="btn-primary text-lg px-8 py-3 inline-block">
            Start Calculating
          </Link>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="card">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Detailed Projections</h3>
          <p className="text-gray-600">
            30-year cash flow projections with rental yield, capital growth, and net returns.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">🏛️</div>
          <h3 className="text-xl font-semibold mb-2">Stamp Duty Calculator</h3>
          <p className="text-gray-600">
            Accurate stamp duty calculations for all Australian states and territories.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">📈</div>
          <h3 className="text-xl font-semibold mb-2">Interest Rate Stress Testing</h3>
          <p className="text-gray-600">
            Test scenarios with +0.25%, +0.50%, and +1.00% interest rate increases.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">💰</div>
          <h3 className="text-xl font-semibold mb-2">Comprehensive Costs</h3>
          <p className="text-gray-600">
            Include all costs: purchase price, stamp duty, legal fees, inspections, and ongoing expenses.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">💾</div>
          <h3 className="text-xl font-semibold mb-2">Save & Compare</h3>
          <p className="text-gray-600">
            Save multiple properties and compare them side-by-side to find the best investment.
          </p>
        </div>

        <div className="card">
          <div className="text-3xl mb-4">📱</div>
          <h3 className="text-xl font-semibold mb-2">Mobile-First Design</h3>
          <p className="text-gray-600">
            Fully responsive interface optimized for mobile, tablet, and desktop devices.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="card max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">1</span>
            <div>
              <h4 className="font-semibold mb-1">Enter Property Details</h4>
              <p className="text-gray-600">Input purchase price, deposit, location, rental income, and expenses.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">2</span>
            <div>
              <h4 className="font-semibold mb-1">View Instant Results</h4>
              <p className="text-gray-600">See cash flow, returns, stamp duty, and 30-year projections instantly.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">3</span>
            <div>
              <h4 className="font-semibold mb-1">Test Scenarios</h4>
              <p className="text-gray-600">Run stress tests with different interest rates to see how changes affect your returns.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">4</span>
            <div>
              <h4 className="font-semibold mb-1">Save & Compare</h4>
              <p className="text-gray-600">Save properties and compare multiple investments side-by-side.</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default HomePage;
