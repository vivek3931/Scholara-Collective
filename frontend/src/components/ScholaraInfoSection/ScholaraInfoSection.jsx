import React from 'react';
import { BookOpen, Target, UploadCloud, Download, Search, Users, Languages, ShieldCheck } from 'lucide-react';

const ScholaraInfoSection = () => {
  return (
    <div className="relative z-10 container mx-auto ">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      
        <section className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg shadow-glow-sm">
              <UploadCloud size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-poppins font-semibold text-gray-800 dark:text-gray-200">
              Key Features
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-3">
              <UploadCloud size={20} className="text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Resource Management</h3>
                <p className="text-sm">Easily upload and download PDFs, images, and text documents with relevant metadata. Preview PDFs directly in your browser.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Search size={20} className="text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Organization & Search</h3>
                <p className="text-sm">Filter resources by subject, course, institution, or tags. Utilize keyword-based search to quickly find what you need and save to your personal library.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users size={20} className="text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Community Features</h3>
                <p className="text-sm">Rate, comment on, and upvote resources. Flag low-quality content for admin review, fostering a high-quality resource pool.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Languages size={20} className="text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Multi-Language Support</h3>
                <p className="text-sm">Access content in multiple languages, including English, Hindi, and Spanish, with full RTL support for languages like Arabic.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Privacy & Security</h3>
                <p className="text-sm">Benefit from encrypted data storage, user-controlled resource visibility, GDPR-compliant data deletion, and validated file uploads.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Download size={20} className="text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">User Authentication</h3>
                <p className="text-sm">Secure signup/login with email or Google OAuth. Guest access for browsing and downloading, with admin roles for moderation.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ScholaraInfoSection;
