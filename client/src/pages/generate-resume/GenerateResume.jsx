import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { userInfoAPI } from '../../services/userInfoApi';

const GenerateResume = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [hasUserInfo, setHasUserInfo] = useState(false);
  const [checkingInfo, setCheckingInfo] = useState(true);
  const [pdfData, setPdfData] = useState(null);
  const [generatedResumeId, setGeneratedResumeId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserInfo();
  }, []);

  const checkUserInfo = async () => {
    try {
      const response = await userInfoAPI.get();
      const data = response.data?.data || response.data;
      setHasUserInfo(!!data && !!data.full_name);
      if (!data || !data.full_name) {
        setMessage('Please complete your profile information first in the "My Info" page.');
      }
    } catch (error) {
      setHasUserInfo(false);
      setMessage('Please complete your profile information first in the "My Info" page.');
    } finally {
      setCheckingInfo(false);
    }
  };

  const handleCreate = async () => {
    if (!hasUserInfo) {
      setMessage('Please complete your profile information first.');
      return;
    }
    
    if (!jobDescription.trim()) {
      setMessage('Please enter a job description');
      return;
    }

    setGenerating(true);
    setMessage('');
    setPdfData(null);
    setGeneratedResumeId(null);

    try {
      const response = await userInfoAPI.generateResume(jobDescription);
      
      if (response.success && response.data.resume_id) {
        setGeneratedResumeId(response.data.resume_id);
        setMessage('Resume created successfully! You can now view or download it.');
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async () => {
    if (!generatedResumeId) return;

    setGenerating(true);
    setMessage('');

    try {
      const response = await userInfoAPI.viewResume(generatedResumeId);
      
      if (response.success && response.data.pdf_base64) {
        // Convert base64 to blob
        const byteCharacters = atob(response.data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create URL for viewing
        const url = window.URL.createObjectURL(blob);
        setPdfData({ url, filename: response.data.filename });
      }
    } catch (error) {
      console.error('Error viewing resume:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedResumeId) return;

    setGenerating(true);
    setMessage('');

    try {
      await userInfoAPI.downloadResume(generatedResumeId, 'tailored_resume.pdf');
      setMessage('Resume downloaded successfully!');
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const closePreview = () => {
    if (pdfData?.url) {
      window.URL.revokeObjectURL(pdfData.url);
    }
    setPdfData(null);
  };

  if (checkingInfo) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 shadow-md rounded-lg p-6 border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-4">Generate Tailored Resume</h1>
          
          {!hasUserInfo && (
            <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-200">
                <strong>Profile Incomplete:</strong> Please complete your information in the{' '}
                <button
                  onClick={() => navigate('/my-info')}
                  className="underline hover:text-red-100"
                >
                  My Info
                </button>
                {' '}page before generating a resume.
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <div className="bg-blue-900 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-200 text-sm">
                <strong>How it works:</strong> Paste the job description below, and we'll generate a professionally formatted, ATS-friendly resume tailored specifically to that position using your saved information.
              </p>
            </div>
            
            <div className="bg-yellow-900 border-l-4 border-yellow-500 p-4">
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> Make sure you've completed your profile information in the "My Info" page before generating a resume.
              </p>
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
              {message}
            </div>
          )}

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows="15"
                placeholder="Paste the complete job description here...

Example:
Job Title: Software Engineer
Company: Tech Corp

Requirements:
- 3+ years of experience with React and Node.js
- Strong understanding of RESTful APIs
- Experience with PostgreSQL
...
"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                disabled={generating || !hasUserInfo}
              />
              <p className="mt-2 text-sm text-gray-400">
                Include the job title, company, requirements, responsibilities, and any other relevant details
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setJobDescription('');
                  setGeneratedResumeId(null);
                  setPdfData(null);
                  setMessage('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                disabled={generating || !hasUserInfo}
              >
                Clear
              </button>
              
              {!generatedResumeId ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={generating || !jobDescription.trim() || !hasUserInfo}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Resume...
                    </span>
                  ) : 'Create Resume'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleView}
                    disabled={generating}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Loading...' : 'View Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={generating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Downloading...' : 'Download Resume'}
                  </button>
                </>
              )}
            </div>
          </form>

          {/* PDF Preview Modal */}
          {pdfData && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white">Resume Preview</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={closePreview}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <iframe
                    src={pdfData.url}
                    className="w-full h-full border-0"
                    title="Resume Preview"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-gray-700 pt-6">
            <h2 className="text-lg font-semibold text-white mb-3">Tips for Best Results:</h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>Include the complete job posting with all requirements and responsibilities</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>The more details you provide, the better the resume will be tailored</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>Ensure your profile information is complete and up-to-date</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-400 mr-2">•</span>
                <span>Generated resume will be ATS-friendly and fit on one page</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GenerateResume;
