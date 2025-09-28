import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Staff Routes */}
            <Route path="/staff" element={
              <ProtectedRoute>
                <StaffDashboard />
              </ProtectedRoute>
            } />
            <Route path="/staff/attendance" element={
              <ProtectedRoute>
                <StaffAttendance />
              </ProtectedRoute>
            } />
            <Route path="/staff/sales" element={
              <ProtectedRoute>
                <StaffSales />
              </ProtectedRoute>
            } />
            <Route path="/staff/rankings" element={
              <ProtectedRoute>
                <StaffRankings />
              </ProtectedRoute>
            } />
            <Route path="/staff/salary" element={
              <ProtectedRoute>
                <StaffSalary />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/staff" element={
              <ProtectedRoute adminOnly>
                <AdminStaff />
              </ProtectedRoute>
            } />
            <Route path="/admin/sales" element={
              <ProtectedRoute adminOnly>
                <AdminSales />
              </ProtectedRoute>
            } />
            <Route path="/admin/targets" element={
              <ProtectedRoute adminOnly>
                <AdminTargets />
              </ProtectedRoute>
            } />
            <Route path="/admin/salary" element={
              <ProtectedRoute adminOnly>
                <AdminSalary />
              </ProtectedRoute>
            } />
            <Route path="/admin/backup" element={
              <ProtectedRoute adminOnly>
                <AdminBackup />
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
