import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, collection, query, where, getDocs } from '../firebase';
import { Rocket, ShieldCheck, Users, ArrowRight, Loader2, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  user: any;
  distributor: any;
}

export default function Home({ user, distributor: currentDistributor }: HomeProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [distributor, setDistributor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ref = searchParams.get('ref');

  useEffect(() => {
    const fetchDistributor = async () => {
      if (!ref) {
        setLoading(false);
        return;
      }

      try {
        // Find distributor by smartCode
        const q = query(collection(db, 'distributors'), where('smartCode', '==', ref));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setDistributor(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching distributor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistributor();
  }, [ref]);

  const handleOnboardingClick = () => {
    if (currentDistributor) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1 bg-primary-container/10 border border-primary-container/20 rounded-full text-primary-container text-[10px] font-bold uppercase tracking-[0.3em]"
        >
          Neo Digital Startup Academy
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-primary leading-[1.1] relative inline-block"
        >
          <span className="relative z-10">VOTRE VITALITÉ</span> <br /> 
          <span className="text-primary-container relative z-10">OPTIMISÉE PAR L'IA</span>
          <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-full -z-0 opacity-50" />
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-on-surface-variant max-w-2xl mx-auto text-lg font-light leading-relaxed"
        >
          GMBC-OS : Le système d'intelligence commerciale avancée pour les distributeurs NeoLife et leurs clients.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <button 
            onClick={() => navigate('/coach' + (ref ? `?ref=${ref}` : ''))}
            className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-label font-bold uppercase tracking-widest rounded shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            Consulter Coach José <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={handleOnboardingClick}
            className="px-8 py-4 border border-outline-variant/30 text-primary font-label font-bold uppercase tracking-widest rounded hover:bg-surface-container transition-all"
          >
            {currentDistributor ? 'Mon Dashboard' : 'Devenir Distributeur'}
          </button>
        </motion.div>
      </section>

      {/* Distributor Info (if ref exists) */}
      {distributor && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-low p-8 rounded-xl border border-primary-container/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-24 h-24 text-primary-container" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center border-2 border-primary-container shadow-[0_0_20px_rgba(0,242,255,0.2)]">
              <span className="text-2xl font-black text-primary-container">{distributor.name[0]}</span>
            </div>
            <div className="text-center md:text-left">
              <p className="font-label text-[10px] text-primary-container tracking-[0.2em] uppercase mb-1">Votre Conseiller Dédié</p>
              <h3 className="font-headline text-2xl font-bold text-primary">{distributor.name}</h3>
              <p className="text-on-surface-variant text-sm italic">"Je vous accompagne dans votre parcours de santé NeoLife."</p>
            </div>
            <div className="ml-auto flex gap-3">
              <a 
                href={`https://wa.me/${distributor.whatsapp.replace(/\+/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#25D366] text-white rounded font-label text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
              >
                WhatsApp
              </a>
              <a 
                href={distributor.shopUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-primary-container text-on-primary rounded font-label text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Boutique
              </a>
            </div>
          </div>
        </motion.section>
      )}

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container p-8 rounded-lg border border-outline-variant/10 space-y-4 hover:border-primary-container/30 transition-all">
          <div className="w-12 h-12 bg-primary-container/10 rounded flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary-container" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary uppercase">Smart Cloning</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Clonez votre écosystème de vente en 30 secondes. Un lien unique pour tout votre business.
          </p>
        </div>
        <div className="bg-surface-container p-8 rounded-lg border border-outline-variant/10 space-y-4 hover:border-primary-container/30 transition-all">
          <div className="w-12 h-12 bg-primary-container/10 rounded flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary-container" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary uppercase">IA Coach José</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Un assistant expert NeoLife disponible 24/7 pour conseiller vos prospects et conclure vos ventes.
          </p>
        </div>
        <div className="bg-surface-container p-8 rounded-lg border border-outline-variant/10 space-y-4 hover:border-primary-container/30 transition-all">
          <div className="w-12 h-12 bg-primary-container/10 rounded flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-container" />
          </div>
          <h3 className="font-headline text-lg font-bold text-primary uppercase">Gestion de Leads</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Suivez vos prospects en temps réel et recevez des résumés détaillés de leurs besoins.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-headline font-bold text-primary uppercase">Comment ça marche ?</h2>
          <p className="text-on-surface-variant">Trois étapes simples pour transformer votre activité NeoLife.</p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant/20 -translate-y-1/2 z-0"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {[
              { step: '01', title: 'Onboarding', desc: 'Inscrivez-vous et configurez vos liens NeoLife et WhatsApp.' },
              { step: '02', title: 'Partagez', desc: 'Utilisez votre SmartLink unique sur les réseaux sociaux.' },
              { step: '03', title: 'Vendez', desc: 'Coach José gère les questions, vous gérez les commandes.' }
            ].map((item, i) => (
              <div key={i} className="bg-background p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary-container text-on-primary rounded-full flex items-center justify-center mx-auto text-2xl font-black font-headline shadow-lg">
                  {item.step}
                </div>
                <h4 className="font-headline font-bold text-primary uppercase">{item.title}</h4>
                <p className="text-sm text-on-surface-variant">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SmartLink Preview */}
      <section className="py-20 px-6 bg-surface-container-highest/30">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Votre SmartLink est prêt.</h2>
            <p className="text-outline">Partagez ce lien et laissez l'IA faire le reste.</p>
          </div>
          
          <div className="max-w-xl mx-auto p-2 bg-surface-container rounded-2xl border border-outline-variant/20 flex items-center gap-4 shadow-xl">
            <div className="flex-1 px-4 text-left font-mono text-xs text-primary truncate">
              {window.location.origin}/?ref=VOTRE_CODE
            </div>
            <button className="px-6 py-3 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest">
              Copier
            </button>
          </div>
        </div>
      </section>

      {/* Automation Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                <Zap className="w-3 h-3" />
                Automatisation Totale
              </div>
              <h2 className="text-4xl font-display font-black uppercase tracking-tighter leading-none">
                Dupliquez votre succès <span className="text-primary">sans effort.</span>
              </h2>
              <p className="text-outline leading-relaxed">
                GMBC-OS n'est pas juste un outil, c'est votre clone numérique. Il qualifie vos prospects, les éduque sur les produits NeoLife et vous dit exactement quand conclure la vente.
              </p>
              <ul className="space-y-4">
                {[
                  "Lead Scoring intelligent par IA",
                  "Relances WhatsApp générées automatiquement",
                  "Onboarding automatisé pour vos recrues",
                  "Analyses prédictives de croissance"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
              <div className="relative bg-surface-container border border-outline-variant/20 rounded-3xl p-8 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">J</div>
                    <div>
                      <p className="text-xs font-bold">José (IA)</p>
                      <p className="text-[8px] text-outline uppercase tracking-widest">Analyse en cours...</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-tighter">
                    Lead Score: 98%
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-surface-container-highest rounded-xl text-xs italic text-outline">
                    "Ce prospect est prêt à commander le Pack Vitalité. J'ai préparé votre message de relance."
                  </div>
                  <button className="w-full py-3 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                    Envoyer la Relance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Duplication Section */}
      <section className="py-20 px-6 bg-surface-container-low">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-black uppercase tracking-tighter">La Duplication <span className="text-primary">Instantanée.</span></h2>
            <p className="text-outline">Recrutez un nouveau distributeur et offrez-lui son propre GMBC-OS en 60 secondes.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Onboarding IA", desc: "José forme vos recrues sur les produits NeoLife automatiquement." },
              { title: "Scripts Partagés", desc: "Partagez vos meilleurs scripts de vente avec toute votre équipe." },
              { title: "Suivi de Groupe", desc: "Visualisez la croissance de votre réseau en temps réel." }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-surface-container rounded-3xl border border-outline-variant/10 text-left space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{i+1}</div>
                <h4 className="font-bold uppercase tracking-tight">{item.title}</h4>
                <p className="text-xs text-outline leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-6 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-1 bg-primary rounded-full" />
            <h2 className="text-3xl font-display font-black uppercase tracking-tighter">Impact Réel</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 bg-surface-container rounded-3xl border border-outline-variant/10"
            >
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Sparkles key={i} className="w-4 h-4 text-primary" />)}
              </div>
              <p className="text-lg italic mb-6">"Grâce au SmartLink, j'ai capturé 45 prospects en une semaine sans rien faire. José a fait tout le travail de pré-vente !"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">JD</div>
                <div>
                  <h4 className="font-bold">Jean-Daniel B.</h4>
                  <p className="text-sm text-outline">Distributeur Pro, Bénin</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 bg-surface-container rounded-3xl border border-outline-variant/10"
            >
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Sparkles key={i} className="w-4 h-4 text-primary" />)}
              </div>
              <p className="text-lg italic mb-6">"Le tableau de bord est incroyable. Je sais exactement qui appeler et quels produits ils veulent. Mon chiffre d'affaires a doublé."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary">SM</div>
                <div>
                  <h4 className="font-bold">Sarah M.</h4>
                  <p className="text-sm text-outline">Distributeur Basic, Togo</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-black uppercase tracking-tighter">Choisissez votre <span className="text-primary">Puissance.</span></h2>
            <p className="text-outline">Des outils adaptés à chaque étape de votre croissance NeoLife.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="p-8 bg-surface-container rounded-3xl border border-outline-variant/10 space-y-6">
              <div className="space-y-2">
                <h4 className="text-xl font-bold uppercase">Basic</h4>
                <p className="text-4xl font-display font-black">GRATUIT</p>
              </div>
              <ul className="text-left space-y-3 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 1 SmartLink</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Coach José (Texte)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Dashboard Prospects</li>
              </ul>
              <button className="w-full py-4 border border-primary text-primary rounded-xl font-black uppercase tracking-widest">Commencer</button>
            </div>
            
            <div className="p-8 bg-primary text-on-primary rounded-3xl shadow-2xl shadow-primary/20 space-y-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-on-primary text-primary text-[8px] font-black px-2 py-1 rounded-full uppercase">Populaire</div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold uppercase">Pro</h4>
                <p className="text-4xl font-display font-black">29€<span className="text-sm font-normal">/mois</span></p>
              </div>
              <ul className="text-left space-y-3 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> SmartLinks Illimités</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Coach José (Voix + Stratégie)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Lead Scoring IA</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Relances Automatisées</li>
              </ul>
              <button className="w-full py-4 bg-on-primary text-primary rounded-xl font-black uppercase tracking-widest">Passer Pro</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-container/5 border border-primary-container/20 rounded-3xl p-12 text-center space-y-8">
        <h2 className="text-4xl font-headline font-bold text-primary uppercase leading-tight">
          Prêt à passer au <span className="text-primary-container">niveau supérieur ?</span>
        </h2>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          Rejoignez la Neo Digital Startup Academy et commencez à utiliser GMBC-OS dès aujourd'hui.
        </p>
        <button 
          onClick={handleOnboardingClick}
          className="px-12 py-5 bg-primary-container text-on-primary font-label font-bold uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 transition-all"
        >
          {currentDistributor ? 'Mon Dashboard' : 'Commencer Maintenant'}
        </button>
      </section>
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-outline-variant/10 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 font-display font-black text-xl tracking-tighter">
          <Rocket className="w-6 h-6 text-primary" />
          GMBC-OS
        </div>
        <p className="text-[10px] text-outline uppercase tracking-widest font-bold">
          © 2026 Global Multi-Level Marketing Business Core Optimization System.
        </p>
        <div className="flex justify-center gap-6 text-[8px] font-black uppercase tracking-tighter text-outline">
          <a href="#" className="hover:text-primary transition-colors">Conditions</a>
          <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
