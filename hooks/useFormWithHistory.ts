// FIX: Import 'React' to provide the namespace for types like 'React.SetStateAction'.
import React, { useState, useCallback } from 'react';

const MAX_HISTORY_SIZE = 50;

/**
 * A custom hook that manages component state with an undo history.
 * @param initialState The initial state value.
 * @returns A tuple containing:
 *  - state: The current state.
 *  - setState: A function to update the state (and save to history).
 *  - undo: A function to revert to the previous state.
 *  - canUndo: A boolean indicating if an undo operation is possible.
 *  - resetState: A function to set a new state and clear the history.
 */
export const useFormWithHistory = <T,>(initialState: T) => {
  const [state, setStateInternal] = useState(initialState);
  const [history, setHistory] = useState<T[]>([]);

  const setState = useCallback((newState: React.SetStateAction<T>) => {
    setStateInternal(prevState => {
      // Add the current state to history before updating
      setHistory(prevHistory => {
        const newHistory = [prevState, ...prevHistory];
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.pop();
        }
        return newHistory;
      });

      if (typeof newState === 'function') {
        return (newState as (prevState: T) => T)(prevState);
      }
      return newState;
    });
  }, []);

  const undo = useCallback(() => {
    if (history.length > 0) {
      const [previousState, ...restOfHistory] = history;
      setHistory(restOfHistory);
      setStateInternal(previousState);
    }
  }, [history]);

  const resetState = useCallback((newState: T) => {
      setStateInternal(newState);
      setHistory([]);
  }, []);

  const canUndo = history.length > 0;

  return [state, setState, undo, canUndo, resetState] as const;
};
