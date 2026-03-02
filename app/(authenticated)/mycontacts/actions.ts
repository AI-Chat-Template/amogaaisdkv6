"use server";

// Type for state
interface State {
  value: string;
  label: string;
}

// Type for states data: a record where keys are country codes and values are arrays of states
type StatesData = Record<string, State[]>;

import statesData from '../../../data/states.json';

// Get states based on country
export async function getStates(countryCode: string): Promise<State[]> {
  console.log("countryCode:: ", countryCode);
  const typedStatesData: StatesData = statesData;

  return new Promise<{ value: string; label: string }[]>((resolve, reject) => {
    setTimeout(() => {
      const states = typedStatesData[countryCode];
      if (states) {
        resolve(states);
      } else {
        reject("States not found for country");
      }
    }, 1000); // Simulate network delay
  });
}