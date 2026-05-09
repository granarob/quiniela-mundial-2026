import { useState, useEffect, useRef } from 'react';

/**
 * Hook de cuenta regresiva.
 * @param {string|Date} targetDate — fecha/hora objetivo (ISO string o Date)
 * @returns {{ days, hours, minutes, seconds, isExpired, totalSeconds }}
 */
export default function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(calcTimeLeft(targetDate));

    intervalRef.current = setInterval(() => {
      const tl = calcTimeLeft(targetDate);
      setTimeLeft(tl);
      if (tl.isExpired) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [targetDate]);

  return timeLeft;
}

function calcTimeLeft(targetDate) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };

  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isExpired: false, totalSeconds };
}
