import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';

// Public Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';

// Student Pages
import Dashboard from '../pages/Dashboard';
import MockTests from '../pages/MockTests';
import MockTestInterface from '../pages/MockTestInterface';
import ResultPage from '../pages/ResultPage';
import Leaderboard from '../pages/Leaderboard';
import Notes from '../pages/Notes';
import Subscription from '../pages/Subscription';
import Profile from '../pages/Profile';

// Admin Pages
import AdminDashboard from '../pages/AdminDashboard';
import AdminQuestions from '../pages/AdminQuestions';
import AdminAnalytics from '../pages/AdminAnalytics';
import AdminResults from '../pages/AdminResults';
import AdminSubscriptions from '../pages/AdminSubscriptions';
import AdminTestEditor from '../pages/AdminTestEditor';

// Protected Route Wrapper
const PrivateRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  return token ? children : <Navigate to="/login" replace />;
};

// Admin Route Wrapper
const AdminRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);
  
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<VerifyEmail />} />

      {/* Student Protected Routes (Wrapped in DashboardLayout) */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mock-tests"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <MockTests />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/results/:resultId"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <ResultPage />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Leaderboard />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Notes />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Subscription />
            </DashboardLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </PrivateRoute>
        }
      />

      {/* Active Exam Interface (Fullscreen, no Sidebar) */}
      <Route
        path="/test/attempt/:testId"
        element={
          <PrivateRoute>
            <MockTestInterface />
          </PrivateRoute>
        }
      />

      {/* Admin Dashboard Hub */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminQuestions />
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminAnalytics />
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/results"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminResults />
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminSubscriptions />
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/tests/:testId"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminTestEditor />
            </DashboardLayout>
          </AdminRoute>
        }
      />

      {/* Route Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
