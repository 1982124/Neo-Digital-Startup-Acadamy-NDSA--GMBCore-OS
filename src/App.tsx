import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, Navigate } from 'react-router-dom';
import { onAuthStateChanged, FirebaseUser, auth, db, doc, getDoc, onSnapshot } from './firebase';
import Layout from './components/Layout';
import Home from './components/Home';
import CoachJose from './components/CoachJose';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [distributor, setDistributor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDist: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Listen to distributor profile
        unsubscribeDist = onSnapshot(doc(db, 'distributors', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setDistributor({ ...docSnap.data(), uid: firebaseUser.uid });
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching distributor:', error);
          setLoading(false);
        });
      } else {
        setDistributor(null);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeDist) unsubscribeDist();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout user={user} distributor={distributor} />}>
          <Route index element={<Home user={user} distributor={distributor} />} />
          <Route path="coach" element={<CoachJose />} />
          <Route 
            path="dashboard" 
            element={user ? <Dashboard distributor={distributor} /> : <Navigate to="/" />} 
          />
          <Route 
            path="onboarding" 
            element={user ? <Onboarding user={user} onComplete={(d: any) => setDistributor(d)} /> : <Navigate to="/" />} 
          />
        </Route>
      </Routes>
    </Router>
  );
}
