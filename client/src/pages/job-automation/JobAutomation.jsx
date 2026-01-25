import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { jobAutomationAPI } from '../../services/api';
import { userInfoAPI } from '../../services/userInfoApi';

const STATUS_MESSAGES = {
  pending: 'Queued for processing...',
  analyzing_jd: 'Analyzing job description...',
  selecting_resume: 'Selecting best matching resume...',
  generating_cover_letter: 'Generating personalized cover letter...',
  sending_email: 'Sending application email...',
  completed: 'Application sent successfully!',
  failed: 'Application failed',
};

const STATUS_COLORS = {
  pending: 'text-yellow-400',
  analyzing_jd: 'text-blue-400',
  selecting_resume: 'text-purple-400',
  generating_cover_letter: 'text-indigo-400',
  sending_email: 'text-cyan-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
};

const JobAutomation = () => {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const pollingRef = useRef(null);

  // Check if Gmail is connected
  const isGmailConnected = user?.is_gmail_connected;

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await userInfoAPI.get();
        setUserInfo(response.data);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setUserInfo(null);
      } finally {
        setIsLoadingUserInfo(false);
      }
    };
    fetchUserInfo();
  }, []);

  // Check if user info is complete
  const isUserInfoComplete = userInfo && userInfo.full_name && userInfo.email;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Poll for status updates
  const startPolling = (jobId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const status = await jobAutomationAPI.getStatus(jobId);
        setCurrentJob(status);

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await jobAutomationAPI.start(jobDescription, recruiterEmail || null);
      setCurrentJob({ id: response.id, status: response.status, status_message: response.message });
      startPolling(response.id);
    } catch (err) {
      setError(err.message || 'Failed to start job automation');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setJobDescription('');
    setRecruiterEmail('');
    setCurrentJob(null);
    setError('');
    setIsSubmitting(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleRetry = async () => {
    if (!currentJob) return;
    
    try {
      setError('');
      const response = await jobAutomationAPI.retry(currentJob.id);
      setCurrentJob({ id: response.id, status: response.status, status_message: response.message });
      startPolling(response.id);
    } catch (err) {
      setError(err.message || 'Failed to retry job automation');
    }
  };

  const getProgressPercentage = (status) => {
    const stages = ['pending', 'analyzing_jd', 'selecting_resume', 'generating_cover_letter', 'sending_email', 'completed'];
    const index = stages.indexOf(status);
    if (status === 'failed') return 0;
    return Math.round((index / (stages.length - 1)) * 100);
  };

  // Loading state
  if (isLoadingUserInfo) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if Gmail is not connected
  if (!isGmailConnected) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Gmail Not Connected</h2>
            <p className="text-gray-400 mb-4">
              You need to connect your Gmail account to use the job automation feature.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Profile Settings
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if user info is not complete
  if (!isUserInfoComplete) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-orange-900/20 border border-orange-700 rounded-xl p-6 text-center">
            <svg className="w-16 h-16 text-orange-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-xl font-semibold text-white mb-2">Profile Information Required</h2>
            <p className="text-gray-400 mb-4">
              Please complete your profile information (at least your full name and email) in the My Info section before using job automation.
            </p>
            <Link
              to="/my-info"
              className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Complete My Info
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Job Automation</h1>
            <p className="text-gray-400 mt-1">
              Paste a job description and we'll handle the rest automatically
            </p>
          </div>
          <Link
            to="/applied-jobs"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Applied Jobs
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        {!currentJob ? (
          /* Job Description Form */
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="space-y-6">
              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Paste the complete job description here..."
                  required
                />
              </div>

              {/* Recruiter Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recruiter Email
                  <span className="text-gray-500 font-normal ml-2">(optional - we'll try to extract from JD)</span>
                </label>
                <input
                  type="email"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="recruiter@company.com"
                />
              </div>

              {/* What happens next */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-3">What happens next:</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                    <span>We analyze the job description to extract key requirements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">2</span>
                    <span>Select the best matching resume from your uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">3</span>
                    <span>Generate a personalized cover letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">4</span>
                    <span>Send application email with resume and cover letter</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !jobDescription.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Starting...' : 'Start Automation'}
              </button>
            </div>
          </form>
        ) : (
          /* Progress View */
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-gray-400">{getProgressPercentage(currentJob.status)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentJob.status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${currentJob.status === 'failed' ? 100 : getProgressPercentage(currentJob.status)}%` }}
                />
              </div>
            </div>

            {/* Status Display */}
            <div className="text-center mb-8">
              {currentJob.status === 'completed' ? (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-900/30 mb-4">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : currentJob.status === 'failed' ? (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-900/30 mb-4">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-900/30 mb-4">
                  <svg className="w-10 h-10 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}

              <h2 className={`text-2xl font-bold mb-2 ${STATUS_COLORS[currentJob.status]}`}>
                {STATUS_MESSAGES[currentJob.status]}
              </h2>
              
              {currentJob.status_message && currentJob.status !== 'completed' && currentJob.status !== 'failed' && (
                <p className="text-gray-400">{currentJob.status_message}</p>
              )}

              {currentJob.error_message && (
                <p className="text-red-400 mt-2">{currentJob.error_message}</p>
              )}
            </div>

            {/* Job Details (when available) */}
            {(currentJob.job_title || currentJob.company_name || currentJob.recruiter_email) && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-white mb-3">Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {currentJob.job_title && (
                    <div>
                      <span className="text-gray-400">Position:</span>
                      <p className="text-white">{currentJob.job_title}</p>
                    </div>
                  )}
                  {currentJob.company_name && (
                    <div>
                      <span className="text-gray-400">Company:</span>
                      <p className="text-white">{currentJob.company_name}</p>
                    </div>
                  )}
                  {currentJob.recruiter_email && (
                    <div>
                      <span className="text-gray-400">Recruiter:</span>
                      <p className="text-white">{currentJob.recruiter_email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cover Letter Preview (when completed) */}
            {currentJob.status === 'completed' && currentJob.cover_letter && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-white mb-3">Cover Letter Sent</h3>
                <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {currentJob.cover_letter}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {currentJob.status === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Retry Application
                </button>
              )}
              <button
                onClick={handleReset}
                className={`${currentJob.status === 'failed' ? 'flex-1' : 'w-full'} py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors`}
              >
                {currentJob.status === 'completed' ? 'Apply to Another Job' : 'Cancel & Start Over'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default JobAutomation;
