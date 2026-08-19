PORTFOLIO AUTH + ABOUT PAGE FIX

Copy/extract this patch into the root of your portfolio-mysql folder and allow Windows to overwrite the matching files.

Changes:
1. /login redirects authenticated admins to /admin.
2. /register is inaccessible while already authenticated.
3. Successful direct admin login defaults to /admin instead of the public homepage.
4. Prevents auth return URLs from pointing back to /login or /register.
5. About profile image is capped to a smaller width on phone/tablet screens.
6. Biography content now wraps long words/URLs and cannot force the grid wider than the viewport.

After extraction, run:
  apply_auth_about_fix.bat

Or manually:
  npm run lint
  npm run build
  npm run dev

No database or .env changes are required.
