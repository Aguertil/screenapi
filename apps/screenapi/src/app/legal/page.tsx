import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Legal notice' };

export default function Legal() {
  return (
    <LegalPage title="Legal notice" updated="20 November 2026">
      <h2>Publisher</h2>
      <p>
        <strong>{COMPANY.name}</strong>, {COMPANY.form}, share capital {COMPANY.capital}.<br />
        Registered office: {COMPANY.address}.<br />
        {COMPANY.registration}. VAT number: {COMPANY.vat}.<br />
        Publication director: {COMPANY.director}.<br />
        Contact: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </p>
      <h2>Hosting</h2>
      <p>{COMPANY.host}.</p>
      <h2>Mentions légales (français)</h2>
      <p>
        Le site ScreenAPI est édité par {COMPANY.name}, {COMPANY.form} au capital de 500 €, dont le siège est situé {COMPANY.address},
        immatriculée sous le numéro {COMPANY.registration}, TVA {COMPANY.vat}. Directeur de la publication : Mohamed Baabouz, Président.
        Hébergeur : {COMPANY.host}.
      </p>
    </LegalPage>
  );
}
