import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { resumeAPI, emailAPI } from '../../services/api';

const SendEmail = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setResumesLoading(true);
      const response = await resumeAPI.getAll();
      setResumes(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch resumes');
    } finally {
      setResumesLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedResumeId) {
      setError('Please select a resume');
      return;
    }

    if (!toEmail.trim()) {
      setError('Please enter recipient email');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter email subject');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await emailAPI.send(toEmail, subject, body, parseInt(selectedResumeId));
      setSuccess('Email sent successfully!');
      // Clear form
      setToEmail('');
      setSubject('');
      setBody('');
      setSelectedResumeId('');
    } catch (err) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const selectedResume = resumes.find(r => String(r.id) === selectedResumeId);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Send Email</h1>
          <p className="text-gray-400 mt-1">
            Send your resume directly to recruiters with a personalized email
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Resume Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-6">
              <h2 className="text-lg font-medium text-white mb-4">Select Resume to Attach</h2>
              
              {resumesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 mb-2">No resumes uploaded</p>
                  <a
                    href="/resumes"
                    className="text-blue-500 hover:text-blue-400 font-medium text-sm"
                  >
                    Upload a resume first →
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <label
                      key={resume.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedResumeId === String(resume.id)
                          ? 'bg-green-500/20 border border-green-500'
                          : 'bg-gray-700 border border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resume"
                        value={resume.id}
                        checked={selectedResumeId === String(resume.id)}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          </svg>
                        </div>
                        <span className="text-white text-sm truncate">{resume.name}</span>
                      </div>
                      {selectedResumeId === String(resume.id) && (
                        <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {selectedResume && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm">
                    <strong>{selectedResume.name}.pdf</strong> will be attached to the email
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Email Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
              <h2 className="text-lg font-medium text-white mb-4">Compose Email</h2>

              {/* To Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Application for Software Engineer Position"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Body / Cover Letter
                  <span className="text-gray-500 font-normal ml-2">(optional)</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email body or paste your cover letter here..."
                  rows={12}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-gray-500 text-sm mt-2">
                  Tip: You can generate a cover letter from the Cover Letter page and paste it here
                </p>
              </div>

              {/* Preview */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Email Preview</h3>
                <div className="text-gray-300 text-sm space-y-1">
                  <p><span className="text-gray-500">From:</span> Your Gmail Account</p>
                  <p><span className="text-gray-500">To:</span> {toEmail || 'Not specified'}</p>
                  <p><span className="text-gray-500">Subject:</span> {subject || 'Not specified'}</p>
                  <p><span className="text-gray-500">Attachment:</span> {selectedResume ? `${selectedResume.name}.pdf` : 'No resume selected'}</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !selectedResumeId || !toEmail.trim() || !subject.trim()}
                className="w-full py-4 bg-linear-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Email...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SendEmail;
