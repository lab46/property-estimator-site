import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function Layout({ children }) {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use the same basePath logic as main.jsx
  const isProduction = import.meta.env.PROD;
  const basePath = isProduction ? '/property-estimator-site' : '';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-primary-600">
                Property Calculator
              </Link>
              {isAuthenticated && (
                <div className="hidden md:flex space-x-4">
                  <Link to="/calculator" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Calculate
                  </Link>
                  <Link to="/saved" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Saved Properties
                  </Link>
                  <Link to="/compare" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Compare
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="hidden sm:block text-sm text-gray-700">
                    {user?.email}
                  </span>
                  <button
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin + basePath } })}
                    className="btn-secondary text-sm hidden sm:block"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => loginWithRedirect()}
                  className="btn-primary text-sm hidden sm:block"
                >
                  Login
                </button>
              )}
              
              {/* Mobile menu button */}
              {isAuthenticated && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
                  aria-label="Toggle menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}
              
              {/* Show login button on mobile when not authenticated */}
              {!isAuthenticated && (
                <button
                  onClick={() => loginWithRedirect()}
                  className="btn-primary text-sm sm:hidden"
                >
                  Login
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile menu */}
          {isAuthenticated && mobileMenuOpen && (
            <div className="md:hidden pb-4 pt-2 border-t border-gray-200 mt-2">
              <div className="flex flex-col space-y-2">
                <Link 
                  to="/calculator" 
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Calculate
                </Link>
                <Link 
                  to="/saved" 
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Saved Properties
                </Link>
                <Link 
                  to="/compare" 
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Compare
                </Link>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="text-sm text-gray-600 px-3 py-1">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout({ logoutParams: { returnTo: window.location.origin + basePath } });
                    }}
                    className="w-full text-left text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Property Investment Calculator. For educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
