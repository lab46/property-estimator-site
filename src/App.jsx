import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setAuth0Client } from './services/api';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import SavedPropertiesPage from './pages/SavedPropertiesPage';
import ComparePage from './pages/ComparePage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const auth0 = useAuth0();
  const { isLoading } = auth0;

  // Set Auth0 client for API interceptors
  useEffect(() => {
    if (!isLoading) {
      setAuth0Client(auth0);
    }
  }, [auth0, isLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/saved" element={<SavedPropertiesPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
