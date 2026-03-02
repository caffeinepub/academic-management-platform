# Specification

## Summary
**Goal:** Add a summary statistics panel to the Day Tracker page showing all-time, weekly, and daily hours and minutes.

**Planned changes:**
- Add a stats panel at the top of `DayTracker.tsx` (above the entry list) with four metric cards: "All Days Hours", "This Week Hours", "Today Hours", and "Today Minutes"
- Compute each metric from the existing namespaced localStorage entries using date-fns or dayjs for date/week boundary calculations
- Ensure all four values update immediately when entries are added, edited, or deleted
- Style the panel consistently with the existing teal/slate-green theme, fully responsive

**User-visible outcome:** Users visiting the Day Tracker page will see four stat cards at the top displaying their total logged hours across all time, the current week, today, and today's hours converted to minutes — all updating in real time as entries change.
