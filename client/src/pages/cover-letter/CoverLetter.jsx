import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { resumeAPI, coverLetterAPI } from '../../services/api';

const CoverLetter = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError('');
    setCoverLetter('');

    try {
      const response = await coverLetterAPI.generate(
        parseInt(selectedResumeId),
        jobDescription
      );
      setCoverLetter(response.data.cover_letter);
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    setCoverLetter('');
    setJobDescription('');
    setSelectedResumeId('');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Generate Cover Letter</h1>
          <p className="text-gray-400 mt-1">
            Create a tailored cover letter using AI based on your resume and the job description
          </p>
        </div>

        {/* Error Alert */}
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            {/* Resume Selection */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Resume
              </label>
              {resumesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-400 mb-2">No resumes uploaded yet</p>
                  <a
                    href="/resumes"
                    className="text-blue-500 hover:text-blue-400 font-medium"
                  >
                    Upload a resume first →
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <label
                      key={resume.id}
                      className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedResumeId === String(resume.id)
                          ? 'bg-blue-500/20 border border-blue-500'
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
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          </svg>
                        </div>
                        <span className="text-white font-medium">{resume.name}</span>
                      </div>
                      {selectedResumeId === String(resume.id) && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={12}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-gray-500 text-sm mt-2">
                {jobDescription.length} characters
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedResumeId || !jobDescription.trim()}
              className="w-full py-4 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating with AI...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Cover Letter
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Generated Cover Letter</h2>
              {coverLetter && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="animate-spin h-12 w-12 text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-lg">AI is crafting your cover letter...</p>
                  <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
                </div>
              ) : coverLetter ? (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-300 font-sans text-sm leading-relaxed">
                    {coverLetter}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-lg">Your cover letter will appear here</p>
                  <p className="text-sm text-gray-500 mt-1">Select a resume and paste a job description to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoverLetter;
