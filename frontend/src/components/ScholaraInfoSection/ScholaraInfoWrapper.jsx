import React from "react";
import ScholaraInfoSection from "./ScholaraInfoSection";
import InfoShowCaseMobile from "./InfoShowCase";

const ScholaraInfoWrapper = () => {
  return (
    <div className="flex flex-col-reverse max-w-7xl lg:flex-row items-center justify-center gap-12 mx-auto  ">
      <InfoShowCaseMobile />
      <ScholaraInfoSection />
    </div>
  );
};

export default ScholaraInfoWrapper;
