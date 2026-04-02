import React, { useState } from 'react';
import { db, doc, setDoc, auth } from '../firebase';
import { Rocket, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingProps {
  user: any;
  onComplete: (distributor: any) => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [formData, setFormData] = useState({
    name: user.displayName || '',
    whatsapp: '',
    shopUrl: '',
    category: 'Santé',
    plan: 'BASIC',
    paymentMethods: {
      mobileMoney: '',
      chariow: '',
      maketou: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [smartCode, setSmartCode] = useState('');

  const plans = [
    { id: 'BASIC', name: 'Basic', price: 'Gratuit', features: ['SmartLink IA', 'Dashboard Leads', 'Coach José'] },
    { id: 'PRO', name: 'Pro', price: '15.000 FCFA/mois', features: ['Tout du Basic', 'Analyses avancées', 'Support Prioritaire'] }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate a simple smart code from name + random
      const code = (formData.name.split(' ')[0] + Math.floor(Math.random() * 1000)).toLowerCase();
      
      const distributorData = {
        uid: user.uid,
        ...formData,
        smartCode: code,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'distributors', user.uid), distributorData);
      setSmartCode(code);
      setSuccess(true);
      onComplete(distributorData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10 text-primary-container" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold text-primary uppercase">Félicitations !</h2>
          <p className="text-on-surface-variant">Votre écosystème GMBC-OS est maintenant actif.</p>
        </div>
        
        <div className="bg-surface-container p-8 rounded-xl border border-primary-container/20 space-y-6">
          <div className="space-y-1">
            <p className="font-label text-[10px] text-primary-container tracking-[0.2em] uppercase">Votre SmartLink Unique</p>
            <div className="bg-surface-container-lowest p-4 rounded border border-primary-container/10 font-mono text-lg text-primary">
              {window.location.origin}/?ref={smartCode}
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full py-4 bg-primary-container text-on-primary font-label font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all"
          >
            Accéder au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-headline font-bold text-primary uppercase">Devenir Distributeur</h2>
        <p className="text-on-surface-variant">Configurez votre profil pour activer votre SmartLink intelligent.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-surface-container p-8 rounded-xl border border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">Nom Complet</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-surface-container-lowest border-outline-variant/30 rounded p-3 text-sm text-primary focus:ring-primary-container/50"
              placeholder="Ex: Jean Dupont"
            />
          </div>
          <div className="space-y-2">
            <label className="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">Numéro WhatsApp</label>
            <input 
              required
              value={formData.whatsapp}
              onChange={e => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full bg-surface-container-lowest border-outline-variant/30 rounded p-3 text-sm text-primary focus:ring-primary-container/50"
              placeholder="Ex: +2290195388292"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">Boutique NeoLife (URL)</label>
            <input 
              required
              value={formData.shopUrl}
              onChange={e => setFormData({...formData, shopUrl: e.target.value})}
              className="w-full bg-surface-container-lowest border-outline-variant/30 rounded p-3 text-sm text-primary focus:ring-primary-container/50"
              placeholder="Ex: https://shopneolife.com/votre_code"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">Catégorie</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full bg-surface-container-lowest border-outline-variant/30 rounded p-3 text-sm text-primary focus:ring-primary-container/50"
            >
              <option>Santé</option>
              <option>Business</option>
              <option>Produits</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="font-label text-[10px] uppercase text-on-surface-variant tracking-widest">Choisir un Plan</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setFormData({...formData, plan: plan.id})}
                className={`p-4 rounded-xl border text-left transition-all ${
                  formData.plan === plan.id 
                    ? 'border-primary-container bg-primary-container/5 ring-1 ring-primary-container' 
                    : 'border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/50'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-headline font-bold text-primary uppercase text-xs">{plan.name}</span>
                  <span className="text-[10px] font-bold text-primary-container">{plan.price}</span>
                </div>
                <ul className="space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-[10px] text-on-surface-variant flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-primary-container" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/10 space-y-4">
          <h3 className="font-headline text-sm font-bold text-primary uppercase tracking-widest">Moyens de Paiement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-on-surface-variant">Mobile Money</label>
              <input 
                value={formData.paymentMethods.mobileMoney}
                onChange={e => setFormData({...formData, paymentMethods: {...formData.paymentMethods, mobileMoney: e.target.value}})}
                className="w-full bg-surface-container-lowest border-outline-variant/30 rounded p-2 text-xs text-primary"
                placeholder="Numéro"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-on-surface-variant">Chariow Pay (URL)</label>
              <input 
                value={formData.paymentMethods.chariow}
                onChange={e => setFormData({...formData, paymentMethods: {...formData.paymentMethods, chariow: e.target.value}})}
                className="w-full bg-surface-container-lowest border-outline-variant/30 rounded p-2 text-xs text-primary"
                placeholder="Lien"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase text-on-surface-variant">Maketou Pay (URL)</label>
              <input 
                value={formData.paymentMethods.maketou}
                onChange={e => setFormData({...formData, paymentMethods: {...formData.paymentMethods, maketou: e.target.value}})}
                className="w-full bg-surface-container-lowest border-outline-variant/30 rounded p-2 text-xs text-primary"
                placeholder="Lien"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error-container/10 border border-error-container/20 rounded-lg flex items-center gap-3 text-error text-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <button 
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-primary-container text-on-primary font-label font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
          Activer mon SmartLink
        </button>
      </form>
    </div>
  );
}
