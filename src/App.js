import { AuthProvider } from './auth/AuthContext';
import { allRoutes } from './utilities/routes';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import PrivateRoute from './auth/PrivateRoute';
import './App.css';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';

export default function App() {

  return (
  <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
          <PrivateRoute>
              <Dashboard model={allRoutes} />
          </PrivateRoute>
          }
        />
      </Routes>
   </AuthProvider>
  );

}