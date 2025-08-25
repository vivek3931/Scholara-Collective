import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useModal } from "../../context/ModalContext/ModalContext";
import { useAuth } from "../../context/AuthContext/AuthContext";

const UploadIcon = () => (
  <svg
    className="w-8 h-8 mb-2 text-orange-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const UploadPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState(""); // Stores the *value* of the selected/finalized subject
  const [subjectInput, setSubjectInput] = useState(""); // Stores the text currently in the input field
  const [fetchedSubjects, setFetchedSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [institution, setInstitution] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [subjectSearchLoading, setSubjectSearchLoading] = useState(false);
  const [subjectSearchTimeout, setSubjectSearchTimeout] = useState(null);
  
  const subjectInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const courses = [
    { value: "", label: "Select Course Type" }, // Changed label to indicate it's required
    { value: "Notes", label: "Notes" },
    { value: "Question Paper", label: "Question Paper" },
    { value: "Book", label: "Book" },
    { value: "Presentation", label: "Presentation" },
    { value: "Syllabus", label: "Syllabus" },
    { value: "Mock Test", label: "Mock Test" },
    { value: "Previous Year Paper", label: "Previous Year Paper" },
    { value: "Study Guide", label: "Study Guide" },
    { value: "Other", label: "Other" },
  ];

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear + 5; i >= 1950; i--) {
    years.push({ value: i.toString(), label: i.toString() });
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleSubjectInputChange = (e) => {
    const value = e.target.value;
    setSubjectInput(value);
    
    // Clear the selected subject if input doesn't match a fetched subject exactly
    if (!fetchedSubjects.some(subj => subj.label.toLowerCase() === value.toLowerCase())) {
        setSubject(""); // Unset the official subject if it no longer matches
    } else {
        // If it exactly matches an existing subject, set it
        const matchedSubject = fetchedSubjects.find(subj => subj.label.toLowerCase() === value.toLowerCase());
        if (matchedSubject) {
            setSubject(matchedSubject.value);
        }
    }


    if (subjectSearchTimeout) {
      clearTimeout(subjectSearchTimeout);
    }

    if (!value.trim()) {
      setFilteredSubjects([]);
      setShowSuggestions(false);
      return;
    }

    setSubjectSearchLoading(true);

    const timeout = setTimeout(() => {
      const filtered = fetchedSubjects.filter(subj => 
        subj.label.toLowerCase().includes(value.toLowerCase())
      );

      filtered.sort((a, b) => {
        const aIsExact = a.label.toLowerCase() === value.toLowerCase();
        const bIsExact = b.label.toLowerCase() === value.toLowerCase();
        
        if (aIsExact && !bIsExact) return -1;
        if (!aIsExact && bIsExact) return 1;
        return a.label.localeCompare(b.label);
      });

      setFilteredSubjects(filtered);
      setShowSuggestions(true);
      setSubjectSearchLoading(false);
    }, 300);

    setSubjectSearchTimeout(timeout);
  };

  const handleSubjectSelect = (subjectObj) => {
    setSubjectInput(subjectObj.label); // Display the label in the input
    setSubject(subjectObj.value);     // Set the actual value for submission
    setShowSuggestions(false);
    subjectInputRef.current.focus();
  };

  const handleClickOutsideSuggestions = (e) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutsideSuggestions);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSuggestions);
    };
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${API_URL}/subjects`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFetchedSubjects(data);
      } catch (error) {
        console.error("Could not fetch subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };


const handleSubmit = async () => {
  setUploading(true);

  if (!file) {
    showModal({
      type: "error",
      title: "Upload Failed",
      message: "Please select a file to upload.",
      confirmText: "Okay",
    });
    setUploading(false);
    return;
  }

  // Determine the final subject value to send
  // If a suggestion was selected, 'subject' state will have its value.
  // If the user typed a new subject, 'subjectInput' will have it.
  const finalSubjectLabel = subjectInput.trim(); // Use subjectInput for the label

  // Construct the subject object to match the backend's expected format
  const finalSubjectObject = {
    label: finalSubjectLabel,
    value: (subject || finalSubjectLabel).toLowerCase().replace(/\s/g, "-"), // Use 'subject' if selected, else derive from label
  };


  // --- Client-side validation ---
  // Now also check if finalSubjectLabel is not empty
  if (!title.trim() || !finalSubjectLabel || !year || !institution.trim() || !course.trim()) {
    showModal({
      type: "error",
      title: "Validation Error",
      message: "Please fill in all required fields (Title, Subject, Year, Institution, Course).",
      confirmText: "Got it",
    });
    setUploading(false);
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    
    // Append the stringified subject object to FormData
    // Ensure the subject object sent to backend has a non-empty label
    formData.append("subject", JSON.stringify(finalSubjectObject));
    
    formData.append("course", course);
    formData.append("year", year);
    formData.append("institution", institution);
    formData.append("tags", tags ? JSON.stringify(tags.split(',').map(tag => tag.trim())) : "[]");

    const response = await fetch(`${API_URL}/resources/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 409) {
      const data = await response.json();
      showModal({
        type: "warning",
        title: "Duplicate Resource Found",
        message: "This file has already been uploaded. Thank you for your contribution!",
        confirmText: "Okay",
      });
      return;
    }

    const data = await response.json();

    if (response.ok) {
      showModal({
        type: "success",
        title: "Upload Successful",
        message: "Resource uploaded successfully! You have been awarded 80 Scholara Coins! 🪙",
        confirmText: "View Resources",
        onConfirm: () => {
          navigate("/resources");
        },
      });

      setTitle("");
      setDescription("");
      setSubject("");
      setSubjectInput("");
      setCourse("");
      setYear("");
      setInstitution("");
      setTags("");
      setFile(null);
    } else {
      showModal({
        type: "error",
        title: "Upload Failed",
        message: data.msg || "An unexpected error occurred.",
        confirmText: "Okay",
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    showModal({
      type: "error",
      title: "Upload Failed",
      message: error.message || "Could not connect to the server. Please try again later.",
      confirmText: "Okay",
    });
  } finally {
    setUploading(false);
  }
};

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-900 dark:text-gray-100 transition-all duration-300 ">

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 pt-16 sm:pt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 bg-clip-text text-transparent mb-4">
              Upload Resource
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Share your knowledge with the community. Upload notes, papers, and
              study materials.
            </p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-onyx/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-charcoal shadow-glow-sm dark:shadow-glow-sm overflow-hidden">
          <div className="bg-gradient-to-r p-4 sm:p-6 border-b border-gray-200/50 dark:border-charcoal">
            <div className="flex items-center justify-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <CheckIcon />
                </div>
                <span className="text-xs sm:text-sm font-medium">
                  File Upload
                </span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-gray-300 dark:bg-charcoal"></div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-bold text-orange-500">
                    2
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium">Details</span>
              </div>
              <div className="w-8 sm:w-16 h-0.5 bg-gray-300 dark:bg-charcoal"></div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-300 dark:border-charcoal rounded-full flex items-center justify-center">
                  <span className="text-xs sm:text-sm text-gray-400">3</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">
                  Publish
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-platinum flex items-center">
                  <span className="w-2 h-6 sm:h-8 bg-gradient-to-b from-orange-500 to-yellow-500 rounded-full mr-3"></span>
                  Upload File
                </h3>

                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 shadow-glow-sm hover:shadow-glow-sm ${
                    dragActive
                      ? "border-orange-400 bg-orange-50 dark:bg-orange-900/10"
                      : file
                      ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                      : "border-gray-300 dark:border-charcoal hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/5"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />

                  {file ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                        <svg
                          className="w-6 h-6 sm:w-8 sm:h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
            <p className="font-semibold text-green-700 dark:text-green-300 text-sm sm:text-base break-words">
                          {file.name}
                        </p>
                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-xs sm:text-sm text-gray-500 hover:text-red-500 transition-colors duration-200"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <UploadIcon />
                      <div>
                        <p className="text-base sm:text-lg font-medium">
                          Drop your file here, or{" "}
                          <span className="text-orange-500">browse</span>
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Supports PDF, DOC, DOCX, PPT, PPTX (Max 50MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-platinum flex items-center">
                  <span className="w-2 h-6 sm:h-8 bg-gradient-to-b from-orange-500 to-yellow-500 rounded-full mr-3"></span>
                  Resource Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="title"
                      className="block text-sm font-semibold text-gray-700 dark:text-platinum mb-2"
                    >
                      Title <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 shadow-glow-sm text-sm sm:text-base"
                      placeholder="e.g., UPSC 2023 General Studies Notes"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject-input"
                      className="block text-sm font-semibold text-gray-700 dark:text-platinum mb-2"
                    >
                      Subject <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative" ref={suggestionsRef}>
                      <input
                        id="subject-input"
                        type="text"
                        ref={subjectInputRef}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-glow-sm text-sm sm:text-base"
                        placeholder="e.g., Mathematics"
                        value={subjectInput}
                        onChange={handleSubjectInputChange}
                        onFocus={() => setShowSuggestions(true)}
                        required
                      />
                      {subjectSearchLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {showSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-onyx border border-gray-300 dark:border-charcoal rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {filteredSubjects.length > 0 ? (
                            filteredSubjects.map((subj) => (
                              <div
                                key={subj.value}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-charcoal transition-colors duration-200 flex items-center"
                                onClick={() => handleSubjectSelect(subj)}
                              >
                                {subj.label === subjectInput ? (
                                  <span className="mr-2 text-green-500">
                                    <CheckIcon />
                                  </span>
                                ) : null}
                                {subj.label}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              No matching subjects found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="year"
                      className="block text-sm font-semibold text-gray-700 dark:text-platinum mb-2"
                    >
                      Year <span className="text-orange-500">*</span>
                    </label>
                    <select
                      id="year"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-glow-sm text-sm sm:text-base"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="">Select Year</option>
                      {years.map((y) => (
                        <option key={y.value} value={y.value}>
                          {y.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="course"
                      className="block text-sm font-semibold text-gray-700 dark:text-platinum mb-2"
                    >
                      Course Type <span className="text-orange-500">*</span> {/* Made required */}
                    </label>
                    <select
                      id="course"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-glow-sm text-sm sm:text-base"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      required // Made required
                    >
                      {courses.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="institution"
                      className="block text-sm font-semibold text-gray-700 dark:text-platinum mb-2"
                    >
                      Institution <span className="text-orange-500">*</span> {/* Made required */}
                    </label>
                    <input
                      type="text"
                      id="institution"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 shadow-glow-sm text-sm sm:text-base"
                      placeholder="e.g., MIT, Delhi University"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      required // Made required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="description"
                      className="block text-sm font-semibold text-gray-700 dark:text-platinum mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows="4"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none shadow-glow-sm text-sm sm:text-base"
                      placeholder="Provide a detailed description of your resource..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="tags"
                      className="block text-sm font-semibold text-gray-700 dark:text-platinum mb-2"
                    >
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 shadow-glow-sm text-sm sm:text-base"
                      placeholder="e.g., UPSC, GS1, JEE Physics, NEET Biology"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Separate multiple tags with commas to help others find
                      your resource
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-charcoal">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl font-semibold text-base sm:text-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    "Upload Resource"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
