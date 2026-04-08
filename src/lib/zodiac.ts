interface ZodiacInfo {
  sign: string;
  emoji: string;
  element: string;
  dateRange: string;
}

const ZODIAC_SIGNS: ZodiacInfo[] = [
  { sign: 'Capricorn', emoji: '\u2651', element: 'Earth', dateRange: 'Dec 22 - Jan 19' },
  { sign: 'Aquarius', emoji: '\u2652', element: 'Air', dateRange: 'Jan 20 - Feb 18' },
  { sign: 'Pisces', emoji: '\u2653', element: 'Water', dateRange: 'Feb 19 - Mar 20' },
  { sign: 'Aries', emoji: '\u2648', element: 'Fire', dateRange: 'Mar 21 - Apr 19' },
  { sign: 'Taurus', emoji: '\u2649', element: 'Earth', dateRange: 'Apr 20 - May 20' },
  { sign: 'Gemini', emoji: '\u264A', element: 'Air', dateRange: 'May 21 - Jun 20' },
  { sign: 'Cancer', emoji: '\u264B', element: 'Water', dateRange: 'Jun 21 - Jul 22' },
  { sign: 'Leo', emoji: '\u264C', element: 'Fire', dateRange: 'Jul 23 - Aug 22' },
  { sign: 'Virgo', emoji: '\u264D', element: 'Earth', dateRange: 'Aug 23 - Sep 22' },
  { sign: 'Libra', emoji: '\u264E', element: 'Air', dateRange: 'Sep 23 - Oct 22' },
  { sign: 'Scorpio', emoji: '\u264F', element: 'Water', dateRange: 'Oct 23 - Nov 21' },
  { sign: 'Sagittarius', emoji: '\u2650', element: 'Fire', dateRange: 'Nov 22 - Dec 21' },
];

export function getZodiacSign(month: number, day: number): ZodiacInfo {
  const zodiacDates = [
    [1, 20], [2, 19], [3, 21], [4, 20], [5, 21], [6, 21],
    [7, 23], [8, 23], [9, 23], [10, 23], [11, 22], [12, 22],
  ];

  for (let i = 0; i < zodiacDates.length; i++) {
    const [m, d] = zodiacDates[i];
    if (month === m && day < d) {
      return ZODIAC_SIGNS[i];
    }
    if (month === m && day >= d) {
      return ZODIAC_SIGNS[(i + 1) % 12];
    }
  }

  return ZODIAC_SIGNS[0]; // Capricorn fallback
}
