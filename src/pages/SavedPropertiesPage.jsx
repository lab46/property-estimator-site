import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { getProperties, deleteProperty } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function SavedPropertiesPage() {
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadProperties();
    }
  }, [isAuthenticated]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties(getAccessTokenSilently);
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      setDeleting(propertyId);
      await deleteProperty(propertyId, getAccessTokenSilently);
      setProperties(properties.filter(p => p.propertyId !== propertyId));
    } catch (err) {
      alert(`Failed to delete property: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your saved properties.
          </p>
          <button onClick={() => loginWithRedirect()} className="btn-primary">
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Saved Properties</h1>
        <button
          onClick={() => navigate('/calculator')}
          className="btn-primary"
        >
          + Calculate New Property
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No saved properties yet.</p>
          <button
            onClick={() => navigate('/calculator')}
            className="btn-primary"
          >
            Calculate Your First Property
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.propertyId} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg">{property.name}</h3>
                <button
                  onClick={() => handleDelete(property.propertyId)}
                  disabled={deleting === property.propertyId}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  {deleting === property.propertyId ? '...' : '🗑️'}
                </button>
              </div>

              {property.address && (
                <p className="text-sm text-gray-600 mb-2">{property.address}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">State</span>
                  <span className="font-semibold">{property.state}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Purchase Price</span>
                  <span className="font-semibold">{formatCurrency(property.purchasePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Weekly Rent</span>
                  <span className="font-semibold">{formatCurrency(property.weeklyRent)}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Saved: {new Date(property.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button className="btn-primary flex-1 text-sm">
                  View Details
                </button>
                <button className="btn-secondary flex-1 text-sm">
                  Compare
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedPropertiesPage;
