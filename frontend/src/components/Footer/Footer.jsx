import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faFacebookF, faInstagram, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import logo from '../../assets/logo.svg'
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-transparent pt-12 pb-6 border-t border-gray-200 dark:border-t-charcoal font-poppins animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="footer-col">
          <div className="flex items-center mb-4">
            <img src={logo} alt="main_logo" />
          </div>
          <p className="text-sm text-gray-600 dark:text-platinum mb-4">
            Scholara Collective is an open platform for students to share and discover academic resources to help each other succeed.
          </p>
          <div className="flex gap-4">
            <Link to="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faTwitter} />
            </Link>
            <Link to="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faFacebookF} />
            </Link>
            <Link to="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faInstagram} />
            </Link>
            <Link to="#" className="w-9 h-9 rounded-full bg-gray-200 dark:bg-onyx/90 flex items-center justify-center text-amber-600 dark:text-amber-200 transition-all duration-200 hover:bg-amber-500 hover:text-white shadow-glow-sm">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </Link>
          </div>
        </div>
        <div className="footer-col">
          <h3 className="text-base font-semibold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-4 font-poppins">Resources</h3>
          <ul className="list-none">
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Notes</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Question Papers</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Model Answers</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Revision Sheets</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Study Guides</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3 className="text-base font-semibold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-4 font-poppins">Community</h3>
          <ul className="list-none">
            <li className="mb-3"><Link to="/contributors" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Contributors</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Guidelines</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Discussion Forum</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Request Resources</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Campus Ambassadors</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3 className="text-base font-semibold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-4 font-poppins">Company</h3>
          <ul className="list-none">
            <li className="mb-3"><Link to="/about" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">About Us</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Blog</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Careers</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Contact</Link></li>
            <li className="mb-3"><Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-200 dark:border-onyx flex flex-col md:flex-row items-center md:justify-between gap-4">
        <p className="text-sm text-gray-600 dark:text-platinum">© 2025 Scholara Collective. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Terms of Service</Link>
          <Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Privacy Policy</Link>
          <Link to="#" className="text-gray-600 dark:text-platinum text-sm transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;