import { useState, useEffect, useRef } from "react";
import CountUp from "react-countup";
import axios from "axios";
import { io } from "socket.io-client";

const StatsSection = () => {
  const [stats, setStats] = useState({
    resources: 0,
    students: 0,
    courses: 0,
    universities: 0,
  });
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const socket = useRef(null);

  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics/public-stats`);
        setStats({
          resources: response.data.resources || 12547,
          students: response.data.students || 28934,
          courses: response.data.courses || 342,
          universities: response.data.universities || 87,
        });
      } catch (error) {
        console.error("Error fetching initial stats:", error);
        setStats({
          resources: 12547,
          students: 28934,
          courses: 342,
          universities: 87,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialStats();

    socket.current = io(API_URL.replace("/api", ""));
    socket.current.on("statsUpdated", (data) => {
      setStats((prev) => ({
        ...prev,
        resources:
          data.resources !== undefined ? data.resources : prev.resources,
        students: data.students !== undefined ? data.students : prev.students,
        courses: data.courses !== undefined ? data.courses : prev.courses,
        universities:
          data.universities !== undefined
            ? data.universities
            : prev.universities,
      }));
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [API_URL]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 }
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
    <section
      ref={sectionRef}
      className="py-20 px-4
                 transition-all duration-700 ease-in-out font-inter"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl lg:text-5xl font-bold mb-4
                        text-slate dark:text-white
                        bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500
                        bg-clip-text text-transparent"
          >
            Our Impact in Numbers
          </h2>
          <p className="text-lg text-graphite dark:text-platinum max-w-2xl mx-auto">
            Join thousands of students and educators who are transforming their
            academic journey through shared knowledge
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-amber-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden
                          bg-white dark:bg-onyx/60
                          backdrop-blur-sm
                          rounded-2xl shadow-soft-lg dark:shadow-glow-sm
                          border border-silver/50 dark:border-charcoal/50
                          p-8 text-center
                          animate-pulse"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/50 to-transparent
                               dark:via-orange-400/10 translate-x-[-100%] animate-[shimmer_1.5s_infinite]"
                ></div>
                <div className="h-16 bg-silver/30 dark:bg-charcoal/50 rounded-lg mb-4"></div>
                <div className="h-6 bg-silver/30 dark:bg-charcoal/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Resources Card */}
            <div
              className="relative overflow-hidden
                          bg-white/90 dark:bg-onyx/70
                          backdrop-blur-sm
                          rounded-2xl shadow-xl dark:shadow-glow-sm
                          border border-silver/30 dark:border-charcoal/60
                          p-8 text-center
                          transition-all duration-300 ease-out
                          hover:shadow-2xl dark:hover:shadow-glow-lg
                          hover:-translate-y-1"
            >
              {/* Decorative elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-100/30 dark:bg-amber-400/10 blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-orange-100/20 dark:bg-orange-400/10 blur-lg"></div>

              <div className="relative z-10">
                {/* Icon with subtle glow */}
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl
                               bg-gradient-to-br from-orange-50 to-amber-50
                               dark:from-orange-900/30 dark:to-amber-900/30
                               flex items-center justify-center
                               shadow-inner dark:shadow-charcoal/50
                               border border-orange-100/50 dark:border-amber-900/30"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>

                {isVisible && (
                  <CountUp
                    end={stats.resources}
                    duration={2.5}
                    separator=","
                    className="block text-5xl lg:text-6xl font-bold mb-3
                              bg-gradient-to-br from-orange-500 to-amber-500
                              bg-clip-text text-transparent"
                  />
                )}

                <h3 className="text-lg font-semibold text-slate dark:text-white mb-2">
                  Resources Shared
                </h3>
                <p className="text-sm text-graphite/80 dark:text-platinum/80">
                  Study materials, notes & papers
                </p>
              </div>
            </div>

            {/* Students Card */}
            <div
              className="relative overflow-hidden
                          bg-white/90 dark:bg-onyx/70
                          backdrop-blur-sm
                          rounded-2xl shadow-xl dark:shadow-glow-sm
                          border border-silver/30 dark:border-charcoal/60
                          p-8 text-center
                          transition-all duration-300 ease-out
                          hover:shadow-2xl dark:hover:shadow-glow-lg
                          hover:-translate-y-1"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-blue-100/30 dark:bg-blue-400/10 blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-teal-100/20 dark:bg-teal-400/10 blur-lg"></div>

              <div className="relative z-10">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl
                               bg-gradient-to-br from-blue-50 to-teal-50
                               dark:from-blue-900/30 dark:to-teal-900/30
                               flex items-center justify-center
                               shadow-inner dark:shadow-charcoal/50
                               border border-blue-100/50 dark:border-teal-900/30"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                </div>

                {isVisible && (
                  <CountUp
                    end={stats.students}
                    duration={2.5}
                    separator=","
                    className="block text-5xl lg:text-6xl font-bold mb-3
                              bg-gradient-to-br from-blue-500 to-teal-500
                              bg-clip-text text-transparent"
                  />
                )}

                <h3 className="text-lg font-semibold text-slate dark:text-white mb-2">
                  Students Helped
                </h3>
                <p className="text-sm text-graphite/80 dark:text-platinum/80">
                  Learners benefiting from shared knowledge
                </p>
              </div>
            </div>

            {/* Courses Card */}
            <div
              className="relative overflow-hidden
                          bg-white/90 dark:bg-onyx/70
                          backdrop-blur-sm
                          rounded-2xl shadow-xl dark:shadow-glow-sm
                          border border-silver/30 dark:border-charcoal/60
                          p-8 text-center
                          transition-all duration-300 ease-out
                          hover:shadow-2xl dark:hover:shadow-glow-lg
                          hover:-translate-y-1"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-100/30 dark:bg-yellow-400/10 blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-yellow-100/20 dark:bg-amber-400/10 blur-lg"></div>

              <div className="relative z-10">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl
                               bg-gradient-to-br from-amber-50 to-yellow-50
                               dark:from-amber-900/30 dark:to-yellow-900/30
                               flex items-center justify-center
                               shadow-inner dark:shadow-charcoal/50
                               border border-amber-100/50 dark:border-yellow-900/30"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-sm transform rotate-12 flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                </div>

                {isVisible && (
                  <CountUp
                    end={stats.courses}
                    duration={2}
                    separator=","
                    className="block text-5xl lg:text-6xl font-bold mb-3
                              bg-gradient-to-br from-amber-500 to-yellow-500
                              bg-clip-text text-transparent"
                  />
                )}

                <h3 className="text-lg font-semibold text-slate dark:text-white mb-2">
                  Courses Covered
                </h3>
                <p className="text-sm text-graphite/80 dark:text-platinum/80">
                  Subjects across all disciplines
                </p>
              </div>
            </div>

            {/* Universities Card */}
            <div
              className="relative overflow-hidden
                          bg-white/90 dark:bg-onyx/70
                          backdrop-blur-sm
                          rounded-2xl shadow-xl dark:shadow-glow-sm
                          border border-silver/30 dark:border-charcoal/60
                          p-8 text-center
                          transition-all duration-300 ease-out
                          hover:shadow-2xl dark:hover:shadow-glow-lg
                          hover:-translate-y-1"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-orange-100/30 dark:bg-red-400/10 blur-xl"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-red-100/20 dark:bg-orange-400/10 blur-lg"></div>

              <div className="relative z-10">
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl
                               bg-gradient-to-br from-orange-50 to-red-50
                               dark:from-orange-900/30 dark:to-red-900/30
                               flex items-center justify-center
                               shadow-inner dark:shadow-charcoal/50
                               border border-orange-100/50 dark:border-red-900/30"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                      />
                    </svg>
                  </div>
                </div>

                {isVisible && (
                  <CountUp
                    end={stats.universities}
                    duration={1.5}
                    separator=","
                    className="block text-5xl lg:text-6xl font-bold mb-3
                              bg-gradient-to-br from-orange-500 to-red-500
                              bg-clip-text text-transparent"
                  />
                )}

                <h3 className="text-lg font-semibold text-slate dark:text-white mb-2">
                  Universities
                </h3>
                <p className="text-sm text-graphite/80 dark:text-platinum/80">
                  Institutions worldwide
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-graphite dark:text-platinum mb-6">
            Be part of our growing community of knowledge sharers
          </p>
          <button
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500
                           hover:from-orange-600 hover:to-amber-600
                           text-white font-semibold rounded-xl
                           shadow-orange-md hover:shadow-orange-lg
                           transform hover:scale-105 hover:-translate-y-1
                           transition-all duration-300 relative overflow-hidden
                           group"
          >
            <span className="relative z-10">Join Our Community</span>
            <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
