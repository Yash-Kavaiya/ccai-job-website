import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-xl">CCAI Jobs by AI-Powered Careers Easy AI Labs</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#jobs" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Jobs
              </a>
              <a href="#about" className="text-sm font-medium hover:text-blue-600 transition-colors">
                About
              </a>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Land Your Dream AI Job Today
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The premier platform for AI career advancement. Get matched with roles at top companies using advanced algorithms and automated tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Find Jobs
            </button>
            <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Upload Resume
            </button>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            AI-Powered Career Tools
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Job Matching</h3>
              <p className="text-gray-600">
                AI algorithms match you with the perfect roles based on your skills and preferences.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">📄</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Resume Optimization</h3>
              <p className="text-gray-600">
                Get your resume optimized for AI and tech roles with instant feedback.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Interview Prep</h3>
              <p className="text-gray-600">
                Practice with AI-powered mock interviews tailored to your target roles.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-lg">CCAI Jobs by AI-Powered Careers Easy AI Labs</span>
            </div>
            <p className="text-gray-600 mb-4">
              The premier platform for AI career advancement.
            </p>
            <p className="text-sm text-gray-500">
              © 2024 CCAI Jobs by AI-Powered Careers Easy AI Labs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
