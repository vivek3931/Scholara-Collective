import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faFacebookF, faInstagram, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-transparent pt-12 pb-6 border-t border-gray-200 dark:border-t-charcoal font-poppins animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="footer-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold shadow-glow-sm">PP</div>
            <div className="text-xl font-semibold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent font-poppins">Scholara Collective</div>
          </div>
          <p className="text-sm text-gray-600 dark:text-platinum mb-4">
            Scholara Collective is an open platform for students to share and discover academic resources to help each other succeed.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faFacebookF} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h3 className="text-base font-semibold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-4 font-poppins">Resources</h3>
          <ul className="list-none">
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Notes</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Question Papers</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Model Answers</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Revision Sheets</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Study Guides</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3 className="text-base font-semibold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-4 font-poppins">Community</h3>
          <ul className="list-none">
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Contributors</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Guidelines</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Discussion Forum</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Request Resources</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Campus Ambassadors</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3 className="text-base font-semibold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-4 font-poppins">Company</h3>
          <ul className="list-none">
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">About Us</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Blog</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Careers</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Contact</a></li>
            <li className="mb-3"><a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-200 dark:border-onyx flex flex-col md:flex-row items-center md:justify-between gap-4">
        <p className="text-sm text-gray-600 dark:text-platinum">© 2025 Scholara Collective. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Terms of Service</a>
          <a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Privacy Policy</a>
          <a href="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;