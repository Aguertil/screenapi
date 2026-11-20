import { redirect } from 'next/navigation';

// L'essai en direct est sur la page d'accueil
export default function Playground() {
  redirect('/#try');
}
