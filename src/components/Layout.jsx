import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

function Layout({ children }) {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

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
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin + '/property-estimator-site' } })}
                    className="btn-secondary text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => loginWithRedirect()}
                  className="btn-primary text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </div>
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
