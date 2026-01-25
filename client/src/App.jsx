import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/resumes/Resumes';
import CoverLetter from './pages/cover-letter/CoverLetter';
import SendEmail from './pages/email/SendEmail';
import Profile from './pages/profile/Profile';
import MyInfo from './pages/my-info/MyInfo';
import GenerateResume from './pages/generate-resume/GenerateResume';
import JobAutomation from './pages/job-automation/JobAutomation';
import AppliedJobs from './pages/applied-jobs/AppliedJobs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <Resumes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cover-letter"
            element={
              <ProtectedRoute>
                <CoverLetter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/send-email"
            element={
              <ProtectedRoute>
                <SendEmail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-info"
            element={
              <ProtectedRoute>
                <MyInfo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generate-resume"
            element={
              <ProtectedRoute>
                <GenerateResume />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-automation"
            element={
              <ProtectedRoute>
                <JobAutomation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applied-jobs"
            element={
              <ProtectedRoute>
                <AppliedJobs />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 - Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
