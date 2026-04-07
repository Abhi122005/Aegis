import { useEffect, useState } from "react";

export function useOllamaStatus() {
  // null means "checking". true/false means verified.
  const [isRunning, setIsRunning] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // We use no-cors so that even if Ollama isn't configured for CORS,
        // we can still detect if the daemon is reachable on localhost.
        await fetch("http://localhost:11434/", { mode: "no-cors" });
        setIsRunning(true);
      } catch (e) {
        // Network error = Ollama is offline or not installed
        setIsRunning(false);
      }
    };

    checkStatus();
    const intervalId = window.setInterval(checkStatus, 5000);
    
    return () => window.clearInterval(intervalId);
  }, []);

  return isRunning;
}
