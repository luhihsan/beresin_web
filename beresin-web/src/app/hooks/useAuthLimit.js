import { useState, useEffect } from "react";

export function useAuthLimit() {
  const [attempts, setAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    const savedCooldown = localStorage.getItem("auth_cooldown_until");
    const savedAttempts = localStorage.getItem("auth_attempts") || 0;
    
    setAttempts(parseInt(savedAttempts));

    if (savedCooldown) {
      const timeLeft = Math.ceil((parseInt(savedCooldown) - Date.now()) / 1000);
      if (timeLeft > 0) {
        setCooldownTime(timeLeft);
      } else {
        localStorage.removeItem("auth_cooldown_until");
      }
    }
  }, []);

  useEffect(() => {
    if (cooldownTime <= 0) return;

    const timer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem("auth_cooldown_until");
          localStorage.setItem("auth_attempts", "0");
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime]);

  const trackFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem("auth_attempts", newAttempts.toString());

    if (newAttempts >= 5) {
      const until = Date.now() + 5 * 60 * 1000; // 5 Menit Cooldown
      localStorage.setItem("auth_cooldown_until", until.toString());
      setCooldownTime(5 * 60);
    }
  };

  const resetAttempts = () => {
    setAttempts(0);
    setCooldownTime(0);
    localStorage.removeItem("auth_attempts");
    localStorage.removeItem("auth_cooldown_until");
  };

  const formatTime = () => {
    const minutes = Math.floor(cooldownTime / 60);
    const seconds = cooldownTime % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return {
    isLocked: cooldownTime > 0,
    cooldownText: formatTime(),
    trackFailedAttempt,
    resetAttempts,
    remainingAttempts: 5 - attempts,
  };
}