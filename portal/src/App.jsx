import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Vendors from './pages/Vendors';
import Products from './pages/Products';
import Modules from './pages/Modules';
import Users from './pages/Users';
import AdminManagement from './pages/AdminManagement';
import Settings from './pages/Settings';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - Require Authentication */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={
                      <SuperAdminRoute>
                        <Dashboard />
                      </SuperAdminRoute>
                    } />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/modules" element={
                      <SuperAdminRoute>
                        <Modules />
                      </SuperAdminRoute>
                    } />
                    <Route path="/users" element={
                      <SuperAdminRoute>
                        <Users />
                      </SuperAdminRoute>
                    } />
                    <Route path="/admins" element={
                      <SuperAdminRoute>
                        <AdminManagement />
                      </SuperAdminRoute>
                    } />
                    <Route path="/settings" element={<Settings />} />
                    {/* Redirect unknown routes based on role */}
                    <Route path="*" element={<Navigate to="/orders" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
