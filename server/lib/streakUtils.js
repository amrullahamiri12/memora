/** UTC calendar-day streak from practice date strings (YYYY-MM-DD). */
function calculateStreakFromDateStrings(dateStrings) {
  if (!dateStrings?.length) return 0;

  const dateSet = new Set(dateStrings.map((d) => String(d).slice(0, 10)));

  const today = new Date();
  let streak = 0;
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

module.exports = { calculateStreakFromDateStrings };
