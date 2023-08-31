import { RefObject, useState } from "react";

export const useGetWidth = (content: RefObject<HTMLElement>): number => {
  const [width, setWidth] = useState<number>(0)
  const handleResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const { width } = entry.contentRect;
      setWidth(width);
    }
  };

  const resizeObserver = new ResizeObserver(handleResize);

  if (content?.current) {
    resizeObserver.observe(content.current);
  }

  return width
};
