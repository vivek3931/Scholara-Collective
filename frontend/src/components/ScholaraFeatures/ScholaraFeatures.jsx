import React from "react";
import IphonePreview from "./IphonePreview"; // adjust path as needed
import { CheckCircle2 } from "lucide-react";

const ScholaraFeatures = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-transparent px-6 py-16">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
        
        {/* Left: Features List */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold font-poppins text-gray-900 dark:text-white leading-tight">
            Unlock <span className="text-amber-500">Free Learning Tools</span> with Scholara
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Scholara helps students study smarter with AI-powered assistance and free resources — all in one place.
          </p>

          <ul className="space-y-4">
            {[
              "Free notes, papers, and study guides",
              "AI chatbot for instant doubt solving",
              "Personalized recommendations",
              "Smart search & filters",
              "Completely free and student-friendly",
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="text-amber-500 flex-shrink-0" size={22} />
                <p className="text-gray-800 dark:text-gray-200">{feature}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Mobile Preview */}
        <div className="flex justify-center lg:justify-end overflow-hidden">
          <IphonePreview />
        </div>
      </div>
    </section>
  );
};

export default ScholaraFeatures;
