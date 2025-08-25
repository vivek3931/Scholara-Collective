import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const useResources = () => {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjectsByCategory, setSubjectsByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetches categories and subjects from the backend
  const fetchCategoriesAndSubjects = async () => {
    try {
      const response = await fetch(`${API_URL}/subjects`);
      if (!response.ok) {
        throw new Error("Failed to fetch subjects.");
      }
      const allSubjects = await response.json();

      const grouped = allSubjects.reduce((acc, subject) => {
        const categoryName = subject.category || "Uncategorized";
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(subject);
        return acc;
      }, {});

      const allCategories = [{ name: "Trending", id: "trending", icon: "🔥" }];
      Object.keys(grouped).forEach(catName => {
        allCategories.push({ name: catName, id: catName, icon: "📚" });
      });

      setCategories(allCategories);
      setSubjectsByCategory(grouped);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load categories and subjects.");
    }
  };

  // Fetches resources based on the subject ID or for trending
  const fetchResources = async (subjectId = "trending") => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/resources/trending`;
      if (subjectId !== "trending") {
        url = `${API_URL}/resources?subject=${subjectId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch resources.");
      }
      const data = await response.json();
      setResources(data.resources || data); // Update main resources state
      return data.resources || data; // Also return data for specific fetches
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load resources. Please try again.");
      return []; // Return empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // New function to fetch trending resources specifically
  const fetchTrendingResources = async () => {
    try {
      // Assuming a specific endpoint or logic for trending, currently handled by default fetchResources
      const response = await fetch(`${API_URL}/resources/trending`);
      if (!response.ok) throw new Error("Failed to fetch trending resources.");
      const data = await response.json();
      return data.resources || data;
    } catch (err) {
      console.error("Fetch trending error:", err);
      return [];
    }
  };

  // New function to fetch recently added resources
  const fetchRecentlyAddedResources = async () => {
    try {
      // Assuming a backend endpoint for recently added, e.g., /resources?sortBy=createdAt&limit=10
      // If such an endpoint doesn't exist, you'd need to fetch all and sort client-side,
      // but that's less efficient for large datasets.
      const response = await fetch(`${API_URL}/resources?sortBy=createdAt&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch recently added resources.");
      const data = await response.json();
      return data.resources || data;
    } catch (err) {
      console.error("Fetch recently added error:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchCategoriesAndSubjects();
    fetchResources(); // Initial fetch for general resources
  }, []);

  return { 
    resources, 
    categories, 
    subjectsByCategory, 
    isLoading, 
    error, 
    fetchResources, // General fetch for search
    fetchTrendingResources, // Specific for trending section
    fetchRecentlyAddedResources // Specific for recently added section
  };
};

export default useResources;
