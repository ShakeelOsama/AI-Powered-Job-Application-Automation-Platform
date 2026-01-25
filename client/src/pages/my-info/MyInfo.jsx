import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { userInfoAPI } from '../../services/userInfoApi';

const MyInfo = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: []
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const response = await userInfoAPI.get();
      const data = response.data?.data || response.data;
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          linkedin: data.linkedin || '',
          github: data.github || '',
          portfolio: data.portfolio || '',
          summary: data.summary || '',
          experience: data.experience || [],
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          projects: data.projects || []
        });
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  const handleJSONArrayChange = (field, index, key, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      if (key === 'description' || key === 'technologies') {
        newArray[index] = {
          ...newArray[index],
          [key]: value.split('\n').filter(Boolean)
        };
      } else {
        newArray[index] = { ...newArray[index], [key]: value };
      }
      return { ...prev, [field]: newArray };
    });
  };

  const addItem = (field, template) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], template]
    }));
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const response = await userInfoAPI.createOrUpdate(formData);
      setMessage(response.data.message || 'Information saved successfully!');
    } catch (error) {
      setMessage('Error saving information: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExtracting(true);
    setMessage('');

    try {
      const response = await userInfoAPI.extractFromResume(file);
      const extracted = response.data?.data || response.data;
      
      if (extracted) {
        setFormData({
          full_name: extracted.full_name || formData.full_name,
          email: extracted.email || formData.email,
          phone: extracted.phone || formData.phone,
          location: extracted.location || formData.location,
          linkedin: extracted.linkedin || formData.linkedin,
          github: extracted.github || formData.github,
          portfolio: extracted.portfolio || formData.portfolio,
          summary: extracted.summary || formData.summary,
          experience: extracted.experience || formData.experience,
          education: extracted.education || formData.education,
          skills: extracted.skills || formData.skills,
          certifications: extracted.certifications || formData.certifications,
          projects: extracted.projects || formData.projects
        });
      }
      
      setMessage('Information extracted successfully! Review and click "Save Information" to save.');
    } catch (error) {
      setMessage('Error extracting information: ' + error.message);
    } finally {
      setExtracting(false);
    }
  };

  if (loading) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">My Information</h1>
            <label className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer transition-colors">
              {extracting ? 'Extracting...' : 'Extract from Resume'}
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={extracting}
              />
            </label>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">GitHub</label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Portfolio URL</label>
              <input
                type="url"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Professional Summary</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Skills (comma-separated)</label>
              <textarea
                value={formData.skills.join(', ')}
                onChange={(e) => handleArrayChange('skills', e.target.value)}
                rows="2"
                placeholder="Python, JavaScript, React, Node.js"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Experience</label>
                <button
                  type="button"
                  onClick={() => addItem('experience', {
                    company: '',
                    position: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    description: []
                  })}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
                  + Add
                </button>
              </div>
              {formData.experience.map((exp, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded mb-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-medium">Experience #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('experience', index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => handleJSONArrayChange('experience', index, 'company', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <input
                      placeholder="Position"
                      value={exp.position}
                      onChange={(e) => handleJSONArrayChange('experience', index, 'position', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <input
                      placeholder="Location"
                      value={exp.location}
                      onChange={(e) => handleJSONArrayChange('experience', index, 'location', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <input
                      placeholder="Start Date"
                      value={exp.start_date}
                      onChange={(e) => handleJSONArrayChange('experience', index, 'start_date', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <input
                      placeholder="End Date (or Present)"
                      value={exp.end_date || ''}
                      onChange={(e) => handleJSONArrayChange('experience', index, 'end_date', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                  </div>
                  <textarea
                    placeholder="Description (one bullet point per line)"
                    value={exp.description.join('\n')}
                    onChange={(e) => handleJSONArrayChange('experience', index, 'description', e.target.value)}
                    rows="3"
                    className="w-full mt-2 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                  />
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Education</label>
                <button
                  type="button"
                  onClick={() => addItem('education', {
                    institution: '',
                    degree: '',
                    field: '',
                    location: '',
                    graduation_date: '',
                    gpa: ''
                  })}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
                  + Add
                </button>
              </div>
              {formData.education.map((edu, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded mb-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-medium">Education #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('education', index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => handleJSONArrayChange('education', index, 'institution', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <input
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => handleJSONArrayChange('education', index, 'degree', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <input
                      placeholder="Field"
                      value={edu.field || ''}
                      onChange={(e) => handleJSONArrayChange('education', index, 'field', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <input
                      placeholder="Graduation Date"
                      value={edu.graduation_date || ''}
                      onChange={(e) => handleJSONArrayChange('education', index, 'graduation_date', e.target.value)}
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default MyInfo;
