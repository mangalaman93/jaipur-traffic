import React, { useState } from "react";
import { GRID_DIMENSIONS } from "./constants";

export const useRowHeight = (
  containerRef: React.RefObject<HTMLDivElement>,
  rows: number
): number => {
  const [rowHeight, setRowHeight] = useState<number>(GRID_DIMENSIONS.ROW_HEIGHT);

  React.useEffect(() => {
    const updateRowHeight = () => {
      if (!containerRef.current) return;

      const { height } = containerRef.current.getBoundingClientRect();
      const calculatedRowHeight = height / rows;

      if (calculatedRowHeight > 0) {
        setRowHeight(calculatedRowHeight);
      }
    };

    updateRowHeight();
    const resizeObserver = new ResizeObserver(updateRowHeight);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [containerRef, rows]);

  return rowHeight;
};
