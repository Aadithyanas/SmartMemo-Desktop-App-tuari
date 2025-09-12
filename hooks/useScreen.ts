import { useEffect, useState } from "react";

export const useScreen = () => {
  const [isIPadMini, setIsIPadMini] = useState(false);
  const [isIPadAir, setIsIPadAir] = useState(false);
  const [isZenBook, setIsZenBook] = useState(false);

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setIsIPadMini(width >= 760 && width <= 770 && height >= 1010 && height <= 1030);
      setIsIPadAir(width >= 810 && width <= 830 && height >= 1170 && height <= 1190);
      setIsZenBook(width >= 840 && width <= 860 && height >= 1270 && height <= 1290);
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return { isIPadMini, isIPadAir, isZenBook };
};
