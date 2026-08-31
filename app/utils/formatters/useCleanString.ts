export function useCleanString(str: string) {
    // Removes everything that is NOT a letter or a number
    return str.replace(/[^a-zA-Z0-9]/g, "");
  };