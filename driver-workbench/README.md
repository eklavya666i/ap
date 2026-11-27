# Driver Workbench

Weekly driver analysis for two golfers from GSPro shot exports. It is one app with two views:

- **Import station**: on the Windows PC that runs GSPro. Drop exports here.
- **Analysis**: on the iPad, by player. Dashboards, consistency, a realistic outlook, topics, history and the backlog.

The app is a Claude artifact. It runs inside Claude (the Windows desktop app, the iPad app or claude.ai) and keeps its data in the artifact's own database on the owner's Claude account. This folder, `driver-workbench/` in the [eklavya666i/ap](https://github.com/eklavya666i/ap) repository, holds its source. Unlike the other apps there, it isn't run from that repository's GitHub Pages site.

Live app: **Driver Workbench** in the owner's Claude artifacts (private to the owner).

## Install

### Windows PC with GSPro: the import station

1. Install the Claude desktop app for Windows from https://claude.ai/download and sign in with the account that owns the workbench.
2. In the desktop app, open the Driver Workbench: from the chat it was built in, or from your artifacts.
3. Click **Install as desktop app** at the top of the page (or choose **Install as app** from the artifact's menu) and confirm.
4. The workbench opens in its own window with its own icon, in the **Import** view. Pin it to the taskbar.

The installed app asks for no access to your disk: it reads only the files you drop on it or pick.

### Mac

1. Install the Claude desktop app for Mac from https://claude.ai/download and sign in with the same account.
2. Open the Driver Workbench and click **Install as desktop app** (or **Install as app** from the artifact's menu).
3. It opens in its own window. Switch to **Analysis** at the top right; the Mac remembers the choice.

To keep the code on the Mac: `git clone https://github.com/eklavya666i/ap.git` in Terminal (or *Clone repository* in GitHub Desktop, with `eklavya666i/ap`). The workbench is in `ap/driver-workbench`; `git pull` inside `ap` brings later changes.

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
- Rows the importer skips (summary rows, rows without a ball speed) are listed in the preview with their line and reason.
- **Undo this import** removes the sessions of the most recent import, for two hours after it.
- Sessions already saved are **skipped**, so dropping the same folder twice is safe. They are matched by their shots as well as their date, so sessions saved before dates were read from GSPro file names are recognized too, and get their original files attached.
- Every row of the preview can be changed before saving. After saving, a session's week can be changed, or the session removed, under **Imported files**.

## Golfer settings

On the import station, under **Golfer settings**:

- **Monday of week 1**: sets the week numbers.
- **Typical driver club speed**: used for sorting. Leave it blank to learn it from saved files. Set it when the two golfers' speeds are within about 6 mph of each other.
- **Add golfer**: up to 8.

## What the analysis shows

- **Dashboard**: weekly trends for club speed, ball speed, smash, launch, spin and carry, with the spread of shots in each week and target windows; where drives land, with a ring holding about 86% of drives; shot shape and delivery (start direction, curve, face, path, attack angle, peak height, descent); golfers side by side.
- **Whole bag**: every club from the saved sessions (latest week, last 4 or 12 weeks, or all history): carry with its spread, total, speeds, smash, launch, spin, peak height and offline spread, plus a gapping chart that flags gaps under 7 yards, over 18 (25 around the woods), or clubs that carry farther than the next one up.
- **Consistency**: spread of each imported week, the share of shots at the target smash, and smash shot by shot.
- **Check**: whether ball speed ÷ club speed matches the device's smash.
- **Realistic look** and **Outlook**: carry and total from a ball-flight model calibrated to TrackMan data, step by step (strike, attack angle, speed), and the speed outlook with a range.
- **Shots**: drill down from the golfer to a week, a session and one shot; the inspector shows every field, whether the shot counts, the line it came from in the GSPro file, and a side view of its flight.
- **Rounds**: notes from rounds and practice rounds, made for the phone: ratings for driving, approach, short game, putting and the mental game, what happened, what to work on, voice notes (Claude dictation where the device offers it, else the keyboard's mic) and a scorecard photo that Claude can read into hole-by-hole scores to check and save.
- **Topics**, **History**, **Log a week by hand**, **Data to capture**, **Benchmarks**, **Backlog**.

Launch and spin targets follow each golfer's own club speed: the model's best launch and spin at that speed, the target smash and the target attack angle, widened to a window.

## Data and privacy

- Files are read on the device. Each session's parsed shots and its original CSV lines are stored.
- Data lives in the artifact's database on the owner's Claude account. The rule `read: view, write: owner` lets only the owner add or change data; anyone the owner shares the workbench with can only read it.
- Every club and every shot of each session is kept, so the whole-bag view and later versions can analyze all clubs from the same history.
- **Copy this golfer's shots as CSV** (import station, under Imported files) copies every saved shot to the clipboard as a backup a spreadsheet can open.

How GSPro data is read:

- Columns a monitor fills with zeros for a club (attack angle, club path, face, dynamic loft when it reads no club data) count as not measured.
- GSPro's peak height is in feet; it is stored and shown in yards.
- The date comes from a date column, else the file name (GSPro names exports `gspro-exportMM-DD-YY-hh-mm-ss.csv`), else the file's save time.

Database layout:

| Path | Holds |
| --- | --- |
| `config/golfers` | Golfer list: id, name, week-1 Monday, typical driver speed |
| `config/conditions` | GSPro's conditions profile: altitude and elevation mode, temperature, fairway and green firmness, Use LM Carry, indoor or outdoor, ball. Until set, the SLC preset (4,450 ft) is assumed; each new session also records the conditions it was hit in |
| `golfers/{id}/sessions/{session}` | One GSPro session: date, week, file, driver label, all shots of all clubs (`shots_json`), a summary, a fingerprint for duplicates |
| `golfers/{id}/raw/{session}` | The session's original CSV header and lines (`-p2`, `-p3`… when longer than 200,000 characters); never loaded by the analysis |
| `golfers/{id}/weeks/w{NN}` | A week typed by hand: averages, conditions, notes |
| `golfers/{id}/sessions/{session}` → `tags` | Optional list of shot ranges with drill, swing length, tee height, intent and target |
| `golfers/{id}/rounds/{round}` | A round's notes: date, course, kind, score, ratings, what happened, what to work on, hole-by-hole scores, and the scorecard photo's asset id (the photo itself is an artifact asset, never in git) |
| `backlog/{id}` | Backlog items: title, area, priority, status |

## Keeping history safe as the app is upgraded

- **Upgrades never touch the data.** Each upgrade publishes a new version of the same Claude artifact; its database stays as it is. Only deleting the artifact would erase it, so it is never deleted or replaced by a new artifact.
- **Everything is kept at full detail.** Each session stores every club and every shot. From this version on it also keeps the session's original CSV lines (`golfers/{id}/raw/{session}`), so later features can read columns the app doesn't use yet, such as course, hole and round data.
- **Older sessions can get their originals too.** Sessions saved before originals were kept show as already saved; dropping the same export folders again attaches the original lines to them, without duplicating anything.
- **Backups.** On the import station, *Backup and restore* copies everything as one JSON file (golfers, typed weeks, sessions, backlog). Restoring adds only what is missing and never overwrites. Keep a recent backup and the GSPro export folders together.

Rules every upgrade follows (for whoever changes the code, including Claude):

1. Never rename or remove a stored field, and never rewrite stored documents to a new shape. Add new fields as optional.
2. Readers handle every older document shape. Today's differences: schema 1 sessions have no `schema`, `peak_unit` or `has_raw`; their peak height is in feet, and monitors' zero-filled club data counts as not measured.
3. New documents carry `schema: 2` (raise it when the shape changes, and add the reader for it here).
4. Run `npm test` in `tests/` before publishing. It checks importing, sorting, attaching originals, backup and restore, and the analysis on sample data.

## Layout of this folder

```
app/
  index.html    page structure for both views
  style.css     styles, light and dark
  runtime.js    data store, drawing, Claude database, desktop install, views
  import.js     GSPro CSV reading, session split, sorting by club speed, saving
  app.js        analysis: weeks, checks, scenarios, dashboard, topics, settings
  model.js      ball-flight and roll model
  rounds.js     round notes, voice notes and scorecard photos
  shots.js      drill-down from golfer to week, session and shot, with the shot inspector
  goals.js      the goal tracker: 260 and long-and-straight, restated at sea level, and the club speed 260 needs
  calib.js      Calibration lab: the spin check per club, and the flight model fitted to GSPro's carry (used by the what-ifs)
  trust.js      data trust: what the monitor's data can be trusted for, with banners where spin or club data matter
  command.js    the Command center: what's happening, how it's moving, what needs to happen, the week's fairway, alerts
tests/
  workbench.test.js   end-to-end test in jsdom with an in-memory database
  sample-data/        synthetic GSPro range exports
```

## Updating the live app

Changes here don't reach the installed apps by themselves. The live app is published from `app/` to the Driver Workbench artifact: ask Claude to republish from this folder. Installed copies pick up the new version when they reload.

Opening `app/index.html` directly in a browser shows the page without saving, since the database exists only inside Claude.

## Tests

From the root of the `ap` repository:

```
cd driver-workbench/tests
npm install
npm test
```

`npm run samples` rewrites the synthetic files in `tests/sample-data/`.
