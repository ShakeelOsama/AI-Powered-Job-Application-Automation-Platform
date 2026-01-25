import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Dashboard = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Job Automation',
      description: 'Paste a job description and let AI handle everything - resume selection, cover letter, and email sending.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      link: '/job-automation',
      color: 'from-orange-500 to-red-600',
      featured: true,
    },
    {
      title: 'Applied Jobs',
      description: 'Track all your job applications, view their status, and see the cover letters sent.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      link: '/applied-jobs',
      color: 'from-teal-500 to-cyan-600',
    },
    {
      title: 'Manage Resumes',
      description: 'Upload, view, and manage your resumes. Store multiple versions for different job applications.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/resumes',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Generate Cover Letter',
      description: 'Create tailored cover letters using AI. Just paste the job description and select your resume.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      link: '/cover-letter',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Send Email',
      description: 'Send your resume directly to recruiters with a personalized email and cover letter.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      link: '/send-email',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome{user?.full_name ? `, ${user.full_name}` : ''}!
          </h1>
          <p className="text-gray-400 text-lg">
            Your personal job application assistant
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.link}
              className={`group relative bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-300 border hover:border-gray-600 overflow-hidden ${
                feature.featured ? 'border-orange-500/50 md:col-span-2 lg:col-span-1' : 'border-gray-700'
              }`}
            >
              {feature.featured && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                  NEW
                </div>
              )}
              <div className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-linear-to-br ${feature.color} text-white mb-4`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-400">
                {feature.description}
              </p>
              
              <div className="mt-4 flex items-center text-blue-400 font-medium">
                <span>Get started</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Tips</h2>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Use Job Automation to apply to jobs in seconds - just paste the job description!
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Upload multiple versions of your resume for different job types
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Connect your Gmail in Profile settings to enable automated email sending
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Track all your applications in the Applied Jobs section
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
