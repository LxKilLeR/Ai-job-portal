import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobListings from './pages/JobListings';
import JobDetail from './pages/JobDetail';
import ResumeBuilder from './pages/ResumeBuilder';
import AIRecommendations from './pages/AIRecommendations';
import ProfileSetup from './pages/ProfileSetup';

// Recruiter Dashboard
import RecruiterLayout from './components/recruiter/RecruiterLayout';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PostJob from './pages/recruiter/PostJob';
import ManageJobs from './pages/recruiter/ManageJobs';
import Applicants from './pages/recruiter/Applicants';
import Analytics from './pages/recruiter/Analytics';
import RecruiterProfile from './pages/recruiter/RecruiterProfile';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  const { user } = useAuth();
  const seekerNeedsSetup = user?.role === 'Seeker' && !user?.profileCompleted;

  return (
    <Routes>
      {/* Redirect logged-in users from home to appropriate dashboard */}
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={
            user ? (
              user.role === 'Employer' ? (
                <Navigate to="/recruiter" replace />
              ) : seekerNeedsSetup ? (
                <Navigate to="/profile-setup" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Home />
            )
          }
        />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="jobs" element={<JobListings />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route
          path="profile-setup"
          element={
            <ProtectedRoute>
              {user?.role === 'Employer' ? (
                <Navigate to="/recruiter" replace />
              ) : user?.profileCompleted ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <ProfileSetup />
              )}
            </ProtectedRoute>
          }
        />

        {/* Seeker Protected Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              {seekerNeedsSetup ? <Navigate to="/profile-setup" replace /> : <Dashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="build-resume"
          element={
            <ProtectedRoute>
              {seekerNeedsSetup ? <Navigate to="/profile-setup" replace /> : <ResumeBuilder />}
            </ProtectedRoute>
          }
        />
        <Route
          path="recommendations"
          element={
            <ProtectedRoute>
              {seekerNeedsSetup ? <Navigate to="/profile-setup" replace /> : <AIRecommendations />}
            </ProtectedRoute>
          }
        />
      </Route>

	      {/* Recruiter Dashboard - separate layout */}
        <Route path="/recruiter" element={<ProtectedRoute><RecruiterLayout /></ProtectedRoute>}>
          <Route index element={<RecruiterDashboard />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="jobs" element={<ManageJobs />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<RecruiterProfile />} />
	      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
