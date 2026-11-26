# Driver Workbench

Weekly driver analysis for two golfers from GSPro shot exports. It is one app with two views:

- **Import station**: on the Windows PC that runs GSPro. Drop exports here.
- **Analysis**: on the iPad, by player. Dashboards, consistency, a realistic outlook, topics, history and the backlog.

The app is a Claude artifact. It runs inside Claude (the Windows desktop app, the iPad app or claude.ai) and keeps its data in the artifact's own database on the owner's Claude account. This repository holds its source.

Live app: **Driver Workbench** in the owner's Claude artifacts (private to the owner).

## Install

### Windows PC with GSPro: the import station

1. Install the Claude desktop app for Windows from https://claude.ai/download and sign in with the account that owns the workbench.
2. In the desktop app, open the Driver Workbench: from the chat it was built in, or from your artifacts.
3. Click **Install as desktop app** at the top of the page (or choose **Install as app** from the artifact's menu) and confirm.
4. The workbench opens in its own window with its own icon, in the **Import** view. Pin it to the taskbar.

The installed app asks for no access to your disk: it reads only the files you drop on it or pick.

### iPad: analysis

1. Install the Claude app from the App Store and sign in with the same account.
2. Open the Driver Workbench from the same chat or from your artifacts.
3. It opens in the **Analysis** view. Pick the golfer at the top.

Both devices read the same data. An import on the PC shows on the iPad within seconds, or within about half a minute when the live connection falls back to refreshing. The switch at the top right changes view on either device.

## Weekly use

1. In GSPro's Practice Range, open the shot list with the clipboard icon at the top left and choose **Export CSV**. Save each golfer's files in their own folder.
2. On the PC, drag the week's files onto **Sort by club speed**, or onto a golfer's card when you know whose they are.
3. Check the preview, then **Save**.

## Loading history

Drop any number of older exports at once (up to 300 files per drop):

- Files are split into **sessions by date**, from a date column in the file, or a date in the file name, or else the day the file was saved. Sessions dated only by the file's save time are marked with `*` in the preview; check their weeks.
- Each session goes to a golfer by **driver club speed**: the faster golfer's typical speed is learned from their saved data, and the other golfer's from the files. A session where both hit is **split shot by shot**. Other clubs are matched using tour-average speed ratios.
- **Weeks** are counted from each golfer's week 1. Sessions before week 1 get week 0 or below.
- Sessions already saved are **skipped**, so dropping the same folder twice is safe.
- Every row of the preview can be changed before saving. After saving, a session's week can be changed, or the session removed, under **Imported files**.

## Golfer settings

On the import station, under **Golfer settings**:

- **Monday of week 1**: sets the week numbers.
- **Typical driver club speed**: used for sorting. Leave it blank to learn it from saved files. Set it when the two golfers' speeds are within about 6 mph of each other.
- **Add golfer**: up to 8.

## What the analysis shows

- **Dashboard**: weekly trends for club speed, ball speed, smash, launch, spin and carry, with the spread of shots in each week and target windows; where drives land, with a ring holding about 86% of drives; shot shape and delivery (start direction, curve, face, path, attack angle, peak height, descent); golfers side by side.
- **Consistency**: spread of each imported week, the share of shots at the target smash, and smash shot by shot.
- **Check**: whether ball speed ÷ club speed matches the device's smash.
- **Realistic look** and **Outlook**: carry and total from a ball-flight model calibrated to TrackMan data, step by step (strike, attack angle, speed), and the speed outlook with a range.
- **Topics**, **History**, **Log a week by hand**, **Data to capture**, **Benchmarks**, **Backlog**.

Launch and spin targets follow each golfer's own club speed: the model's best launch and spin at that speed, the target smash and the target attack angle, widened to a window.

## Data and privacy

- Files are read on the device. Only the parsed shot numbers are stored.
- Data lives in the artifact's database on the owner's Claude account. The rule `read: view, write: owner` lets only the owner add or change data; anyone the owner shares the workbench with can only read it.
- Every club and every shot of each session is kept, so later versions can analyze all clubs from the same history.

Database layout:

| Path | Holds |
| --- | --- |
| `config/golfers` | Golfer list: id, name, week-1 Monday, typical driver speed |
| `golfers/{id}/sessions/{session}` | One GSPro session: date, week, file, driver label, all shots of all clubs (`shots_json`), a summary, a fingerprint for duplicates |
| `golfers/{id}/weeks/w{NN}` | A week typed by hand: averages, conditions, notes |
| `backlog/{id}` | Backlog items: title, area, priority, status |

## Repository layout

```
app/
  index.html    page structure for both views
  style.css     styles, light and dark
  runtime.js    data store, drawing, Claude database, desktop install, views
  import.js     GSPro CSV reading, session split, sorting by club speed, saving
  app.js        analysis: weeks, checks, scenarios, dashboard, topics, settings
  model.js      ball-flight and roll model
tests/
  workbench.test.js   end-to-end test in jsdom with an in-memory database
  sample-data/        synthetic GSPro range exports
```

## Updating the live app

Changes here don't reach the installed apps by themselves. The live app is published from `app/` to the Claude artifact above: ask Claude to republish from this repository. Installed copies pick up the new version when they reload.

Opening `app/index.html` directly in a browser shows the page without saving, since the database exists only inside Claude.

## Tests

```
cd tests
npm install
npm test
```

`npm run samples` rewrites the synthetic files in `tests/sample-data/`.
