import { format } from 'date-fns';

export function date() {
    return new Date().toISOString();
};

export function month(date: string) {
  const dateObj = new Date(date);

  // dateObj.getMonth() + 1;

  return dateObj.toLocaleString('default', { month: 'long' });
}

export function timeZone() {
  return  Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export function formatDate() {
    return new Date().toLocaleString('en-US', {
      timeZone: timeZone(),
      year: 'numeric',
      month: 'long', // 'numeric', '2-digit', 'short'
      day: 'numeric',
      hour12: true // true for AM/PM, false for 24-hour
    });
  };

  export function useFormatDate(date: any) {
    return date.toLocaleString('en-US', {
      timeZone: timeZone(),
      year: 'numeric',
      month: 'long', // 'numeric', '2-digit', 'short'
      day: 'numeric',
      hour12: true // true for AM/PM, false for 24-hour
    });
  };

  // Convert date to '@internationalized/date' for nuxt
  // If not date is brought back from the db, we use today's date
  export function yearMonthDayFormat(date: string) {
    const useDate = date || new Date();
    const dateObject = new Date(useDate);
    const isMonth = format(dateObject, 'MM');
    const isDay = format(dateObject, 'dd')
    const isYear = format(dateObject, 'yyyy')

    return {
      month: Number(isMonth),
      day: Number(isDay),
      year: Number(isYear)
    }
  }

