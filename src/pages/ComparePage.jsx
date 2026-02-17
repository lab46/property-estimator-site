import { useAuth0 } from '@auth0/auth0-react';

function ComparePage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Compare Properties</h1>
      <div className="card">
        <p className="text-gray-600 text-center py-8">
          Select properties to compare from your saved list.
        </p>
      </div>
    </div>
  );
}

export default ComparePage;
