import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import HomePage from './pages/HomePage';
import CalculatorPage from './pages/CalculatorPage';
import SavedPropertiesPage from './pages/SavedPropertiesPage';
import ComparePage from './pages/ComparePage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isLoading } = useAuth0();

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
