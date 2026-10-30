/* Paste your Firebase web app config here (Firebase console > Project settings > Your apps > Web app).
   These values are NOT secret: the security rules (firestore.rules) protect the data. */
export const firebaseConfig = {
  apiKey: 'AIzaSyChRw9OJY6qI8CvzW-TVf3FPfgS_EyF03Y',
  authDomain: 'shift-welfare.firebaseapp.com',
  projectId: 'shift-welfare',
  appId: '1:985338332905:web:29552270bd7af7d8a55278',
  messagingSenderId: '985338332905'   /* the project number: the number after the first colon of appId; phone push needs it */
};
/* The president: always allowed in, can invite admins and users. Must match firestore.rules. */
export const president = 'akeem.silver09@gmail.com';
/* Real phone push (works with the app closed). Fill these in after the push Worker is set up (push/README.md), these are filled in. */
export const pushUrl = 'https://shift-welfare-push.akeem-silver09.workers.dev';
export const vapidKey = 'BHT-cBo-MOjf7BpXozmBlUFt5FZ35BbKHZGp7W-DfreS3FCUSKg1_tTRMZQdQeBZO2jwAXLuORGOhJmv7ls8cOc';
