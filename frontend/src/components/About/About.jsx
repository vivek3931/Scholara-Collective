import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const features = [
  {
    title: "Vast Resource Library",
    desc: "Dive into an ever-growing collection of academic materials, meticulously categorized for easy navigation across various subjects and disciplines. Find exactly what you need, when you need it.",
    icon: (
      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 mb-4 sm:mb-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    title: "Easy Uploads & Sharing",
    desc: "Contribute your own valuable notes and resources with the community. Our intuitive upload process makes it simple to share knowledge and help your peers learn and grow.",
    icon: (
      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mb-4 sm:mb-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
  {
    title: "Seamless Organization",
    desc: "Keep all your study materials in one organized place. With Scholara Collective, you can access your content anytime, anywhere, ensuring your academic life stays structured and efficient.",
    icon: (
      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 mb-4 sm:mb-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    title: "Community-Driven Content",
    desc: "Benefit from the collective knowledge and diverse perspectives of students and educators from various academic fields. Learn from the best and contribute to a shared pool of excellence.",
    icon: (
      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 mb-4 sm:mb-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
];

const About = () => {
  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* Fixed Back Button */}
      <button
        onClick={handleGoBack}
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-onyx shadow-lg hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-midnight hover:scale-105 transition-all duration-200 rounded-md border border-gray-200 dark:border-charcoal"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-sm"/>
        <span>Back</span>
      </button>

      {/* Header Section */}
      <div className="bg-white dark:bg-onyx/70 shadow-sm border-b border-gray-200 dark:border-gray-700 pt-16 sm:pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              About <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent">Scholara Collective</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Empowering students worldwide through collaborative learning and knowledge sharing
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Mission Section */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Our Mission
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto mb-6 sm:mb-8"></div>
          </div>
          <div className="bg-white/80 dark:bg-onyx/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 shadow-glow-sm border border-gray-200/50 dark:border-charcoal">
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed text-center max-w-4xl mx-auto">
              At <span className="font-semibold text-orange-600 dark:text-orange-400">Scholara Collective</span>, our mission is simple: to empower students worldwide by fostering a vibrant community for knowledge exchange. We believe that access to high-quality study materials shouldn't be a privilege, but a right. That's why we've created a free, collaborative platform where you can easily discover, share, and organize everything you need to succeed in your studies.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              What We Offer
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 dark:bg-onyx/60 backdrop-blur-sm border border-gray-200/50 dark:border-charcoal p-6 sm:p-8 rounded-xl shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 transform hover:-translate-y-2 text-center group hover:border-orange-300 dark:hover:border-orange-500"
              >
                <div className="transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Our Story
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto mb-6 sm:mb-8"></div>
          </div>
          <div className="bg-orange-50/80 dark:bg-onyx/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 border border-orange-200/50 dark:border-charcoal shadow-glow-sm">
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-300 leading-relaxed text-center max-w-4xl mx-auto">
              Scholara Collective was born out of a common student struggle: the difficulty of finding reliable, comprehensive, and free academic resources. We envisioned a platform that not only provided these essential materials but also fostered a vibrant culture of sharing and collaboration among students. What began as a simple idea has quickly grown into a thriving community, constantly evolving to meet the dynamic academic needs of students like you.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/80 dark:bg-onyx/60 backdrop-blur-sm border border-gray-200/50 dark:border-charcoal rounded-2xl p-6 sm:p-8 lg:p-12 shadow-glow-sm">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Join Our Community
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto">
              Scholara Collective is more than just a website; it's a community built on the principles of collaboration and shared success. We're constantly working to improve and expand our offerings, and your feedback is invaluable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link 
                to={'/resources'} 
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-glow-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm sm:text-base"
              >
                Explore Resources
              </Link>
              <Link 
                to={'/upload'} 
                className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm sm:text-base"
              >
                Upload Your Materials
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;