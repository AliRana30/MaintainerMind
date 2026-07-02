import React, { createContext, useContext } from "react";

export const ScrollContext = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

export const useScrollContainer = () => {
  const context = useContext(ScrollContext);
  return context;
};
