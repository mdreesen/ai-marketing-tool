export function capitalizeFirstLetter(str: string) {
    if (!str) return ""; // Handle empty strings safely
    return str.charAt(0).toUpperCase() + str.slice(1);
  }