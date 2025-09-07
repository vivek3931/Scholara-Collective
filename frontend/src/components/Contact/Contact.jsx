import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEnvelope, faQuestionCircle, faUsers, faPaperPlane, faSpinner } from "@fortawesome/free-solid-svg-icons";

// Define the different contact options
const contactOptions = [
  {
    title: "Email Us Directly",
    desc: "For support, partnerships, or general inquiries, send us an email. We aim to respond within 24-48 hours.",
    icon: faEnvelope, // FontAwesome icon for email
    details: "support@scholaracollective.com",
    type: "email", // Used to conditionally render mailto link
  },
  {
    title: "Check Our FAQ",
    desc: "Quickly find answers to common questions about our platform, resources, and account management.",
    icon: faQuestionCircle, // FontAwesome icon for questions/FAQ
    type: "link", // Used to conditionally render a Link component
    link: "/faq", // Placeholder link for your FAQ page
  },
  {
    title: "Connect on Social Media",
    desc: "Follow us on our social channels for updates, community discussions, and academic tips.",
    icon: faUsers, // FontAwesome icon for social media/community
    details: "Find us on Twitter, Facebook, and Instagram",
    type: "social", // Used to display simple text for social handles
  },
];

const Contact = () => {
  // State for the contact form inputs
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  // State for tracking submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for showing submission success or failure messages
  const [submitSuccess, setSubmitSuccess] = useState(null); // null, true, or false

  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(null); // Reset submission status

    // Simulate an API call for form submission
    // In a real application, you would replace this with a fetch() call to your backend
    setTimeout(() => {
      console.log("Form submitted:", formData);
      // Simulate success
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", message: "" }); // Clear the form fields
      setIsSubmitting(false);

      // To simulate failure, you would do something like:
      // setSubmitSuccess(false);
      // setIsSubmitting(false);
    }, 2000); // Simulate a 2-second network request
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-900 dark:text-white transition-colors duration-300 font-inter">

      

      {/* Header Section */}
      {/* This section contains the main title and a brief description of the page */}
      <div className="bg-white dark:bg-onyx/70 shadow-sm border-b border-gray-200 dark:border-gray-700 pt-16 sm:pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Contact <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent">Scholara Collective</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We're here to help! Reach out to us for any questions, feedback, or support.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Contact Options Section */}
        {/* This section displays various ways users can get in touch with Scholara Collective */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              How to Reach Us
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto mb-6 sm:mb-8"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {contactOptions.map((option, index) => (
              <div
                key={index}
                className="bg-white/80 dark:bg-onyx/60 backdrop-blur-sm border border-gray-200/50 dark:border-charcoal p-6 sm:p-8 rounded-xl shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 transform hover:-translate-y-2 text-center group hover:border-orange-300 dark:hover:border-orange-500"
              >
                {/* Icon for each contact option */}
                <div className="transition-transform duration-300 group-hover:scale-110 mb-4 sm:mb-6">
                  <FontAwesomeIcon icon={option.icon} className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
                </div>
                {/* Title of the contact option */}
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  {option.title}
                </h3>
                {/* Description of the contact option */}
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  {option.desc}
                </p>
                {/* Conditional rendering for email, link, or social details */}
                {option.type === "email" && (
                  <a
                    href={`mailto:${option.details}`}
                    className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:underline font-medium"
                  >
                    {option.details}
                  </a>
                )}
                {option.type === "link" && (
                  <Link
                    to={option.link}
                    className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:underline font-medium"
                  >
                    Go to FAQ
                  </Link>
                )}
                {option.type === "social" && (
                  <p className="text-orange-600 dark:text-orange-400 font-medium">
                    {option.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        {/* This section provides a form for users to send a direct message */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Send Us a Message
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 mx-auto mb-6 sm:mb-8"></div>
          </div>
          <div className="bg-white/80 dark:bg-onyx/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 shadow-glow-sm border border-gray-200/50 dark:border-charcoal max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-50 dark:bg-charcoal text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-50 dark:bg-charcoal text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              {/* Message Textarea */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-50 dark:bg-charcoal text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                ></textarea>
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting} // Disable button while submitting
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-glow-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> {/* Spinner icon */}
                    Sending...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="mr-2" /> {/* Paper plane icon */}
                    Send Message
                  </>
                )}
              </button>
              {/* Submission Status Messages */}
              {submitSuccess === true && (
                <p className="mt-4 text-center text-green-600 dark:text-green-400">
                  Thank you! Your message has been sent successfully.
                </p>
              )}
              {submitSuccess === false && (
                <p className="mt-4 text-center text-red-600 dark:text-red-400">
                  Failed to send message. Please try again later.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Call to Action (CTA) Section */}
        {/* This section encourages users to seek further help or visit the FAQ */}
        <div className="text-center">
          <div className="bg-white/80 dark:bg-onyx/60 backdrop-blur-sm border border-gray-200/50 dark:border-charcoal rounded-2xl p-6 sm:p-8 lg:p-12 shadow-glow-sm">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Need More Help?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto">
              If your question isn't covered in our FAQ or if you need immediate assistance, don't hesitate to reach out directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Link
                to={'/faq'}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg shadow-glow-sm transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm sm:text-base"
              >
                Go to FAQ
              </Link>
              {/* You can add another link here for direct contact (e.g., mailto or a support ticket page) */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;