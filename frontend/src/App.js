import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import MyProfile from './components/MyProfile';
import EditProfile from './components/EditProfile';
import Dashboard from './components/Dashboard';
import DepartmentManagement from './components/admin/DepartmentManagement';
import UserManagement from './components/admin/UserManagement';
import AddUser from './components/admin/AddUser';
import MyAttendance from './components/MyAttendance';
import ChangePassword from './components/ChangePassword';
import LeaveAttendanceManagement from './components/admin/LeaveAttendanceManagement';
import AttendanceReports from './components/admin/AttendanceReports';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyProfile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/edit" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditProfile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/departments" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <DepartmentManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* User Management Routes */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader', 'Employee']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/users/add"
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader', 'Employee']}>
                  <Layout>
                    <AddUser />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Leave & Attendance Routes */}
            <Route 
              path="/admin/leave/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader', 'Employee']}>
                  <Layout>
                    <LeaveAttendanceManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Payroll Routes */}
            <Route 
              path="/admin/payroll/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-primary">
                        <h4><i className="bi bi-currency-dollar me-2"></i>Payroll Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Salary structure definition</li>
                          <li>Monthly payroll processing</li>
                          <li>Payslip generation and distribution</li>
                          <li>Tax calculations and deductions</li>
                          <li>Reimbursement management</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Performance Routes */}
            <Route 
              path="/admin/performance/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-warning">
                        <h4><i className="bi bi-graph-up-arrow me-2"></i>Performance Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Goal setting and tracking</li>
                          <li>Performance review cycles</li>
                          <li>360-degree feedback</li>
                          <li>Appraisal management</li>
                          <li>Performance analytics</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Training Routes */}
            <Route 
              path="/admin/training/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-info">
                        <h4><i className="bi bi-book me-2"></i>Training Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Training program creation</li>
                          <li>Employee enrollment</li>
                          <li>Training calendar and scheduling</li>
                          <li>Certification tracking</li>
                          <li>Training effectiveness reports</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Recruitment Routes */}
            <Route 
              path="/admin/recruitment/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-secondary">
                        <h4><i className="bi bi-person-plus me-2"></i>Recruitment Management</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Job posting and management</li>
                          <li>Application tracking system</li>
                          <li>Interview scheduling</li>
                          <li>Candidate evaluation</li>
                          <li>Offer letter generation</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Reports Routes */}
            <Route 
              path="/admin/reports/attendance" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <AttendanceReports />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reports/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin', 'Vice President', 'HR BP', 'HR Manager', 'HR Executive', 'Team Manager', 'Team Leader']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-dark">
                        <h4><i className="bi bi-bar-chart me-2"></i>Reports & Analytics</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>Employee reports and analytics</li>
                          <li>Attendance and leave reports</li>
                          <li>Performance dashboards</li>
                          <li>Payroll reports</li>
                          <li>Custom report builder</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* System Settings Routes - Admin Only */}
            <Route 
              path="/admin/settings/*" 
              element={
                <ProtectedRoute requiredRoles={['Admin']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-danger">
                        <h4><i className="bi bi-gear me-2"></i>System Settings</h4>
                        <p>This module will include:</p>
                        <ul>
                          <li>General system configuration</li>
                          <li>User roles and permissions</li>
                          <li>Email templates and notifications</li>
                          <li>Approval workflows</li>
                          <li>Audit logs and security</li>
                          <li>Backup and restore</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* My Attendance Route */}
            <Route 
              path="/employee/attendance" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyAttendance />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Change Password Route */}
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChangePassword />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Employee Self-Service Routes */}
            <Route 
              path="/employee/*" 
              element={
                <ProtectedRoute requiredRoles={['Employee']}>
                  <Layout>
                    <div className="container-fluid">
                      <div className="alert alert-light border">
                        <h4><i className="bi bi-person-circle me-2"></i>Employee Self-Service</h4>
                        <p>This section will include:</p>
                        <ul>
                          <li>Personal profile management</li>
                          <li>Leave application and history</li>
                          <li>Attendance tracking</li>
                          <li>Payslip downloads</li>
                          <li>Training enrollment</li>
                          <li>Performance goals</li>
                        </ul>
                        <p className="mb-0"><strong>Status:</strong> <span className="badge bg-warning">In Development</span></p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Page */}
            <Route 
              path="*" 
              element={
                <Layout>
                  <div className="container-fluid">
                    <div className="row justify-content-center">
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-body text-center">
                            <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                            <h2 className="card-title mt-3">Page Not Found</h2>
                            <p className="card-text text-muted">
                              The page you're looking for doesn't exist.
                            </p>
                            <button 
                              className="btn btn-primary"
                              onClick={() => window.location.href = '/dashboard'}
                            >
                              <i className="bi bi-house me-2"></i>
                              Go to Dashboard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Layout>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
