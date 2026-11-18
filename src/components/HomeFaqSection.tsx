import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Comment le SEO aide-t-il une boutique e-commerce à vendre sans dépendre de la publicité ?',
    answer:
      'Contrairement aux annonces payantes qui s’arrêtent dès que le budget est coupé, le référencement naturel positionne vos pages catégories et fiches produits durablement sur Google. Chaque visiteur issu d’une requête d’achat arrive avec une intention précise et un coût d’acquisition marginal décroissant dans le temps.',
  },
  {
    question: 'Que faut-il optimiser en priorité sur Shopify, WooCommerce ou PrestaShop ?',
    answer:
      'Commencez par trois leviers à fort impact : 1) des balises Title et H1 orientées intention d’achat sur vos collections principales, 2) un texte descriptif de 250 à 400 mots sous la grille produits de chaque catégorie, et 3) le contrôle des URLs générées par les filtres et la pagination pour éviter le contenu dupliqué.',
  },
  {
    question: 'Pourquoi cibler des mots-clés transactionnels plutôt que des requêtes génériques ?',
    answer:
      'Un internaute qui tape « acheter savon surgras bio » ou « meilleur café en grain livraison 24h » est prêt à commander. Ces requêtes de longue traîne sont moins concurrentielles que les mots-clés génériques à un mot et convertissent généralement deux à trois fois mieux.',
  },
  {
    question: 'Que se passe-t-il si ma boutique est récente ou bloque les robots d’analyse ?',
    answer:
      'Même si votre boutique est en cours de lancement ou protégée contre le crawl direct, l’audit reste exploitable : il génère automatiquement 10 à 14 mots-clés transactionnels à partir de votre mot-clé principal, de votre niche et de votre pays, ainsi qu’un plan d’action adapté à votre CMS.',
  },
  {
    question: 'Comment analyser mes données Google Search Console sans connexion API complexe ?',
    answer:
      'Exportez simplement vos rapports Requêtes ou Pages au format CSV depuis Google Search Console (ou copiez vos totaux manuellement) dans l’onglet Search Console. Aucune clé API ni autorisation OAuth n’est nécessaire : l’outil détecte vos pages à fort potentiel de CTR et propose 6 à 8 actions concrètes.',
  },
  {
    question: 'Mes brouillons de fiches produits et mes audits sont-ils sauvegardés avant export ?',
    answer:
      'Oui. Vos formulaires, contenus générés et résultats d’audit sont enregistrés automatiquement en local dans votre navigateur (LocalStorage). Vous pouvez modifier vos textes, recharger la page et exporter votre travail en PDF ou HTML à tout moment.',
  },
];

export const HomeFaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      aria-labelledby="home-faq-title"
      data-testid="home-faq-section"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2
          id="home-faq-title"
          className="text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl"
        >
          Questions fréquentes (FAQ) — Conseils SEO E-Commerce
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Les réponses essentielles pour démarrer sereinement l’optimisation de votre boutique en ligne.
        </p>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {HOME_FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          const panelId = `home-faq-panel-${idx}`;
          return (
            <div key={item.question} className="py-1">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-teal-700 dark:hover:text-teal-400"
              >
                <span>{item.question}</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                )}
              </button>
              {isOpen && (
                <div
                  id={panelId}
                  className="pb-4 pr-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
