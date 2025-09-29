import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import SetupWrapper from './components/SetupWrapper';
import StaffDashboard from './pages/staff/Dashboard';
import StaffAttendance from './pages/staff/Attendance';
import StaffSales from './pages/staff/Sales';
import StaffRankings from './pages/staff/Rankings';
import StaffSalary from './pages/staff/Salary';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStaff from './pages/admin/Staff';
import AdminSales from './pages/admin/Sales';
import AdminTargets from './pages/admin/Targets';
import AdminSalary from './pages/admin/Salary';
import AdminBackup from './pages/admin/Backup';
import AdminAttendance from './pages/admin/Attendance';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminBrands from './pages/admin/Brands';
import AdminAdvances from './pages/admin/Advances';
import MonitoringDashboard from './components/MonitoringDashboard';
import DisasterRecoveryManager from './components/DisasterRecoveryManager';
import AlertingDashboard from './components/AlertingDashboard';
import IntegrationsManager from './components/IntegrationsManager';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/setup" element={<SetupWrapper />} />
          <Route path="/login" element={<Login />} />
          
          {/* Staff Routes */}
          <Route path="/staff" element={
            <ProtectedRoute>
              <Layout>
                <StaffDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/staff/attendance" element={
            <ProtectedRoute>
              <Layout>
                <StaffAttendance />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/staff/sales" element={
            <ProtectedRoute>
              <Layout>
                <StaffSales />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/staff/rankings" element={
            <ProtectedRoute>
              <Layout>
                <StaffRankings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/staff/salary" element={
            <ProtectedRoute>
              <Layout>
                <StaffSalary />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/staff" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminStaff />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sales" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminSales />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/targets" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminTargets />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/salary" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminSalary />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/backup" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminBackup />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminAttendance />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminReports />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminSettings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/brands" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminBrands />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/advances" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AdminAdvances />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/monitoring" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <MonitoringDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/disaster-recovery" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <DisasterRecoveryManager />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/alerting" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <AlertingDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/integrations" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <IntegrationsManager />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/setup" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;