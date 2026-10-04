# Campus Referral Console

A browser-only prototype for the NxtWave Growth Challenge. It demonstrates a campus connector kit, attribution link, student registration, duplicate detection, eligibility handling and an operator dashboard.

## Run locally

From this directory:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`. The prototype persists demo actions in browser storage. Use **Reset demo data** in the sidebar to restore the seeded state.

## Demo sequence

1. Open **Connectors** and select **Open kit** for Priya Sharma.
2. Copy the tracked link or choose **Preview student experience**.
3. Register `Demo Student` using `demo.student@example.com` and graduation year `2026`.
4. Return to **Overview** and show that the unique registration and connector total increased.
5. Submit again with the same email to show the duplicate protection. The gross number rises, but the unique total does not.

All records are synthetic and are held only in the visitor's browser. This is a simulation; it must be connected to NxtWave's approved registration system before it can process real registrations.
