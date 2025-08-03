import { useState, useEffect, useRef } from 'react';
import CountUp from 'react-countup';
import axios from 'axios';

const StatsSection = () => {
  const [stats, setStats] = useState({
    resources: 0,
    students: 0,
    courses: 0,
    universities: 0
  });
  
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const API_URL = import.meta.env.APP_API_URL || 'http://localhost:5000/api';

  // Fetch real data from your API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics/stats`);
        setStats({
          resources: response.data.resources || 5000,
          students: response.data.students || 10000,
          courses: response.data.courses || 200,
          universities: response.data.universities || 50
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to default values if API fails
        setStats({
          resources: 5000,
          students: 10000,
          courses: 200,
          universities: 50
        });
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Intersection Observer for animation trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-4 bg-gray-50 dark:bg-onyx font-poppins animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-6 bg-white dark:bg-onyx/90 rounded-xl shadow-glow-sm">
                <div className="h-12 bg-gray-200  rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200  rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white dark:bg-onyx/90 rounded-xl shadow-glow-sm transition-all hover:scale-105 hover:bg-amber-50 dark:hover:bg-onyx/90">
              {isVisible && (
                <CountUp
                  end={stats.resources}
                  duration={2.5}
                  separator=","
                  className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-2 font-poppins"
                />
              )}
              <div className="text-base text-gray-600 dark:text-platinum">Resources Shared</div>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-onyx/90 rounded-xl shadow-glow-sm transition-all hover:scale-105 hover:bg-amber-50 dark:hover:bg-onyx/90">
              {isVisible && (
                <CountUp
                  end={stats.students}
                  duration={2.5}
                  separator=","
                  className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-2 font-poppins"
                />
              )}
              <div className="text-base text-gray-600 dark:text-platinum">Students Helped</div>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-onyx/90 rounded-xl shadow-glow-sm transition-all hover:scale-105 hover:bg-amber-50 dark:hover:bg-onyx/90">
              {isVisible && (
                <CountUp
                  end={stats.courses}
                  duration={2}
                  separator=","
                  className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-2 font-poppins"
                />
              )}
              <div className="text-base text-gray-600 dark:text-platinum">Courses Covered</div>
            </div>
            
            <div className="text-center p-6 bg-white dark:bg-onyx/90 rounded-xl shadow-glow-sm transition-all hover:scale-105 hover:bg-amber-50 dark:hover:bg-onyx/90">
              {isVisible && (
                <CountUp
                  end={stats.universities}
                  duration={1.5}
                  separator=","
                  className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent mb-2 font-poppins"
                />
              )}
              <div className="text-base text-gray-600 dark:text-platinum">Universities</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsSection;