# Specification

## Summary
**Goal:** Add a light/dark theme toggle to the app header and replace the OCR result "No" text with a "Coming Soon" message on the Timetable Upload page.

**Planned changes:**
- Add a sun/moon icon toggle button in the top-right area of the app header, visible on all pages
- Wire the toggle to the existing ThemeProvider and CSS custom properties for light/dark modes
- Persist the selected theme in localStorage under the key `acadmind_theme` and restore it on page reload
- On the TimetableUpload page, replace the "No" result text shown after clicking "Extract Timetable" with a styled "Coming Soon" message

**User-visible outcome:** Users can switch between light and dark themes from any page and have their preference remembered across visits. When they click "Extract Timetable" on the OCR Upload page, they see a "Coming Soon" message instead of a "No" error text.
