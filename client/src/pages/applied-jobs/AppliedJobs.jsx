import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { jobAutomationAPI } from '../../services/api';

const STATUS_BADGES = {
  pending: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Pending' },
  analyzing_jd: { bg: 'bg-blue-900/30', text: 'text-blue-400', label: 'Analyzing' },
  selecting_resume: { bg: 'bg-purple-900/30', text: 'text-purple-400', label: 'Selecting Resume' },
  generating_cover_letter: { bg: 'bg-indigo-900/30', text: 'text-indigo-400', label: 'Generating' },
  sending_email: { bg: 'bg-cyan-900/30', text: 'text-cyan-400', label: 'Sending' },
  completed: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Completed' },
  failed: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Failed' },
};

const AppliedJobs = () => {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const limit = 10;

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? null : filter;
      const response = await jobAutomationAPI.getApplications(page * limit, limit, statusFilter);
      setApplications(response.applications);
      setTotal(response.total);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, filter]);

  const handleViewDetails = async (jobId) => {
    try {
      const details = await jobAutomationAPI.getApplicationDetails(jobId);
      setSelectedJob(details);
    } catch (err) {
      setError(err.message || 'Failed to load job details');
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this application record?')) return;
    
    try {
      await jobAutomationAPI.deleteApplication(jobId);
      setApplications(applications.filter(app => app.id !== jobId));
      setTotal(total - 1);
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete application');
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await jobAutomationAPI.retry(jobId);
      fetchApplications();
      setSelectedJob(null);
    } catch (err) {
      setError(err.message || 'Failed to retry application');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Applied Jobs</h1>
            <p className="text-gray-400 mt-1">
              Track all your job applications and their status
            </p>
          </div>
          <Link
            to="/job-automation"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Application
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'completed', label: 'Completed' },
            { key: 'pending', label: 'In Progress' },
            { key: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 mb-4">
                  <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-gray-400">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
                <p className="text-gray-400 mb-4">
                  {filter === 'all'
                    ? "You haven't applied to any jobs yet."
                    : `No ${filter} applications found.`}
                </p>
                <Link
                  to="/job-automation"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Start Your First Application
                </Link>
              </div>
            ) : (
              <>
                {applications.map((app) => {
                  const status = STATUS_BADGES[app.status] || STATUS_BADGES.pending;
                  return (
                    <div
                      key={app.id}
                      onClick={() => handleViewDetails(app.id)}
                      className={`bg-gray-800 rounded-xl p-4 border transition-all cursor-pointer ${
                        selectedJob?.id === app.id
                          ? 'border-blue-500 ring-1 ring-blue-500'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-white truncate">
                            {app.job_title || 'Job Application'}
                          </h3>
                          {app.company_name && (
                            <p className="text-gray-400 text-sm">{app.company_name}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            {app.recruiter_email && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {app.recruiter_email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(app.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-gray-400">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            {selectedJob ? (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Application Details</h3>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <span className="text-sm text-gray-400">Status</span>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGES[selectedJob.status]?.bg} ${STATUS_BADGES[selectedJob.status]?.text}`}>
                        {STATUS_BADGES[selectedJob.status]?.label}
                      </span>
                    </div>
                    {selectedJob.status_message && (
                      <p className="text-sm text-gray-400 mt-1">{selectedJob.status_message}</p>
                    )}
                    {selectedJob.error_message && (
                      <p className="text-sm text-red-400 mt-1">{selectedJob.error_message}</p>
                    )}
                  </div>

                  {/* Job Title */}
                  {selectedJob.job_title && (
                    <div>
                      <span className="text-sm text-gray-400">Position</span>
                      <p className="text-white">{selectedJob.job_title}</p>
                    </div>
                  )}

                  {/* Company */}
                  {selectedJob.company_name && (
                    <div>
                      <span className="text-sm text-gray-400">Company</span>
                      <p className="text-white">{selectedJob.company_name}</p>
                    </div>
                  )}

                  {/* Recruiter Email */}
                  {selectedJob.recruiter_email && (
                    <div>
                      <span className="text-sm text-gray-400">Recruiter Email</span>
                      <p className="text-white">{selectedJob.recruiter_email}</p>
                    </div>
                  )}

                  {/* Resume Used */}
                  <div>
                    <span className="text-sm text-gray-400">Resume</span>
                    <p className="text-white">
                      {selectedJob.resume_generated === 'true' ? 'Generated for this job' : 'Existing resume selected'}
                    </p>
                  </div>

                  {/* Dates */}
                  <div>
                    <span className="text-sm text-gray-400">Applied On</span>
                    <p className="text-white">{formatDate(selectedJob.created_at)}</p>
                  </div>

                  {selectedJob.email_sent_at && (
                    <div>
                      <span className="text-sm text-gray-400">Email Sent</span>
                      <p className="text-white">{formatDate(selectedJob.email_sent_at)}</p>
                    </div>
                  )}

                  {/* Cover Letter */}
                  {selectedJob.cover_letter && (
                    <div>
                      <span className="text-sm text-gray-400">Cover Letter</span>
                      <div className="mt-2 p-3 bg-gray-700/50 rounded-lg text-sm text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {selectedJob.cover_letter}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    {selectedJob.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(selectedJob.id)}
                        className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedJob.id)}
                      className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-gray-400">Select an application to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AppliedJobs;
