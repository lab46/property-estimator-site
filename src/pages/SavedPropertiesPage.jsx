import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function SavedPropertiesPage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (isAuthenticated) {
      loadProperties();
    }
  }, [isAuthenticated]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await api.getProperties();
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
      setDeleteSuccess(false);
      await api.deleteProperty(propertyId);
      setProperties(properties.filter(p => p.propertyId !== propertyId));
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to delete property: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleViewProperty = (property) => {
    // Navigate to calculator with the saved property data for recalculation
    navigate('/calculator', { 
      state: { 
        propertyData: property,
        mode: 'view' 
      } 
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const sortProperties = (props) => {
    return [...props].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Convert dates to timestamps for comparison
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedProperties = sortProperties(properties);

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

      {deleteSuccess && (
        <div className="card bg-green-50 border border-green-200 mb-6">
          <div className="flex items-center">
            <span className="text-green-600 text-xl mr-2">✓</span>
            <p className="text-green-700 font-medium">Property deleted successfully</p>
          </div>
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
        <>
          {/* Sort Controls */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('createdAt')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'createdAt'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Created Date
                </button>
                <button
                  onClick={() => setSortBy('updatedAt')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'updatedAt'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Updated Date
                </button>
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortOrder === 'asc'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ↑ Oldest First
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortOrder === 'desc'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ↓ Newest First
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProperties.map((property) => (
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Interest Rate</span>
                  <span className="font-semibold">{property.interestRate}%</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <div>Created: {formatDate(property.createdAt)}</div>
                {property.updatedAt && property.updatedAt !== property.createdAt && (
                  <div>Updated: {formatDate(property.updatedAt)}</div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewProperty(property)}
                  className="btn-primary flex-1 text-sm"
                >
                  View Details
                </button>
                <button className="btn-secondary flex-1 text-sm">
                  Compare
                </button>
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SavedPropertiesPage;
