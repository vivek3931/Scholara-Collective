import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';

const UploadPage = () => {
    const { token, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [course, setCourse] = useState('');
    const [year, setYear] = useState('');
    const [institution, setInstitution] = useState('');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const API_URL = import.meta.env.APP_API_URL || 'http://localhost:5000/api';

    const subjects = [
        { value: '', label: 'Select Subject' },
        { value: 'Mathematics', label: 'Mathematics' },
        { value: 'Physics', label: 'Physics' },
        { value: 'Chemistry', label: 'Chemistry' },
        { value: 'Biology', label: 'Biology' },
        { value: 'Computer Science', label: 'Computer Science' },
        { value: 'History', label: 'History' },
        { value: 'Geography', label: 'Geography' },
        { value: 'English', label: 'English' },
        { value: 'Economics', label: 'Economics' },
        { value: 'Business Studies', label: 'Business Studies' },
        { value: 'Political Science', label: 'Political Science' },
        { value: 'Environmental Science', label: 'Environmental Science' },
        { value: 'Psychology', label: 'Psychology' },
        { value: 'Sociology', label: 'Sociology' },
        { value: 'Philosophy', label: 'Philosophy' },
        { value: 'Law', label: 'Law' },
        { value: 'Arts and Culture', label: 'Arts and Culture' },
        { value: 'Physical Education', label: 'Physical Education' },
    ];

    const courses = [
        { value: '', label: 'Select Course (Optional)' },
        { value: 'Notes', label: 'Notes' },
        { value: 'Question Paper', label: 'Question Paper' },
        { value: 'Book', label: 'Book' },
        { value: 'Presentation', label: 'Presentation' },
        { value: 'Syllabus', label: 'Syllabus' },
        { value: 'Other', label: 'Other' },
    ];

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear + 5; i >= 1950; i--) {
        years.push({ value: i.toString(), label: i.toString() });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setUploading(true);

        if (!file) {
            setError('Please select a file to upload.');
            setUploading(false);
            return;
        }

        if (!title.trim() || !subject || !year || !institution.trim()) {
            setError('Please fill in all required fields (Title, Subject, Year, Institution).');
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('subject', subject);
        formData.append('course', course || '');
        formData.append('year', year);
        formData.append('institution', institution.trim());
        formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(tag => tag)));
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/resources/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.msg || 'Resource uploaded successfully!');
                setTitle('');
                setDescription('');
                setSubject('');
                setCourse('');
                setYear('');
                setInstitution('');
                setTags('');
                setFile(null);
                
                setTimeout(() => {
                    navigate('/resources');
                }, 1500);
            } else {
                setError(data.msg || 'Failed to upload resource.');
                console.error('Upload error details:', data);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Server error during upload. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-onyx text-gray-900 dark:text-gray-100 p-6 font-sans transition-colors duration-300">
                <Navbar />
                <div className="container mx-auto mt-10 text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 mb-4">Access Denied</h1>
                    <p className="text-lg">Please log in to upload resources.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-6 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors duration-200 shadow-md"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-onyx text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
            <div className="container mx-auto  p-3 lg:p-6">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 text-center mb-12">Upload New Resource</h1>

                <div className="bg-white dark:bg-onyx p-4 lg:p-8 rounded-xl shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-charcoal transition-colors duration-300">
                    {error && <p className="bg-red-100  text-red-600 dark:text-red-300 p-4 rounded-lg mb-6 text-center">{error}</p>}
                    {success && <p className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 p-4 rounded-lg mb-6 text-center">{success}</p>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="file" className="block text-lg font-medium mb-2">
                                Select File <span className="text-orange-500">*</span>
                            </label>
                            <input
                                type="file"
                                id="file"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500 file:text-white hover:file:bg-orange-600 transition-colors duration-200"
                                onChange={(e) => setFile(e.target.files[0])}
                                required
                            />
                            {file && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Selected: {file.name} ({Math.round(file.size / 1024)} KB)</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="title" className="block text-lg font-medium mb-2">
                                Title <span className="text-orange-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors duration-200 placeholder:text-charcoal"
                                placeholder="e.g., Quantum Physics Lecture Notes"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-lg font-medium mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                rows="4"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y transition-colors duration-200 placeholder:text-charcoal"
                                placeholder="Provide a brief summary of the resource content."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="relative">
                            <label htmlFor="subject" className="block text-lg font-medium mb-2">
                                Subject <span className="text-orange-500">*</span>
                            </label>
                            <select
                                id="subject"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none pr-10 transition-colors duration-200"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            >
                                {subjects.map((subj) => (
                                    <option key={subj.value} value={subj.value} disabled={subj.value === ''}>
                                        {subj.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-10">
                                <svg
                                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div className="relative">
                            <label htmlFor="course" className="block text-lg font-medium mb-2">
                                Course Type
                            </label>
                            <select
                                id="course"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none pr-10 transition-colors duration-200"
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                            >
                                {courses.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-10">
                                <svg
                                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div className="relative">
                            <label htmlFor="year" className="block text-lg font-medium mb-2">
                                Year <span className="text-orange-500">*</span>
                            </label>
                            <select
                                id="year"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 appearance-none pr-10 transition-colors duration-200"
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
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none top-10">
                                <svg
                                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="institution" className="block text-lg font-medium mb-2">
                                Institution <span className="text-orange-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="institution"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors duration-200 placeholder:text-charcoal"
                                placeholder="e.g., MIT, Harvard University, IIT Delhi"
                                value={institution}
                                onChange={(e) => setInstitution(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="tags" className="block text-lg font-medium mb-2">
                                Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                id="tags"
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-onyx border border-gray-300 dark:border-charcoal text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors duration-200 placeholder:text-charcoal"
                                placeholder="e.g., physics, quantum, notes, university"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                            />
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Separate multiple tags with commas (e.g., "math, algebra, calculus")</p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-orange-500 text-white p-3 rounded-lg font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload Resource'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;