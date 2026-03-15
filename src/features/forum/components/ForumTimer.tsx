import React, { useEffect, useState } from 'react';

interface ForumTimerProps {
  expiresAt: string | null;
}

export function ForumTimer({ expiresAt }: ForumTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('00:00');

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      const difference = expiration - now;

      if (difference <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center text-red-500 font-mono text-xl animate-pulse">
      {timeLeft}
    </div>
  );
}
