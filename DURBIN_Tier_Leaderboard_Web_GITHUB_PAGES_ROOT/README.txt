DURBIN Tier Leaderboard Web

How to use:
1. Open Firebase Console.
2. Project settings > Your apps > Add app > Web app.
3. Copy the Firebase config.
4. Open firebase-config.js and replace the config values.
5. Upload this folder to GitHub Pages, Netlify, or Vercel.

Firestore collection:
tier_assignments

Example document fields:
email: player@gmail.com
displayName: COSA
tier: LT1
tank: HT3
crystal: LT2
netpot: HT4
sword: LT3
axe: HT5
uhc: LT4
smp: HT2
pot: LT5
visible: true
note: Good player

Test Firestore rules:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tier_assignments/{tierId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
