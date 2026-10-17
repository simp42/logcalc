# LogCalc

A quick-entry calculator for adding up flight time, block time and landings from a pilot or aircraft logbook. Built with React and Vite, installable as a PWA, and usable offline.

## Using it

- **Time mode:** type digits as `H…HMM`: `120` → 1:20, `1230` → 12:30. Minutes of 60 or more carry into hours (`95` → 1:35). The total is also shown in decimal hours.
- **Landings mode:** type the count.
- **Duration mode:** type a start and end clock time (off/on block, or takeoff/landing) as `HHMM`, e.g. `0815` then `1032` → 2:17. After four digits it moves to the end time on its own; for three-digit times like `815`, press **Next**. An end time earlier than the start counts as the next day (`2250` → `0115` = 2:25). Each leg is added to the list with its times, so several legs can be totalled. Tap *From* or *To* to correct either field.
- **Enter** adds the entry. Each row shows a running total on the right so you can check against logbook page subtotals.
- **Tap a row** to edit it (the button changes to *Update*); **C** cancels the edit.
- **Swipe a row left** to delete it; swipe all the way across to delete at once. **Undo** appears after a delete or *Clear All*.
- Each mode keeps its own list, and both are saved on the device, so closing the app loses nothing.
- Hardware keyboard: digits, `Backspace`, `Enter` (or `+`/`=`), `Esc`/`C` to clear, `Tab`/`Shift+Tab` to switch between *From* and *To*.

Phones get a single column (list on top, keypad at the bottom). iPad landscape, and other wide screens, put the keypad on the left and the list on the right.

## Development

```sh
npm install
npm run dev      # dev server
npm test         # unit tests for the time arithmetic
npm run build    # production build in dist/
```

## Deploying and installing

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. Enable it once under **Settings → Pages → Source: GitHub Actions**. The app is then served at `https://<user>.github.io/logcalc/`.

To install on iPhone or iPad, open the URL in Safari, tap **Share → Add to Home Screen**. The app runs full-screen and works offline after the first load.
