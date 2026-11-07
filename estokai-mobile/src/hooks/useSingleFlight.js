import { useCallback, useRef, useState } from 'react';

/**
 * Runs only one asynchronous action at a time. The ref prevents a second tap
 * before React has had a chance to render the disabled state.
 */
export function useSingleFlight() {
  const [isPending, setIsPending] = useState(false);
  const runningRef = useRef(false);

  const run = useCallback(async (action) => {
    if (runningRef.current) return undefined;

    runningRef.current = true;
    setIsPending(true);
    try {
      return await action();
    } finally {
      runningRef.current = false;
      setIsPending(false);
    }
  }, []);

  return { isPending, run };
}
