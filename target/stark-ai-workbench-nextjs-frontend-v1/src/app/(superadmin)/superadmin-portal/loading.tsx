import SpinnerLarge from "@/components/common/SpinnerLarge";
import React from "react";

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <SpinnerLarge />
    </div>
  );
};

export default Loading;
