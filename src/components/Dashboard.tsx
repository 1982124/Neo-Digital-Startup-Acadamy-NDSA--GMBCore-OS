import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, orderBy, limit, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { 
  Users, MessageSquare, TrendingUp, ExternalLink, 
  Copy, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, MoreVertical, Phone, ShoppingCart,
  BarChart3, Settings as SettingsIcon, X, Trash2,
  ChevronRight, Download, Sparkles, Target, Zap,
  BookOpen, Bell, Video, MessageCircle, Heart, Share2, Send,
  Trophy, FileText, ChevronDown, ChevronUp, Loader2,
  PieChart, RefreshCw, UserPlus, Link as LinkIcon, HelpCircle,
  User, Edit3, Camera, Save, ShieldCheck, Mic, Globe, Lightbulb, ListChecks,
  Image as ImageIcon, Play as PlayIcon, Facebook, Instagram, MessageSquare as WhatsApp, 
  Video as TikTok, FileText as ScriptIcon, Palette, Bot, Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getChatResponse, generateImage } from '../lib/gemini';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface DashboardProps {
  distributor: any;
}

export default function Dashboard({ distributor }: DashboardProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, LEADS, COMMUNITY, MARKETING, PRODUCTS, TEAM, ANALYTICS, SETTINGS
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: distributor?.displayName || '',
    neolifeId: distributor?.neolifeId || '',
    rank: distributor?.rank || 'DISTRIBUTOR',
    bio: distributor?.bio || '',
    photoURL: distributor?.photoURL || ''
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [marketingAssets, setMarketingAssets] = useState<any[]>([]);
  const [showAssets, setShowAssets] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [leadsSubTab, setLeadsSubTab] = useState('PROSPECTS'); // PROSPECTS, CONVERSATIONS
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [aiFollowUp, setAiFollowUp] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [aiStrategy, setAiStrategy] = useState('');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [teamSortKey, setTeamSortKey] = useState('leads'); // leads, sales, conversion
  const [teamSortOrder, setTeamSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('SUCCESS'); // SUCCESS, TIP, QUESTION
  const [isPosting, setIsPosting] = useState(false);
  const [postFilter, setPostFilter] = useState('ALL');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [marketingPlatform, setMarketingPlatform] = useState('FACEBOOK');
  const [marketingType, setMarketingType] = useState('POST');
  const [marketingTopic, setMarketingTopic] = useState('');
  const [marketingResult, setMarketingResult] = useState('');
  const [marketingImage, setMarketingImage] = useState<string | null>(null);
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [isGeneratingMarketingImage, setIsGeneratingMarketingImage] = useState(false);
  const [brandVoice, setBrandVoice] = useState('PROFESSIONNEL'); // PROFESSIONNEL, ENERGIQUE, SCIENTIFIQUE, EMPATHIQUE

  const smartLink = `${window.location.origin}/?ref=${distributor.smartCode}`;

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const stats = `Total Leads: ${leads.length}, Convertis: ${leads.filter(l => l.status === 'CONVERTED').length}`;
      const prompt = `Analyse mes statistiques de vente NeoLife et donne-moi une stratégie concrète pour la semaine. 
      Stats: ${stats}
      Objectif: Augmenter la duplication et les ventes de Tre-en-en.
      Sois direct, motivant et stratégique.`;
      
      const response = await getChatResponse(prompt, "Analyse stratégique business");
      setAiStrategy(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ANALYTICS' && !aiStrategy) {
      generateStrategy();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!distributor) return;

    const q = query(
      collection(db, 'leads'), 
      where('distributorId', '==', distributor.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // AI-based Lead Scoring (Simulated logic based on keywords and length)
        let score = 20; // Base score
        const needs = data.needs?.toLowerCase() || '';
        if (needs.length > 50) score += 20;
        if (needs.length > 150) score += 20;
        if (needs.includes('commander') || needs.includes('acheter') || needs.includes('prix')) score += 30;
        if (needs.includes('santé') || needs.includes('poids')) score += 10;
        
        return {
          id: doc.id,
          ...data,
          score: Math.min(100, score)
        };
      });
      setLeads(leadsData.sort((a: any, b: any) => b.score - a.score));
      setLoading(false);
    }, (error) => {
      console.error('Firestore Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    }, (error) => {
      console.error('Firestore Posts Error:', error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!distributor) return;

    const q = query(
      collection(db, 'goals'),
      where('distributorId', '==', distributor.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalsData);
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  useEffect(() => {
    if (!distributor) return;

    const q = query(
      collection(db, 'notifications'),
      where('distributorId', '==', distributor.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifsData);
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  useEffect(() => {
    if (!distributor.uid) return;

    const q = query(
      collection(db, 'leads'),
      where('distributorId', '==', distributor.uid),
      where('createdAt', '>', serverTimestamp())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const lead = change.doc.data();
          try {
            await addDoc(collection(db, 'notifications'), {
              distributorId: distributor.uid,
              title: 'Nouveau Prospect !',
              msg: `${lead.name} vient de s'inscrire via votre SmartLink.`,
              time: 'À l\'instant',
              type: 'lead',
              read: false,
              createdAt: serverTimestamp()
            });
          } catch (err) { console.error('Error saving notification:', err); }
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Nouveau Lead GMBC-OS", {
              body: `${lead.name} vient de s'inscrire.`,
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  useEffect(() => {
    if (!distributor.uid) return;

    const q = query(
      collection(db, 'sales'),
      where('distributorId', '==', distributor.uid),
      where('createdAt', '>', serverTimestamp())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const sale = change.doc.data();
          try {
            await addDoc(collection(db, 'notifications'), {
              distributorId: distributor.uid,
              title: 'Nouvelle Vente !',
              msg: `Vous avez réalisé une vente de ${sale.amount || 0} FCFA.`,
              time: 'À l\'instant',
              type: 'sale',
              read: false,
              createdAt: serverTimestamp()
            });
          } catch (err) { console.error('Error saving notification:', err); }
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Nouvelle Vente GMBC-OS", {
              body: `Vente de ${sale.amount || 0} FCFA enregistrée.`,
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!distributor.uid) return;

    const q = query(
      collection(db, 'conversations'),
      where('distributorId', '==', distributor.uid),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((c: any) => !c.deleted);
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  useEffect(() => {
    if (!distributor.uid) return;

    const q = query(
      collection(db, 'marketing_assets'),
      where('distributorId', '==', distributor.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarketingAssets(assets);
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: distributor.uid,
        authorName: distributor.name,
        content: newPostContent,
        type: newPostType,
        likes: 0,
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleGeneratePost = async () => {
    if (isGeneratingPost) return;
    setIsGeneratingPost(true);
    try {
      const prompt = `Génère un court message inspirant pour la communauté GMBC-OS (distributeurs NeoLife). 
      Type: ${newPostType === 'SUCCESS' ? 'Un succès récent' : newPostType === 'TIP' ? 'Un conseil de vente' : 'Une question pertinente'}.
      Le ton doit être professionnel, motivant et axé sur la croissance. 
      Réponds uniquement avec le contenu du message, sans guillemets.`;
      
      const response = await getChatResponse(prompt, "Assistant de Publication Communauté");
      setNewPostContent(response);
    } catch (error) {
      console.error('Error generating post:', error);
    } finally {
      setIsGeneratingPost(false);
    }
  };

  const handleLikePost = async (postId: string, currentLikes: number) => {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likes: (currentLikes || 0) + 1
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  useEffect(() => {
    if (!activePostId) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, 'posts', activePostId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [activePostId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePostId || !newCommentContent.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      await addDoc(collection(db, 'posts', activePostId, 'comments'), {
        postId: activePostId,
        authorId: distributor.uid,
        authorName: distributor.name,
        content: newCommentContent,
        createdAt: serverTimestamp()
      });
      
      // Update comment count on post
      const postRef = doc(db, 'posts', activePostId);
      const post = posts.find(p => p.id === activePostId);
      await updateDoc(postRef, {
        commentCount: (post?.commentCount || 0) + 1
      });

      setNewCommentContent('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCreateGoal = async (title: string, target: number, type: string) => {
    try {
      await addDoc(collection(db, 'goals'), {
        distributorId: distributor.uid,
        title,
        target,
        current: 0,
        type,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const trainingModules = [
    {
      id: '1',
      title: 'Démarrage Rapide NeoLife',
      category: 'BASICS',
      duration: '15 min',
      lessons: 5,
      progress: 100,
      image: 'https://picsum.photos/seed/start/400/200'
    },
    {
      id: '2',
      title: 'Maîtriser la Vente Directe',
      category: 'SALES',
      duration: '45 min',
      lessons: 12,
      progress: 30,
      image: 'https://picsum.photos/seed/sales/400/200'
    },
    {
      id: '3',
      title: 'Recrutement & Leadership',
      category: 'TEAM',
      duration: '60 min',
      lessons: 8,
      progress: 0,
      image: 'https://picsum.photos/seed/team/400/200'
    },
    {
      id: '4',
      title: 'Marketing Digital pour GMBC',
      category: 'MARKETING',
      duration: '30 min',
      lessons: 6,
      progress: 0,
      image: 'https://picsum.photos/seed/marketing/400/200'
    }
  ];

  const [selectedModule, setSelectedModule] = useState<any>(null);

  const handleSaveMarketingAsset = async () => {
    if ((!marketingResult && !marketingImage) || isPosting) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'marketing_assets'), {
        distributorId: distributor.uid,
        topic: marketingTopic,
        content: marketingResult,
        imageUrl: marketingImage,
        platform: marketingPlatform,
        type: marketingType,
        createdAt: serverTimestamp()
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error saving asset:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const [sharingPostId, setSharingPostId] = useState<string | null>(null);

  const handleSharePost = (post: any, platform?: string) => {
    const shareUrl = `${window.location.origin}/dashboard?tab=COMMUNITY&post=${post.id}`;
    const shareText = `Découvrez cette publication sur GMBC-OS : "${post.content.substring(0, 50)}..."`;

    if (platform === 'WHATSAPP') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'FACEBOOK') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setSharingPostId(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette publication ?')) return;
    try {
      await updateDoc(doc(db, 'posts', postId), {
        deleted: true
      });
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce prospect ?')) return;
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        deleted: true
      });
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const [leadNotes, setLeadNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (selectedLead) {
      setLeadNotes(selectedLead.notes || '');
    }
  }, [selectedLead]);

  const handleSaveLeadNotes = async () => {
    if (!selectedLead || isSavingNotes) return;
    setIsSavingNotes(true);
    try {
      await updateDoc(doc(db, 'leads', selectedLead.id), {
        notes: leadNotes
      });
      setSelectedLead({ ...selectedLead, notes: leadNotes });
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (isUpdatingProfile) return;
    setIsUpdatingProfile(true);
    try {
      let finalPhotoURL = profileData.photoURL;

      if (profileImageFile) {
        const storageRef = ref(storage, `profile_pictures/${distributor.uid}`);
        await uploadBytes(storageRef, profileImageFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'distributors', distributor.uid), {
        ...profileData,
        photoURL: finalPhotoURL,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
      setProfileImageFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (!distributor.uid) return;

    const q = query(
      collection(db, 'distributors'),
      where('sponsorId', '==', distributor.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeamMembers(members);
    });

    return () => unsubscribe();
  }, [distributor.uid]);

  useEffect(() => {
    if (!distributor.uid || activeTab !== 'MARKETING') return;

    const q = query(
      collection(db, 'marketing_assets'),
      where('distributorId', '==', distributor.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarketingAssets(assets);
    });

    return () => unsubscribe();
  }, [distributor.uid, activeTab]);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMarketingTopic(transcript);
    };

    recognition.start();
  };

  const handleUpdateGoal = async (goalId: string, current: number) => {
    try {
      await updateDoc(doc(db, 'goals', goalId), {
        current
      });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleGenerateMarketing = async () => {
    if (!marketingTopic.trim() || isGeneratingMarketing) return;
    setIsGeneratingMarketing(true);
    setMarketingResult('');
    try {
      const prompt = `En tant que Coach José, expert marketing NeoLife, génère du contenu marketing pour :
      Plateforme : ${marketingPlatform}
      Type de contenu : ${marketingType}
      Sujet/Produit : ${marketingTopic}
      Voix de la marque : ${brandVoice}
      
      Le contenu doit être captivant, axé sur les bénéfices (santé, énergie, opportunité) et inclure un appel à l'action clair. 
      Si c'est une séquence WhatsApp, génère 3 messages distincts. 
      Si c'est un script vidéo, inclus des indications de mise en scène.`;
      
      const response = await getChatResponse(prompt, "Assistant Marketing AI");
      setMarketingResult(response);
    } catch (error) {
      console.error('Error generating marketing:', error);
      setMarketingResult("Erreur lors de la génération. Veuillez réessayer.");
    } finally {
      setIsGeneratingMarketing(false);
    }
  };

  const handleGenerateMarketingImage = async () => {
    if (!marketingTopic.trim() || isGeneratingMarketingImage) return;
    setIsGeneratingMarketingImage(true);
    setMarketingImage(null);
    try {
      const imageUrl = await generateImage(marketingTopic);
      setMarketingImage(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingMarketingImage(false);
    }
  };

  const generateFollowUp = async (lead: any) => {
    setIsGeneratingFollowUp(true);
    setAiFollowUp('');
    try {
      const prompt = `Génère un message WhatsApp court, professionnel et chaleureux pour relancer ce prospect NeoLife. 
      Nom: ${lead.name}
      Besoins exprimés: ${lead.needs}
      Ton: Expert bienveillant (Coach José).
      Inclus un appel à l'action clair et mentionne que tu as analysé ses besoins.`;
      
      const response = await getChatResponse(prompt, "Relance prospect stratégique");
      setAiFollowUp(response);
    } catch (error) {
      console.error(error);
      setAiFollowUp("Désolé, je n'ai pas pu générer la relance. Veuillez réessayer.");
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(smartLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Bonjour ! Découvrez mon écosystème NeoLife et profitez de conseils personnalisés avec Coach José : ${smartLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { status });
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const exportLeads = () => {
    if (leads.length === 0) return;

    const headers = ['ID', 'Nom', 'Besoins', 'Statut', 'Date'];
    const rows = leads.map(lead => [
      lead.id,
      lead.name,
      `"${lead.needs.replace(/"/g, '""')}"`,
      lead.status,
      lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_gmbc_os_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(lead => 
    filter === 'ALL' ? true : lead.status === filter
  );

  // Prepare real chart data from leads
  const chartData = React.useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dataMap: { [key: string]: number } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dataMap[days[d.getDay()]] = 0;
    }

    leads.forEach(lead => {
      if (lead.createdAt?.toDate) {
        const date = lead.createdAt.toDate();
        const dayName = days[date.getDay()];
        if (dataMap[dayName] !== undefined) {
          dataMap[dayName]++;
        }
      }
    });

    return Object.entries(dataMap).map(([name, leads]) => ({ name, leads }));
  }, [leads]);

  const stats = [
    { label: 'Prospects Totaux', value: leads.length, icon: Users, color: 'text-primary-container' },
    { label: 'Conversations AI', value: leads.filter(l => l.status === 'ACTIVE').length, icon: MessageSquare, color: 'text-secondary' },
    { label: 'Taux Conversion', value: '12%', icon: TrendingUp, color: 'text-tertiary' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Utility Bar */}
      <div className="flex justify-between items-center bg-surface-container/50 p-2 rounded-lg border border-outline-variant/10">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              placeholder="Recherche globale (Prospects, Équipe, Formation...)" 
              className="w-full bg-surface-container-highest/50 border-none rounded-md pl-10 pr-4 py-2 text-[10px] font-label uppercase tracking-widest text-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20 animate-glow-pulse-red shadow-[0_0_15px_rgba(255,68,68,0.3)]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-glow-pulse-red shadow-[0_0_10px_#ff4444]" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-red-500 animate-pulse">Système Opérationnel</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-surface-container-highest rounded-full text-outline relative transition-all animate-glow-pulse"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border-2 border-surface-container" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl z-[110] overflow-hidden"
                >
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Notifications</h4>
                    <button 
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      }}
                      className="text-[8px] text-outline hover:text-primary uppercase font-bold"
                    >
                      Tout marquer lu
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-outline/20 mx-auto mb-2" />
                        <p className="text-[10px] text-outline italic">Aucune notification pour le moment.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className={cn(
                            "p-4 border-b border-outline-variant/5 hover:bg-surface-container-highest transition-all cursor-pointer",
                            !n.read ? "bg-primary/5" : ""
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              n.type === 'LEAD' ? "bg-green-500/10 text-green-500" :
                              n.type === 'COMMUNITY' ? "bg-blue-500/10 text-blue-500" :
                              "bg-primary/10 text-primary"
                            )}>
                              {n.type === 'LEAD' ? <Users className="w-4 h-4" /> : 
                               n.type === 'COMMUNITY' ? <MessageCircle className="w-4 h-4" /> : 
                               <Sparkles className="w-4 h-4" />}
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-on-surface">{n.title}</p>
                              <p className="text-[10px] text-outline leading-tight">{n.message}</p>
                              <p className="text-[8px] text-outline/50 uppercase">
                                {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString() : 'Récemment'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Header & SmartLink */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-primary uppercase">Tableau de Bord</h2>
          <p className="text-on-surface-variant text-sm">Bienvenue, {distributor.name}. Gérez vos prospects NeoLife.</p>
        </div>
        
        <div className="w-full md:w-auto bg-surface-container p-4 rounded-xl border border-primary-container/20 flex flex-col sm:flex-row items-center gap-4 animate-glow-pulse">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-label uppercase text-outline tracking-widest mb-1">Votre SmartLink Actif</p>
            <p className="text-xs font-mono text-primary truncate">{smartLink}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={copyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-highest text-primary rounded font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all border border-outline-variant/20 shadow-lg"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button 
              onClick={shareWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(37,211,102,0.4)]"
            >
              <Phone className="w-4 h-4" />
              Partager
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => setActiveTab(i === 0 ? 'LEADS' : i === 1 ? 'COMMUNITY' : 'ANALYTICS')}
            className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex items-center gap-4 animate-glow-pulse hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className={cn("p-3 rounded-lg bg-surface-container-highest transition-transform group-hover:scale-110", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-label uppercase text-outline tracking-widest">{stat.label}</p>
              <p className="text-2xl font-headline font-bold text-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-outline-variant/10">
        {[
          { id: 'OVERVIEW', label: 'Tableau de Bord', icon: TrendingUp },
          { id: 'LEADS', label: 'Prospects', icon: Users, badge: leads.filter(l => l.status === 'NEW').length },
          { id: 'CONVERSATIONS', label: 'Conversations AI', icon: MessageSquare },
          { id: 'COMMUNITY', label: 'Communauté', icon: MessageCircle },
          { id: 'MARKETING', label: 'Marketing AI', icon: Palette },
          { id: 'PRODUCTS', label: 'Produits', icon: ShoppingCart },
          { id: 'TEAM', label: 'Équipe', icon: Target },
          { id: 'ANALYTICS', label: 'Analyses', icon: BarChart3 },
          { id: 'SETTINGS', label: 'Paramètres', icon: SettingsIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[10px] font-label uppercase tracking-widest transition-all border-b-2 relative ${
              activeTab === tab.id 
                ? 'border-primary-container text-primary' 
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge ? (
              <span className="absolute top-2 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Welcome Card */}
              <motion.div 
                whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(0,242,255,0.15)" }}
                className="bg-primary/10 border border-primary/30 p-8 rounded-2xl relative overflow-hidden shadow-2xl shadow-primary/5"
              >
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-primary">
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, -10, 10, 0], scale: 1.2, filter: "drop-shadow(0 0 8px rgba(0,242,255,0.4))" }}
                          transition={{ duration: 0.5 }}
                        >
                          <Trophy className="w-8 h-8 animate-bounce-subtle" />
                        </motion.div>
                        <h3 className="text-2xl font-headline font-bold uppercase tracking-tight text-primary drop-shadow-[0_0_10px_rgba(0,242,255,0.3)]">Performance du Jour</h3>
                        <div className="px-2 py-0.5 bg-primary/20 rounded-full border border-primary/30 text-[8px] font-black uppercase tracking-widest text-primary animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.2)]">
                          En hausse +15%
                        </div>
                      </div>
                      <p className="text-outline text-sm max-w-md leading-relaxed">
                        Excellent travail, <span className="text-primary font-bold drop-shadow-[0_0_5px_rgba(0,242,255,0.3)]">{distributor.name}</span> ! Vous avez <span className="text-primary font-bold drop-shadow-[0_0_5px_rgba(0,242,255,0.3)]">3 nouveaux prospects</span> à contacter aujourd'hui et votre équipe a généré <span className="text-secondary font-bold drop-shadow-[0_0_5px_rgba(255,182,0,0.3)]">450 PV</span> ce matin.
                      </p>
                      <p className="text-[8px] text-outline/40 uppercase tracking-tighter">Dernière mise à jour : il y a 2 minutes</p>
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={() => setActiveTab('LEADS')}
                          className="px-6 py-2.5 bg-surface-container-highest text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10 transition-all border border-primary/20 flex items-center gap-2 group"
                        >
                          <Users className="w-3 h-3 group-hover:scale-110 transition-transform group-hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]" />
                          Voir les Prospects
                        </button>
                        <motion.button 
                          animate={{ 
                            boxShadow: ["0 0 0px rgba(0,242,255,0)", "0 0 20px rgba(0,242,255,0.4)", "0 0 0px rgba(0,242,255,0)"],
                            scale: [1, 1.02, 1]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          whileHover={{ scale: 1.05, brightness: 1.2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab('MARKETING')}
                          className="px-8 py-2.5 bg-primary text-on-primary rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                          Lancer une Campagne
                        </motion.button>
                      </div>
                    </div>

                    {/* Mini Progress Stats */}
                    <div className="flex gap-4 bg-surface-container-highest/30 p-4 rounded-xl border border-outline-variant/10">
                      <div className="text-center space-y-1">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-outline/10" />
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="37.6" className="text-primary drop-shadow-[0_0_3px_rgba(0,242,255,0.5)]" />
                          </svg>
                          <span className="absolute text-[8px] font-black">70%</span>
                        </div>
                        <p className="text-[8px] font-bold text-outline uppercase">Objectif</p>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-outline/10" />
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="125.6" strokeDashoffset="62.8" className="text-secondary drop-shadow-[0_0_3px_rgba(255,182,0,0.5)]" />
                          </svg>
                          <span className="absolute text-[8px] font-black">50%</span>
                        </div>
                        <p className="text-[8px] font-bold text-outline uppercase">Équipe</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-primary/10 flex items-center gap-2">
                    <Quote className="w-3 h-3 text-primary/40 drop-shadow-[0_0_2px_rgba(0,242,255,0.3)]" />
                    <p className="text-[9px] text-outline italic">"Le succès est la somme de petits efforts répétés jour après jour."</p>
                  </div>
                </div>
                <Sparkles className="absolute -right-8 -bottom-8 w-48 h-48 text-primary/5 rotate-12 drop-shadow-[0_0_20px_rgba(0,242,255,0.1)]" />
              </motion.div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: UserPlus, label: 'Ajouter Prospect', tab: 'LEADS', color: 'text-green-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' },
                  { icon: ShoppingCart, label: 'Catalogue', tab: 'PRODUCTS', color: 'text-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
                  { icon: Sparkles, label: 'Assistant AI', tab: 'MARKETING', color: 'text-primary', glow: 'shadow-[0_0_15px_rgba(0,242,255,0.3)]' },
                  { icon: BarChart3, label: 'Analyses', tab: 'ANALYTICS', color: 'text-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
                ].map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveTab(action.tab as any)}
                    className={cn(
                      "p-6 bg-surface-container rounded-2xl border border-outline-variant/10 flex flex-col items-center gap-3 hover:border-primary/30 transition-all group animate-glow-pulse",
                      action.glow
                    )}
                  >
                    <div className={cn("p-3 rounded-xl bg-surface-container-highest group-hover:scale-110 transition-transform", action.color)}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline group-hover:text-primary transition-colors text-center">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-headline font-bold text-primary uppercase flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Activité Récente
                  </h3>
                  <button 
                    onClick={() => setActiveTab('ANALYTICS')}
                    className="text-[10px] font-bold text-outline hover:text-primary uppercase tracking-widest"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { type: 'LEAD', text: 'Nouveau prospect : Jean Dupont via SmartLink', time: 'Il y a 10 min' },
                    { type: 'SALE', text: 'Vente confirmée : Pack Vitalité (120 PV)', time: 'Il y a 2h' },
                    { type: 'TEAM', text: 'Awa S. a atteint le rang de Manager !', time: 'Il y a 5h' },
                    { type: 'POST', text: 'Votre post "Succès Tre-en-en" a reçu 15 likes', time: 'Hier' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-highest/30 rounded-xl border border-outline-variant/5">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        act.type === 'LEAD' ? "bg-green-500/10 text-green-500" :
                        act.type === 'SALE' ? "bg-yellow-500/10 text-yellow-500" :
                        act.type === 'TEAM' ? "bg-purple-500/10 text-purple-500" :
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        {act.type === 'LEAD' ? <Users className="w-4 h-4" /> : 
                         act.type === 'SALE' ? <ShoppingCart className="w-4 h-4" /> : 
                         act.type === 'TEAM' ? <Trophy className="w-4 h-4" /> : 
                         <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-on-surface">{act.text}</p>
                        <p className="text-[10px] text-outline uppercase tracking-widest">{act.time}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-outline/30" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Quick PV Stats */}
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-lg font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Volume de Points (PV)
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-label uppercase text-outline tracking-widest">PV Personnel</p>
                      <p className="text-xl font-headline font-bold text-primary uppercase">{distributor.pv} / 100</p>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((distributor.pv / 100) * 100, 100)}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-label uppercase text-outline tracking-widest">PV Groupe</p>
                      <p className="text-xl font-headline font-bold text-primary uppercase">{distributor.groupPv} / 1000</p>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((distributor.groupPv / 1000) * 100, 100)}%` }}
                        className="h-full bg-secondary"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-outline">
                    <span>Prochain Rang : Manager</span>
                    <span className="text-primary">85%</span>
                  </div>
                </div>
              </div>

              {/* Training Widget */}
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-headline font-bold text-primary uppercase flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Formation Continue
                  </h3>
                  <button 
                    onClick={() => setActiveTab('TRAINING')}
                    className="text-[10px] font-bold text-outline hover:text-primary uppercase tracking-widest"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="space-y-4">
                  {trainingModules.slice(0, 2).map((module) => (
                    <div 
                      key={module.id} 
                      onClick={() => setActiveTab('TRAINING')}
                      className="flex items-center gap-4 p-4 bg-surface-container-highest/30 rounded-xl border border-outline-variant/5 hover:border-primary/20 transition-all cursor-pointer group"
                    >
                      <div className="w-16 aspect-video rounded-lg overflow-hidden shrink-0">
                        <img src={module.image} alt={module.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{module.title}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${module.progress}%` }} />
                          </div>
                          <span className="text-[8px] font-bold text-outline uppercase">{module.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-lg font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Liens Rapides
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <a 
                    href={distributor.shopUrl} 
                    target="_blank" 
                    className="flex items-center justify-between p-4 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-outline group-hover:text-primary">Ma Boutique</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-outline/30" />
                  </a>
                  <a 
                    href={`https://wa.me/${distributor.whatsapp}`} 
                    target="_blank" 
                    className="flex items-center justify-between p-4 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-outline group-hover:text-primary">WhatsApp Support</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-outline/30" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'CONVERSATIONS' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xl font-headline font-bold text-primary uppercase">Historique Coach José</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-outline-variant/20 rounded-xl">
                    <MessageSquare className="w-8 h-8 text-outline/20 mx-auto mb-2" />
                    <p className="text-[10px] text-outline italic">Aucune conversation enregistrée.</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all",
                        selectedConversation?.id === conv.id 
                          ? "bg-primary/10 border-primary shadow-lg" 
                          : "bg-surface-container border-outline-variant/10 hover:border-primary/30"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary">Session #{conv.visitorId}</span>
                        <span className="text-[8px] text-outline">{conv.updatedAt?.toDate ? conv.updatedAt.toDate().toLocaleDateString() : 'Récemment'}</span>
                      </div>
                      <p className="text-xs font-bold text-on-surface line-clamp-1">
                        {conv.summary || conv.messages[1]?.text || "Conversation vide"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <MessageCircle className="w-3 h-3 text-outline" />
                        <span className="text-[8px] text-outline uppercase">{conv.messages.length} messages</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="bg-surface-container rounded-xl border border-outline-variant/10 h-[600px] flex flex-col">
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/30">
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Détails de la Session</h4>
                      <p className="text-[8px] text-outline uppercase">ID Visiteur: {selectedConversation.visitorId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={async () => {
                          if (window.confirm("Supprimer cette conversation ?")) {
                            await updateDoc(doc(db, 'conversations', selectedConversation.id), { deleted: true });
                            setSelectedConversation(null);
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-full text-outline hover:text-red-500 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedConversation(null)}
                        className="p-2 hover:bg-surface-container-highest rounded-full text-outline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {selectedConversation.summary && (
                    <div className="p-4 bg-primary/5 border-b border-primary/10">
                      <p className="text-[10px] font-black text-primary uppercase mb-1 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        Diagnostic AI
                      </p>
                      <p className="text-xs text-on-surface italic leading-relaxed">"{selectedConversation.summary}"</p>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                    {selectedConversation.messages.map((msg: any, i: number) => (
                      <div key={i} className={cn(
                        "flex flex-col max-w-[80%]",
                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "p-3 rounded-xl text-xs leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-primary text-on-primary rounded-tr-none" 
                            : "bg-surface-container-highest text-on-surface rounded-tl-none border border-outline-variant/10"
                        )}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-outline mt-1 uppercase">
                          {msg.role === 'user' ? 'Visiteur' : 'Coach José'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center bg-surface-container/30 rounded-xl border border-dashed border-outline-variant/20">
                  <Bot className="w-12 h-12 text-outline/20 mb-4" />
                  <p className="text-sm text-outline italic">Sélectionnez une conversation pour voir les détails.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LEADS' && (
        <div className="space-y-8">
          <div className="flex gap-4 border-b border-outline-variant/10 mb-6">
            <button 
              onClick={() => setLeadsSubTab('PROSPECTS')}
              className={cn(
                "pb-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
                leadsSubTab === 'PROSPECTS' ? "border-primary text-primary" : "border-transparent text-outline"
              )}
            >
              Prospects
            </button>
          </div>

          {leadsSubTab === 'PROSPECTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-headline font-bold text-primary uppercase">Derniers Prospects</h3>
                  <div className="flex gap-2">
                    {['ALL', 'NEW', 'ACTIVE', 'CONVERTED'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded text-[10px] font-label uppercase tracking-widest transition-all ${
                          filter === f ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-outline hover:bg-surface-container-highest'
                        }`}
                      >
                        {f === 'ALL' ? 'Tous' : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container rounded-xl border border-outline-variant/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-surface-container-highest/50 border-b border-outline-variant/10">
                          <th className="px-6 py-4 text-[10px] font-label uppercase text-outline tracking-widest">Prospect</th>
                          <th className="px-6 py-4 text-[10px] font-label uppercase text-outline tracking-widest">Besoins / Diagnostic</th>
                          <th className="px-6 py-4 text-[10px] font-label uppercase text-outline tracking-widest text-center">Score</th>
                          <th className="px-6 py-4 text-[10px] font-label uppercase text-outline tracking-widest">Statut</th>
                          <th className="px-6 py-4 text-[10px] font-label uppercase text-outline tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <Loader2 className="w-8 h-8 animate-spin text-primary-container mx-auto" />
                            </td>
                          </tr>
                        ) : filteredLeads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-outline text-sm">
                              Aucun prospect trouvé pour le moment.
                            </td>
                          </tr>
                        ) : (
                          filteredLeads.map((lead) => (
                            <tr 
                              key={lead.id} 
                              onClick={() => setSelectedLead(lead)}
                              className="hover:bg-surface-container-highest/30 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container font-bold text-xs">
                                    {lead.name[0]}
                                  </div>
                                  <span className="text-sm font-medium text-primary">{lead.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-on-surface-variant line-clamp-1 max-w-xs">{lead.needs}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`text-xs font-black ${
                                  lead.score > 70 ? 'text-green-500' : lead.score > 40 ? 'text-yellow-500' : 'text-outline'
                                }`}>{lead.score}%</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  lead.status === 'NEW' ? 'bg-blue-500/10 text-blue-500' :
                                  lead.status === 'ACTIVE' ? 'bg-primary-container/10 text-primary-container' :
                                  'bg-green-500/10 text-green-500'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a 
                                    href={`tel:${lead.phone || distributor.whatsapp}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 hover:bg-surface-container-highest rounded text-outline hover:text-primary-container transition-all animate-glow-pulse border border-transparent hover:border-primary/30"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </a>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`https://wa.me/${lead.phone || distributor.whatsapp}?text=Bonjour ${lead.name}, c'est ${distributor.name} de NeoLife...`, '_blank');
                                    }}
                                    className="p-2 hover:bg-surface-container-highest rounded text-outline hover:text-primary-container transition-all animate-glow-pulse border border-transparent hover:border-primary/30"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
                  <h4 className="font-headline font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Activité Réelle
                  </h4>
                  <div className="space-y-4">
                    {[
                      { user: "Sarah M.", action: "a rejoint l'équipe", time: "2h" },
                      { user: "Marc D.", action: "nouveau prospect (92%)", time: "5h" },
                      { user: "José", action: "analyse hebdo prête", time: "1j" },
                    ].map((act, i) => (
                      <div key={i} className="flex gap-3 text-[10px]">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                        <div className="space-y-0.5">
                          <p className="text-on-surface leading-tight">
                            <span className="font-bold">{act.user}</span> {act.action}
                          </p>
                          <p className="text-outline uppercase tracking-tighter">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Conseil du Jour</span>
                  </div>
                  <p className="text-xs text-outline leading-relaxed italic">
                    "Le Pack Vitalité est votre meilleur levier ce mois-ci. José a préparé des scripts spécifiques dans l'onglet Équipe."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'COMMUNITY' && (
        <div className="space-y-8">
          {/* Community Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Membres Actifs', value: '1,240', icon: Users, color: 'text-blue-500' },
              { label: 'Publications', value: '856', icon: MessageSquare, color: 'text-primary' },
              { label: 'Interactions', value: '12.4k', icon: Heart, color: 'text-pink-500' },
              { label: 'Nouveaux ce mois', value: '+124', icon: UserPlus, color: 'text-green-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface-container p-4 rounded-xl border border-outline-variant/10 flex items-center gap-4">
                <div className={cn("p-2 rounded-lg bg-surface-container-highest", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-outline uppercase tracking-widest">{stat.label}</p>
                  <p className="text-sm font-bold text-on-surface">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <div className="bg-surface-container p-6 rounded-xl border border-primary/20 shadow-xl shadow-primary/5 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-0 group-hover:bg-primary/10 transition-all" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold shadow-lg shadow-primary/20">
                  {distributor.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface">{distributor.name}</p>
                  <p className="text-[10px] text-outline uppercase tracking-widest">Partagez votre expertise</p>
                </div>
              </div>
              <form onSubmit={handleCreatePost} className="space-y-4 relative z-10">
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Quoi de neuf dans votre business NeoLife ?"
                  className="w-full bg-surface-container-highest/50 border border-outline-variant/10 rounded-xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none transition-all placeholder:text-outline/50"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {[
                      { id: 'SUCCESS', label: 'Succès', icon: Trophy },
                      { id: 'TIP', label: 'Conseil', icon: Lightbulb },
                      { id: 'QUESTION', label: 'Question', icon: HelpCircle }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNewPostType(type.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                          newPostType === type.id 
                            ? "bg-primary/10 border-primary text-primary shadow-sm" 
                            : "border-outline-variant/20 text-outline hover:bg-surface-container-highest"
                        )}
                      >
                        <type.icon className="w-3 h-3" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleGeneratePost}
                      disabled={isGeneratingPost}
                      className="flex items-center gap-2 px-4 py-2 border border-primary/20 text-primary rounded-lg font-label text-[10px] uppercase tracking-widest font-bold hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      {isGeneratingPost ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Assistant AI
                    </button>
                    <button 
                      disabled={isPosting || !newPostContent.trim()}
                      className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg font-label text-[10px] uppercase tracking-widest font-bold disabled:opacity-50 shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                    >
                      {isPosting ? 'Publication...' : 'Publier'}
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Feed Filters */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {['ALL', 'SUCCESS', 'TIP', 'QUESTION'].map(f => (
                <button
                  key={f}
                  onClick={() => setPostFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                    postFilter === f 
                      ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container border border-outline-variant/10 text-outline hover:border-primary/50"
                  )}
                >
                  {f === 'ALL' ? 'Tout le flux' : f === 'SUCCESS' ? '🏆 Succès' : f === 'TIP' ? '💡 Conseils' : '❓ Questions'}
                </button>
              ))}
            </div>

            {/* Feed */}
            <div className="space-y-6">
              {posts.filter(p => postFilter === 'ALL' || p.type === postFilter).length === 0 ? (
                <div className="text-center py-12 bg-surface-container rounded-xl border border-outline-variant/10">
                  <MessageCircle className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                  <p className="text-outline text-sm">Aucune publication pour le moment. Soyez le premier !</p>
                </div>
              ) : (
                posts.filter(p => postFilter === 'ALL' || p.type === postFilter).map((post) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={post.id} 
                    className="bg-surface-container rounded-xl border border-outline-variant/10 overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {post.authorName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">{post.authorName}</p>
                            <p className="text-[8px] text-outline uppercase tracking-widest">
                              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'À l\'instant'}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                          post.type === 'SUCCESS' ? "bg-green-500/10 text-green-500" :
                          post.type === 'TIP' ? "bg-blue-500/10 text-blue-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {post.type}
                        </span>
                        {post.authorId === distributor.uid && (
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 hover:bg-error/10 rounded text-outline hover:text-error transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center gap-6 pt-2 border-t border-outline-variant/5">
                        <button 
                          onClick={() => handleLikePost(post.id, post.likes || 0)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-outline hover:text-primary transition-all"
                        >
                          <Heart className={cn("w-4 h-4", post.likes > 0 ? "fill-primary text-primary" : "")} />
                          {post.likes || 0}
                        </button>
                        <button 
                          onClick={() => setActivePostId(activePostId === post.id ? null : post.id)}
                          className={cn(
                            "flex items-center gap-1.5 text-[10px] font-bold transition-all",
                            activePostId === post.id ? "text-primary" : "text-outline hover:text-primary"
                          )}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {post.commentCount || 0} Commentaires
                        </button>
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingPostId(sharingPostId === post.id ? null : post.id);
                            }}
                            className={cn(
                              "flex items-center gap-1.5 text-[10px] font-bold transition-all",
                              sharingPostId === post.id ? "text-primary" : "text-outline hover:text-primary"
                            )}
                          >
                            <Share2 className="w-4 h-4" />
                            Partager
                          </button>
                          
                          <AnimatePresence>
                            {sharingPostId === post.id && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-0 mb-2 w-48 bg-surface-container-highest border border-primary/20 rounded-xl shadow-2xl z-50 overflow-hidden"
                              >
                                <div className="p-2 space-y-1">
                                  <button 
                                    onClick={() => handleSharePost(post)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-primary/10 rounded-lg text-xs font-bold text-on-surface transition-all"
                                  >
                                    <LinkIcon className="w-4 h-4 text-primary" />
                                    Copier le lien
                                  </button>
                                  <button 
                                    onClick={() => handleSharePost(post, 'WHATSAPP')}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-green-500/10 rounded-lg text-xs font-bold text-on-surface transition-all"
                                  >
                                    <WhatsApp className="w-4 h-4 text-green-500" />
                                    WhatsApp
                                  </button>
                                  <button 
                                    onClick={() => handleSharePost(post, 'FACEBOOK')}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-blue-500/10 rounded-lg text-xs font-bold text-on-surface transition-all"
                                  >
                                    <Facebook className="w-4 h-4 text-blue-500" />
                                    Facebook
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {activePostId === post.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-surface-container-highest/30 border-t border-outline-variant/5 overflow-hidden"
                        >
                          <div className="p-6 space-y-4">
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                              {comments.length === 0 ? (
                                <p className="text-[10px] text-outline italic text-center py-4">Aucun commentaire pour le moment.</p>
                              ) : (
                                comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[8px] font-bold text-outline">
                                      {comment.authorName[0]}
                                    </div>
                                    <div className="flex-1 bg-surface-container p-3 rounded-xl rounded-tl-none border border-outline-variant/5">
                                      <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] font-bold text-primary">{comment.authorName}</p>
                                        <p className="text-[8px] text-outline">
                                          {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString() : '...'}
                                        </p>
                                      </div>
                                      <p className="text-xs text-on-surface leading-relaxed">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            <form onSubmit={handleAddComment} className="flex gap-2">
                              <input 
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                placeholder="Votre réponse..."
                                className="flex-1 bg-surface-container border border-outline-variant/10 rounded-lg px-4 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary/30"
                              />
                              <button 
                                disabled={isCommenting || !newCommentContent.trim()}
                                className="p-2 bg-primary text-on-primary rounded-lg disabled:opacity-50"
                              >
                                {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-primary/20 to-primary-container/20 p-6 rounded-xl border border-primary/30 space-y-4 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 blur-2xl rounded-full" />
              <h4 className="font-headline font-bold text-primary uppercase text-xs flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Bienvenue !
              </h4>
              <p className="text-xs text-on-surface leading-relaxed">
                Partagez vos succès, posez vos questions et grandissez ensemble avec la communauté NeoLife.
              </p>
              <button className="w-full py-2 bg-primary text-on-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                Voir le Guide
              </button>
            </div>

            {/* Trending Topics Widget */}
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
              <h4 className="font-headline font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Tendances Actuelles
              </h4>
              <div className="space-y-3">
                {[
                  { tag: "#TreEnEn", count: 124, trend: "up" },
                  { tag: "#VitalityPack", count: 89, trend: "up" },
                  { tag: "#NeoLifeBusiness", count: 56, trend: "down" },
                  { tag: "#CoachJose", count: 45, trend: "up" },
                ].map((trend, i) => (
                  <button 
                    key={i} 
                    className="w-full flex items-center justify-between p-2 hover:bg-surface-container-highest/50 rounded-lg transition-all group"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{trend.tag}</span>
                      <span className="text-[8px] text-outline uppercase tracking-widest">{trend.count} publications</span>
                    </div>
                    <div className={cn(
                      "p-1 rounded bg-opacity-10",
                      trend.trend === "up" ? "bg-green-500 text-green-500" : "bg-error text-error"
                    )}>
                      {trend.trend === "up" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Widget */}
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
              <h4 className="font-headline font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Trophy className="w-3 h-3" />
                Top Contributeurs
              </h4>
              <div className="space-y-4">
                {[
                  { name: "Marie-Claire T.", points: 1250, rank: 1 },
                  { name: "Awa S.", points: 980, rank: 2 },
                  { name: "Ousmane D.", points: 750, rank: 3 },
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-surface-container-highest/30 rounded-lg border border-outline-variant/5">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                        user.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                        user.rank === 2 ? "bg-slate-400/20 text-slate-400" :
                        "bg-orange-400/20 text-orange-400"
                      )}>
                        {user.rank}
                      </span>
                      <p className="text-xs font-bold">{user.name}</p>
                    </div>
                    <span className="text-[10px] font-mono text-primary">{user.points} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources Widget */}
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
              <h4 className="font-headline font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Ressources Partagées
              </h4>
              <div className="space-y-3">
                {[
                  { title: "Catalogue NeoLife 2024", type: "PDF", size: "4.2 MB" },
                  { title: "Guide Tre-en-en", type: "DOCX", size: "1.5 MB" },
                  { title: "Visuels Instagram", type: "ZIP", size: "12.8 MB" },
                ].map((res, i) => (
                  <div key={i} className="group cursor-pointer p-3 bg-surface-container-highest/30 rounded-lg border border-outline-variant/5 hover:border-primary/50 transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold group-hover:text-primary transition-colors">{res.title}</p>
                      <Download className="w-3 h-3 text-outline group-hover:text-primary" />
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[8px] font-black text-primary uppercase">{res.type}</span>
                      <span className="text-[8px] text-outline uppercase">{res.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
              <h4 className="font-headline font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Tendances Communauté
              </h4>
              <div className="space-y-3">
                {[
                  { tag: "#NeoLifeSuccess", count: 124 },
                  { tag: "#TreEnEnChallenge", count: 89 },
                  { tag: "#CoachJoseTips", count: 56 },
                ].map((trend, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-xs text-on-surface font-medium">{trend.tag}</span>
                    <span className="text-[10px] text-outline">{trend.count} posts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Goal Tracking Section */}
          <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-headline font-bold text-primary uppercase tracking-tight">Objectifs & Performance</h3>
                  <button 
                    onClick={() => handleCreateGoal("Nouvel Objectif", 100, "LEADS")}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all animate-glow-pulse border border-primary/30"
                  >
                    + Nouvel Objectif
                  </button>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.length === 0 ? (
                <div className="col-span-2 p-12 text-center border border-dashed border-outline-variant/20 rounded-xl">
                  <Target className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                  <p className="text-sm text-outline italic">Vous n'avez pas encore d'objectifs définis.</p>
                  <button 
                    onClick={() => handleCreateGoal("Objectif Prospects Mensuel", 50, "LEADS")}
                    className="mt-4 text-primary text-[10px] font-bold uppercase underline underline-offset-4"
                  >
                    Créer mon premier objectif
                  </button>
                </div>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className="p-6 bg-surface-container-highest/30 rounded-xl border border-outline-variant/10 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-label uppercase text-outline tracking-widest">{goal.type}</p>
                        <h4 className="text-sm font-bold text-on-surface">{goal.title}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-headline font-bold text-primary">{Math.round((goal.current / goal.target) * 100)}%</p>
                        <p className="text-[10px] text-outline uppercase tracking-tighter">{goal.current} / {goal.target}</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full",
                          (goal.current / goal.target) >= 1 ? "bg-green-500" : "bg-primary"
                        )}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-1">
                        {[1, 5, 10].map(val => (
                          <button 
                            key={val}
                            onClick={() => handleUpdateGoal(goal.id, goal.current + val)}
                            className="px-2 py-1 bg-surface-container hover:bg-primary/10 text-[8px] font-bold rounded border border-outline-variant/10 transition-all"
                          >
                            +{val}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await updateDoc(doc(db, 'goals', goal.id), {
                              deleted: true // Soft delete or just delete
                            });
                            // Or actual delete: await deleteDoc(doc(db, 'goals', goal.id));
                          } catch (err) { console.error(err); }
                        }}
                        className="text-[8px] text-outline hover:text-error uppercase font-bold transition-all"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'MARKETING' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-headline font-bold text-primary uppercase">Assistant Marketing AI</h3>
                  </div>
                  <button 
                    onClick={() => setShowAssets(!showAssets)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                      showAssets ? "bg-primary text-on-primary border-primary" : "bg-surface-container-highest text-primary border-primary/20 hover:bg-primary/10"
                    )}
                  >
                    <BookOpen className="w-3 h-3" />
                    {showAssets ? 'Fermer les Archives' : 'Mes Archives'}
                  </button>
                </div>
                
                {showAssets ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {marketingAssets.length === 0 ? (
                        <div className="col-span-full p-12 text-center border border-dashed border-outline-variant/20 rounded-xl">
                          <BookOpen className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                          <p className="text-sm text-outline italic">Votre bibliothèque est vide. Générez et sauvegardez du contenu pour le retrouver ici.</p>
                        </div>
                      ) : (
                        marketingAssets.map((asset) => (
                          <div key={asset.id} className="p-4 bg-surface-container-highest/30 rounded-xl border border-outline-variant/10 space-y-3 group">
                            <div className="flex justify-between items-start">
                              <span className="text-[8px] font-black text-primary uppercase px-2 py-0.5 bg-primary/10 rounded-full">{asset.type}</span>
                              <span className="text-[8px] text-outline">{asset.createdAt?.toDate ? asset.createdAt.toDate().toLocaleDateString() : 'Récemment'}</span>
                            </div>
                            <h4 className="text-xs font-bold text-on-surface line-clamp-1">{asset.topic}</h4>
                            {asset.imageUrl && (
                              <div className="aspect-video rounded-lg overflow-hidden border border-outline-variant/10">
                                <img src={asset.imageUrl} alt={asset.topic} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <p className="text-[10px] text-outline line-clamp-3 leading-relaxed">{asset.content}</p>
                            <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(asset.content);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="flex-1 py-1.5 bg-surface-container rounded text-[8px] font-bold uppercase tracking-widest hover:bg-primary/10 text-primary transition-all"
                              >
                                Copier Texte
                              </button>
                              {asset.imageUrl && (
                                <a 
                                  href={asset.imageUrl} 
                                  download 
                                  className="flex-1 py-1.5 bg-surface-container rounded text-[8px] font-bold uppercase tracking-widest hover:bg-primary/10 text-primary transition-all text-center"
                                >
                                  Image
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase text-outline tracking-widest">Plateforme</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'FACEBOOK', icon: Facebook },
                        { id: 'INSTAGRAM', icon: Instagram },
                        { id: 'WHATSAPP', icon: WhatsApp },
                        { id: 'TIKTOK', icon: TikTok }
                      ].map(p => (
                        <button
                          key={p.id}
                          onClick={() => setMarketingPlatform(p.id)}
                          className={cn(
                            "p-3 rounded-lg border transition-all flex items-center justify-center",
                            marketingPlatform === p.id ? "bg-primary/10 border-primary text-primary" : "bg-surface-container-highest/30 border-outline-variant/10 text-outline hover:border-primary/30"
                          )}
                        >
                          <p.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase text-outline tracking-widest">Type de Contenu</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'POST', label: 'Publication', icon: Globe },
                        { id: 'SCRIPT', label: 'Script Vidéo', icon: PlayIcon },
                        { id: 'REEL', label: 'Idée Reel', icon: Lightbulb },
                        { id: 'SEQUENCE', label: 'Séquence WA', icon: ListChecks }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setMarketingType(t.id)}
                          className={cn(
                            "p-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight",
                            marketingType === t.id ? "bg-primary/10 border-primary text-primary" : "bg-surface-container-highest/30 border-outline-variant/10 text-outline hover:border-primary/30"
                          )}
                        >
                          <t.icon className="w-3 h-3" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label uppercase text-outline tracking-widest">Sujet ou Produit</label>
                  <div className="relative">
                    <input 
                      value={marketingTopic}
                      onChange={(e) => setMarketingTopic(e.target.value)}
                      placeholder="Ex: Tre-en-en pour l'énergie, Opportunité d'affaires, Pack Vitalité..."
                      className="w-full bg-surface-container-highest/30 border border-outline-variant/10 rounded-xl p-4 pr-12 text-sm text-on-surface focus:ring-1 focus:ring-primary/30"
                    />
                    <button 
                      onClick={handleVoiceInput}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                        isListening ? "bg-primary text-on-primary animate-pulse" : "text-outline hover:text-primary hover:bg-primary/10"
                      )}
                      title="Utiliser la voix"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-label uppercase text-outline tracking-widest">Ton :</span>
                    <select 
                      value={brandVoice}
                      onChange={(e) => setBrandVoice(e.target.value)}
                      className="bg-surface-container-highest/50 border-none rounded text-[10px] font-bold uppercase tracking-widest px-3 py-1 text-primary"
                    >
                      <option value="PROFESSIONNEL">Professionnel</option>
                      <option value="ENERGIQUE">Énergique</option>
                      <option value="SCIENTIFIQUE">Scientifique</option>
                      <option value="EMPATHIQUE">Empathique</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleGenerateMarketingImage}
                      disabled={isGeneratingMarketingImage || !marketingTopic.trim()}
                      className="flex items-center gap-2 px-4 py-2 border border-primary/20 text-primary rounded-lg font-label text-[10px] uppercase tracking-widest font-bold hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      {isGeneratingMarketingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                      Générer Image
                    </button>
                    <button 
                      onClick={handleGenerateMarketing}
                      disabled={isGeneratingMarketing || !marketingTopic.trim()}
                      className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg font-label text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {isGeneratingMarketing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Générer Contenu
                    </button>
                  </div>
                </div>

                {(marketingResult || marketingImage) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-container p-8 rounded-xl border border-primary/20 space-y-6"
                >
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveMarketingAsset}
                      disabled={isPosting}
                      className="flex items-center gap-2 text-[10px] font-bold text-primary hover:brightness-110 transition-all bg-primary/10 px-3 py-1 rounded-lg"
                    >
                      {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Sauvegarder dans mes actifs
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(marketingResult);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-2 text-[10px] font-bold text-outline hover:text-primary transition-all"
                    >
                      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copié' : 'Copier le texte'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {marketingResult && (
                      <div className="p-6 bg-surface-container-highest/30 rounded-xl border border-outline-variant/10">
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{marketingResult}</p>
                      </div>
                    )}
                    {marketingImage && (
                      <div className="space-y-4">
                        <div className="aspect-square rounded-xl overflow-hidden border border-outline-variant/10 bg-black">
                          <img src={marketingImage} alt="Marketing AI" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <a 
                          href={marketingImage} 
                          download="neolife_marketing.png"
                          className="flex items-center justify-center gap-2 w-full py-2 bg-surface-container-highest text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Télécharger l'image
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

            <div className="space-y-6">
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
                <h4 className="font-headline font-bold text-primary uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-3 h-3" />
                  Idées de Campagnes
                </h4>
                <div className="space-y-3">
                  {[
                    { title: "Challenge 30 jours Vitalité", platform: "Instagram" },
                    { title: "Webinaire Opportunité", platform: "Facebook" },
                    { title: "Témoignages Clients", platform: "WhatsApp" }
                  ].map((idea, i) => (
                    <button 
                      key={i}
                      onClick={() => setMarketingTopic(idea.title)}
                      className="w-full text-left p-3 bg-surface-container-highest/30 rounded-lg border border-outline-variant/5 hover:border-primary/50 transition-all group"
                    >
                      <p className="text-xs font-bold group-hover:text-primary transition-colors">{idea.title}</p>
                      <p className="text-[8px] text-outline uppercase tracking-widest">{idea.platform}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Astuce Marketing</span>
                </div>
                <p className="text-xs text-outline leading-relaxed italic">
                  "Utilisez des visuels de personnes réelles consommant les produits pour augmenter la confiance de 40%."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ANALYTICS' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[8px] font-label uppercase text-outline tracking-widest">Statut Système</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                  <p className="text-sm font-black text-primary uppercase">Optimal</p>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[8px] font-label uppercase text-outline tracking-widest">Taux de Conversion</p>
                <p className="text-xl font-headline font-bold text-primary">12.4%</p>
              </div>
              <div className="text-green-500 text-[10px] font-black">+2.1%</div>
            </div>
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[8px] font-label uppercase text-outline tracking-widest">Vitesse de Duplication</p>
                <p className="text-xl font-headline font-bold text-primary">x1.5</p>
              </div>
              <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* AI Strategy Card */}
              <div className="bg-primary/5 border border-primary/20 p-8 rounded-2xl space-y-6 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-headline font-bold text-primary uppercase">Conseil Stratégique de José</h3>
                      <p className="text-[10px] text-outline uppercase tracking-widest">Analyse en temps réel de votre business</p>
                    </div>
                  </div>
                  <button 
                    onClick={generateStrategy}
                    disabled={isGeneratingStrategy}
                    className="p-3 bg-surface-container-highest text-primary rounded-xl hover:bg-primary/10 transition-all border border-primary/10"
                  >
                    <RefreshCw className={cn("w-5 h-5", isGeneratingStrategy && "animate-spin")} />
                  </button>
                </div>
                
                {isGeneratingStrategy ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-outline italic animate-pulse">José analyse vos données et prépare votre plan de match...</p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-surface-container rounded-2xl border border-outline-variant/10 relative z-10"
                  >
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                      {aiStrategy || "José est prêt à analyser votre performance. Cliquez sur le bouton de rafraîchissement pour obtenir votre stratégie personnalisée."}
                    </p>
                  </motion.div>
                )}
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              </div>

              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-headline font-bold text-primary uppercase">Croissance des Prospects</h3>
                  <select className="bg-surface-container-highest border border-outline-variant/10 rounded-xl text-[10px] font-bold uppercase tracking-widest px-4 py-2 text-outline focus:text-primary transition-colors">
                    <option>7 Derniers Jours</option>
                    <option>30 Derniers Jours</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a494b" vertical={false} opacity={0.1} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#3a494b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: '#3a494b' }}
                      />
                      <YAxis 
                        stroke="#3a494b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: '#3a494b' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0, 242, 255, 0.05)' }}
                        contentStyle={{ backgroundColor: '#1b1b1f', border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '12px', padding: '12px' }}
                        itemStyle={{ color: '#00f2ff', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#e1fdff', fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      />
                      <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 5 ? '#00f2ff' : 'rgba(0, 242, 255, 0.2)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-xl font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Répartition Sources
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'SmartLink Direct', value: 45, color: 'bg-primary' },
                    { icon: Facebook, label: 'Facebook Ads', value: 25, color: 'bg-blue-500' },
                    { icon: Instagram, label: 'Instagram Reels', value: 20, color: 'bg-pink-500' },
                    { icon: WhatsApp, label: 'WhatsApp Status', value: 10, color: 'bg-green-500' },
                  ].map((source, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-outline flex items-center gap-2">
                          {source.icon && <source.icon className="w-3 h-3" />}
                          {source.label}
                        </span>
                        <span className="text-primary">{source.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${source.value}%` }}
                          className={cn("h-full rounded-full", source.color)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-xl font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top Produits
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Tre-en-en', sales: 45, trend: '+12%' },
                    { name: 'Pro Vitality', sales: 32, trend: '+8%' },
                    { name: 'Salmon Oil', sales: 28, trend: '-2%' },
                  ].map((prod, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface-container-highest/30 rounded-xl border border-outline-variant/5">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{prod.name}</p>
                        <p className="text-[10px] text-outline uppercase tracking-widest">{prod.sales} Ventes</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black",
                        prod.trend.startsWith('+') ? "text-green-500" : "text-error"
                      )}>{prod.trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
              <h4 className="font-headline font-bold text-primary uppercase text-sm">Top Catégories</h4>
              <div className="space-y-4">
                {[
                  { label: 'Santé & Vitalité', value: 65, color: 'bg-primary-container' },
                  { label: 'Perte de Poids', value: 25, color: 'bg-secondary' },
                  { label: 'Business Opportunity', value: 10, color: 'bg-tertiary' },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-label uppercase text-outline">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
              <h4 className="font-headline font-bold text-primary uppercase text-sm">Conversion Funnel</h4>
              <div className="space-y-4">
                {[
                  { label: 'Visiteurs', value: 1240, color: 'bg-primary-container/20' },
                  { label: 'Conversations AI', value: 450, color: 'bg-primary-container/40' },
                  { label: 'Leads Qualifiés', value: 85, color: 'bg-primary-container/60' },
                  { label: 'Ventes', value: 12, color: 'bg-primary-container' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`h-8 rounded flex items-center justify-center text-[10px] font-black text-primary ${item.color}`} style={{ width: `${100 - (i * 15)}%` }}>
                      {item.label}
                    </div>
                    <span className="text-xs font-bold text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-headline font-bold text-primary uppercase">Logs Système GMBC-OS</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-label uppercase text-outline tracking-widest">Live Feed</span>
              </div>
            </div>
            <div className="space-y-3 font-mono text-[10px]">
              {[
                { time: "11:49:11", msg: "Coach José: Diagnostic AI terminé pour prospect #8829", type: "success" },
                { time: "11:45:02", msg: "SmartLink: Code unique 'startupforworld' vérifié et actif", type: "info" },
                { time: "11:30:45", msg: "Analytics: Calcul du taux de conversion hebdomadaire (12.4%)", type: "info" },
                { time: "11:15:22", msg: "Security: Accès autorisé pour l'administrateur makoutodemarket@gmail.com", type: "success" },
                { time: "10:55:00", msg: "System: GMBC-OS v2.5.0 démarré avec succès", type: "info" },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 p-2 bg-surface-container-highest/30 rounded border-l-2 border-primary/20">
                  <span className="text-outline whitespace-nowrap">[{log.time}]</span>
                  <span className={cn(
                    "flex-1",
                    log.type === "success" ? "text-green-500" : "text-primary"
                  )}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PRODUCTS' && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Rechercher un produit..." 
                className="w-full bg-surface-container p-3 pl-10 rounded-xl border border-outline-variant/10 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAssets(!showAssets)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                  showAssets ? "bg-primary text-on-primary border-primary" : "bg-surface-container border-outline-variant/10 text-outline hover:text-primary"
                )}
              >
                {showAssets ? 'Fermer la Bibliothèque' : 'Ma Bibliothèque'}
              </button>
              <button className="px-4 py-2 bg-surface-container border border-outline-variant/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-all">Tous</button>
              <button className="px-4 py-2 bg-surface-container border border-outline-variant/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-all">Nutrition</button>
              <button className="px-4 py-2 bg-surface-container border border-outline-variant/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-all">Soins</button>
            </div>
          </div>

          {showAssets && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-surface-container p-6 rounded-xl border border-primary/20 space-y-6"
            >
              <h3 className="text-xl font-headline font-bold text-primary uppercase flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mes Actifs Sauvegardés
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketingAssets.length === 0 ? (
                  <p className="text-sm text-outline italic col-span-full text-center py-8">Aucun actif sauvegardé pour le moment.</p>
                ) : (
                  marketingAssets.map((asset) => (
                    <div key={asset.id} className="p-4 bg-surface-container-highest rounded-xl border border-outline-variant/10 space-y-4">
                      {asset.imageUrl && (
                        <img src={asset.imageUrl} alt={asset.topic} className="w-full aspect-video object-cover rounded-lg" referrerPolicy="no-referrer" />
                      )}
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest">{asset.platform} • {asset.type}</p>
                        <h4 className="text-sm font-bold text-on-surface line-clamp-1">{asset.topic}</h4>
                        <p className="text-xs text-outline line-clamp-3 leading-relaxed">{asset.content}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(asset.content);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
                        >
                          Copier Texte
                        </button>
                        {asset.imageUrl && (
                          <a 
                            href={asset.imageUrl} 
                            download 
                            className="p-2 bg-surface-container rounded-lg text-outline hover:text-primary transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 1, name: 'Tre-en-en', pv: 24, price: '35,000 FCFA', category: 'NUTRITION', desc: 'Concentré de grains entiers pour l\'énergie cellulaire.', benefits: ['Énergie durable', 'Santé cellulaire', 'Absorption optimale'], image: 'https://picsum.photos/seed/tre/400/300' },
              { id: 2, name: 'Pro Vitality', pv: 42, price: '55,000 FCFA', category: 'NUTRITION', desc: 'Pack quotidien de nutriments essentiels.', benefits: ['Cœur sain', 'Immunité forte', 'Peau éclatante'], image: 'https://picsum.photos/seed/vitality/400/300' },
              { id: 3, name: 'Carotenoid Complex', pv: 35, price: '48,000 FCFA', category: 'NUTRITION', desc: 'Protection antioxydante puissante.', benefits: ['Protection immunitaire', 'Santé oculaire', 'Antioxydant puissant'], image: 'https://picsum.photos/seed/caro/400/300' },
              { id: 4, name: 'Salmon Oil Plus', pv: 28, price: '42,000 FCFA', category: 'NUTRITION', desc: 'Oméga-3 pur pour le cœur et le cerveau.', benefits: ['Santé cardiovasculaire', 'Fonction cérébrale', 'Articulations souples'], image: 'https://picsum.photos/seed/salmon/400/300' },
              { id: 5, name: 'NeoLifeShake', pv: 30, price: '45,000 FCFA', category: 'NUTRITION', desc: 'Substitut de repas riche en protéines.', benefits: ['Gestion du poids', 'Énergie musculaire', 'Contrôle glycémique'], image: 'https://picsum.photos/seed/shake/400/300' },
              { id: 6, name: 'Super 10', pv: 15, price: '12,000 FCFA', category: 'MAISON', desc: 'Nettoyant multi-usage ultra concentré.', benefits: ['Économique', 'Biodégradable', 'Puissant'], image: 'https://picsum.photos/seed/super10/400/300' },
              { id: 7, name: 'LDC', pv: 12, price: '10,000 FCFA', category: 'MAISON', desc: 'Nettoyant doux pour la vaisselle et les mains.', benefits: ['Doux pour les mains', 'Polyvalent', 'Rinçage facile'], image: 'https://picsum.photos/seed/ldc/400/300' },
              { id: 8, name: 'Aloe Vera Plus', pv: 10, price: '15,000 FCFA', category: 'NUTRITION', desc: 'Boisson rafraîchissante et apaisante.', benefits: ['Digestion saine', 'Récupération', 'Hydratation'], image: 'https://picsum.photos/seed/aloe/400/300' },
            ].filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((product) => (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className="bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden group hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="aspect-video bg-surface-container-highest overflow-hidden relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-primary/10 text-primary rounded text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">
                    {product.pv} PV
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">{product.category}</p>
                    <h4 className="text-lg font-headline font-bold text-on-surface">{product.name}</h4>
                  </div>
                  <p className="text-xs text-outline line-clamp-2 leading-relaxed">
                    {product.desc}
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-primary">{product.price}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMarketingTopic(product.name);
                          setActiveTab('MARKETING');
                        }}
                        className="p-2 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all animate-glow-pulse border border-primary/20"
                        title="Générer marketing"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`Découvrez ${product.name} sur ma boutique NeoLife : ${distributor.shopUrl}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-2 bg-surface-container-highest text-outline rounded-lg hover:text-primary transition-all hover:border-primary/50 border border-transparent"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'TEAM' && (
        <div className="space-y-8">
          {/* Team Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Équipe', value: '156', icon: Users, color: 'text-primary' },
              { label: 'Nouveaux (30j)', value: '+12', icon: UserPlus, color: 'text-green-500' },
              { label: 'PV Groupe', value: '4,250', icon: TrendingUp, color: 'text-secondary' },
              { label: 'Conversion Moy.', value: '12.4%', icon: Zap, color: 'text-yellow-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-2">
                <div className="flex justify-between items-start">
                  <div className={cn("p-2 rounded-lg bg-surface-container-highest", stat.color)}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black text-outline uppercase tracking-widest">Temps Réel</span>
                </div>
                <p className="text-2xl font-headline font-bold text-primary uppercase">{stat.value}</p>
                <p className="text-[10px] font-label uppercase text-outline tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Comparison View */}
          {selectedMembers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container p-8 rounded-xl border border-primary/30 space-y-8 shadow-[0_0_20px_rgba(0,242,255,0.05)]"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-primary uppercase">Comparaison de Performance</h3>
                </div>
                <button 
                  onClick={() => setSelectedMembers([])}
                  className="px-4 py-2 bg-surface-container-highest text-outline hover:text-primary rounded text-[10px] font-label uppercase tracking-widest transition-all"
                >
                  Effacer la sélection ({selectedMembers.length})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.length === 0 ? (
                  <div className="col-span-full p-12 text-center border border-dashed border-outline-variant/20 rounded-xl">
                    <Users className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                    <p className="text-sm text-outline italic">Aucun membre sélectionné ou équipe vide.</p>
                  </div>
                ) : (
                  teamMembers
                  .filter((m: any) => selectedMembers.includes(m.name))
                  .map((member: any, i: number) => (
                    <div key={i} className="p-6 bg-surface-container-highest rounded-xl border border-outline-variant/20 space-y-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                      
                      <div className="flex items-center gap-4 relative">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold border border-primary/20 overflow-hidden">
                          {member.photoURL ? (
                            <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.name[0]
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{member.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                            member.rank === 'DIRECTOR' ? 'bg-primary/20 text-primary' : 
                            member.rank === 'MANAGER' ? 'bg-green-500/20 text-green-500' : 
                            'bg-outline/20 text-outline'
                          }`}>
                            {member.rank || 'Distributeur'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 relative">
                        <div className="space-y-1">
                          <p className="text-[8px] text-outline uppercase tracking-widest">Leads</p>
                          <p className="text-lg font-mono font-bold text-primary">{member.leadsCount || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] text-outline uppercase tracking-widest">Ventes</p>
                          <p className="text-lg font-mono font-bold text-primary">{member.salesCount || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] text-outline uppercase tracking-widest">Conv.</p>
                          <p className="text-lg font-mono font-bold text-primary">{member.conversionRate || 0}%</p>
                        </div>
                      </div>

                      <div className="space-y-2 relative">
                        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${( (member.conversionRate || 0) / 20) * 100}%` }}
                            className="h-full bg-primary" 
                          />
                        </div>
                        <p className="text-[8px] text-outline uppercase tracking-widest text-right">Efficacité Conversion</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Visual Comparison Chart */}
              <div className="h-[200px] w-full bg-surface-container-highest/30 rounded-xl p-4 border border-outline-variant/10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamMembers.filter((m: any) => selectedMembers.includes(m.name))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a494b33" vertical={false} />
                    <XAxis dataKey="name" stroke="#3a494b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#3a494b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1b1b1f', border: '1px solid #3a494b', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '10px' }}
                    />
                    <Bar dataKey="leadsCount" fill="#00f2ff" radius={[4, 4, 0, 0]} name="Leads" />
                    <Bar dataKey="salesCount" fill="#00f2ff66" radius={[4, 4, 0, 0]} name="Ventes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-xl font-headline font-bold text-primary uppercase">Performance de la Downline</h3>
                    <p className="text-[10px] text-outline uppercase tracking-widest">Comparaison en temps réel des indicateurs clés</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`Rejoins mon équipe NeoLife et utilise le système GMBC-OS pour automatiser ton business ! Inscription ici : ${distributor.shopUrl}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-6 py-2 bg-primary text-on-primary rounded font-label text-[10px] uppercase tracking-widest font-bold animate-glow-pulse hover:scale-105 transition-all"
                  >
                    {copied ? 'Lien Copié !' : 'Inviter une Recrue'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-outline">
                          <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3" />
                            Membre
                          </div>
                        </th>
                        {[
                          { key: 'leads', label: 'Leads' },
                          { key: 'sales', label: 'Ventes' },
                          { key: 'conversion', label: 'Taux Conv.' }
                        ].map(col => (
                          <th 
                            key={col.key}
                            onClick={() => {
                              if (teamSortKey === col.key) {
                                setTeamSortOrder(teamSortKey === col.key && teamSortOrder === 'desc' ? 'asc' : 'desc');
                              } else {
                                setTeamSortKey(col.key);
                                setTeamSortOrder('desc');
                              }
                            }}
                            className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-outline cursor-pointer hover:text-primary transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {teamSortKey === col.key && (
                                <TrendingUp className={cn("w-3 h-3", teamSortOrder === 'asc' ? "rotate-180" : "")} />
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-[10px] font-label uppercase tracking-widest text-outline text-right">Comparer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {teamMembers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-outline italic text-sm">
                            Vous n'avez pas encore de membres dans votre équipe. Partagez votre lien pour recruter !
                          </td>
                        </tr>
                      ) : (
                        teamMembers
                        .sort((a: any, b: any) => {
                          const valA = a[teamSortKey] || 0;
                          const valB = b[teamSortKey] || 0;
                          return teamSortOrder === 'asc' ? valA - valB : valB - valA;
                        })
                        .map((member, i) => (
                          <tr 
                            key={i} 
                            className={cn(
                              "hover:bg-surface-container-highest/50 transition-colors group",
                              selectedMembers.includes(member.name) ? "bg-primary/5" : ""
                            )}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
                                  {member.photoURL ? (
                                    <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-outline" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-bold">{member.name}</p>
                                  <p className={`text-[8px] font-black uppercase tracking-tighter ${
                                    member.rank === 'DIRECTOR' ? 'text-primary' : 
                                    member.rank === 'MANAGER' ? 'text-green-500' : 
                                    'text-outline'
                                  }`}>{member.rank || 'Distributeur'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm font-mono">{member.leadsCount || 0}</td>
                            <td className="px-4 py-4 text-sm font-mono">{member.salesCount || 0}</td>
                            <td className="px-4 py-4 text-sm font-mono text-primary">{member.conversionRate || 0}%</td>
                            <td className="px-4 py-4 text-right">
                              <button 
                                onClick={() => {
                                  if (selectedMembers.includes(member.name)) {
                                    setSelectedMembers(selectedMembers.filter(m => m !== member.name));
                                  } else {
                                    if (selectedMembers.length < 3) {
                                      setSelectedMembers([...selectedMembers, member.name]);
                                    }
                                  }
                                }}
                                className={cn(
                                  "w-6 h-6 rounded border flex items-center justify-center transition-all ml-auto",
                                  selectedMembers.includes(member.name)
                                    ? "bg-primary border-primary text-on-primary"
                                    : "border-outline-variant/30 text-transparent hover:border-primary"
                                )}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-lg font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top Performeurs
                </h3>
                <div className="space-y-4">
                  {teamMembers.length === 0 ? (
                    <p className="text-[10px] text-outline italic text-center py-4">Aucune donnée disponible.</p>
                  ) : (
                    teamMembers
                    .sort((a: any, b: any) => (b.salesCount || 0) - (a.salesCount || 0))
                    .slice(0, 3)
                    .map((top: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-surface-container-highest rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">{top.name}</p>
                            <p className="text-[8px] text-outline uppercase tracking-widest">{top.rank || 'Distributeur'}</p>
                          </div>
                        </div>
                        <p className="text-xs font-mono font-bold text-primary">{top.salesCount || 0} Ventes</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-xl font-headline font-bold text-primary uppercase">Scripts de Vente</h3>
                <div className="space-y-4">
                  {[
                    { title: "Approche Santé", desc: "Script pour le Pack Vitalité" },
                    { title: "Opportunité Business", desc: "Script pour le recrutement" },
                    { title: "Relance Client", desc: "Script après 30 jours" }
                  ].map((script, i) => (
                    <div key={i} className="p-4 bg-surface-container-highest rounded-xl border border-outline-variant/10 group cursor-pointer hover:border-primary/50 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-xs font-bold uppercase tracking-tight">{script.title}</h5>
                        <Copy className="w-3 h-3 text-outline group-hover:text-primary" />
                      </div>
                      <p className="text-[10px] text-outline leading-relaxed">{script.desc}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setMarketingTopic("Nouveau Script de Vente");
                    setActiveTab('MARKETING');
                  }}
                  className="w-full py-3 border border-outline-variant/20 text-outline rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all animate-glow-pulse"
                >
                  Ajouter un Script
                </button>
              </div>

              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Video className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-primary uppercase">Scripts Vidéo (Reels/TikTok)</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Hook : 'Marre d'être fatigué ?'", type: "Short Form" },
                    { title: "Storytelling : Mon parcours NeoLife", type: "Long Form" },
                    { title: "Déballage : Pack Vitalité", type: "Product Focus" }
                  ].map((script, i) => (
                    <div key={i} className="p-4 bg-surface-container-highest rounded-xl border border-outline-variant/10 group cursor-pointer hover:border-primary/50 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-xs font-bold uppercase tracking-tight">{script.title}</h5>
                        <span className="text-[8px] font-bold text-outline uppercase">{script.type}</span>
                      </div>
                      <button className="text-[8px] font-black uppercase text-primary tracking-widest flex items-center gap-1 mt-2">
                        <Sparkles className="w-3 h-3" />
                        Générer le script complet par IA
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'TRAINING' && (
        <div className="space-y-8">
          <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-headline font-bold text-primary uppercase tracking-tight">Académie GMBC-OS</h3>
                <p className="text-outline text-xs uppercase tracking-widest font-bold mt-1">Maîtrisez l'art de l'automatisation MLM</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Nouveaux Modules</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingModules.map((module) => (
                <div 
                  key={module.id} 
                  onClick={() => setSelectedModule(module)}
                  className="bg-surface-container-highest rounded-2xl border border-outline-variant/10 overflow-hidden hover:border-primary/50 transition-all group cursor-pointer flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={module.image} 
                      alt={module.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="px-2 py-1 bg-primary text-on-primary text-[8px] font-black uppercase tracking-widest rounded">
                        {module.category}
                      </span>
                      <div className="flex items-center gap-1 text-white text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        {module.duration}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {module.title}
                      </h4>
                      <p className="text-[10px] text-outline uppercase tracking-widest font-bold">
                        {module.lessons} Leçons • {module.progress}% Complété
                      </p>
                    </div>
                    
                    <div className="pt-4 mt-auto">
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${module.progress}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                    
                    <button className="w-full py-3 bg-surface-container text-outline rounded-xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-primary group-hover:text-on-primary transition-all">
                      {module.progress === 100 ? 'Revoir' : module.progress > 0 ? 'Continuer' : 'Commencer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Webinaires en Direct</h4>
              <div className="space-y-4">
                {[
                  { title: "Masterclass Recrutement", date: "Demain, 19:00", host: "Coach José" },
                  { title: "Stratégie WhatsApp 2024", date: "Jeudi, 20:30", host: "Sarah M." }
                ].map((webinar, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-container-highest rounded-xl border border-outline-variant/5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-primary uppercase">{webinar.title}</p>
                      <p className="text-[10px] text-outline uppercase tracking-widest">{webinar.date} • {webinar.host}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setMarketingTopic(webinar.title);
                        setActiveTab('MARKETING');
                      }}
                      className="px-4 py-2 bg-primary/10 text-primary rounded text-[8px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all animate-glow-pulse border border-primary/30"
                    >
                      S'inscrire
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Ressources Utiles</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "Guide PDF", icon: FileText },
                  { title: "Scripts", icon: MessageSquare },
                  { title: "Visuels", icon: Image },
                  { title: "FAQ", icon: HelpCircle }
                ].map((res, i) => (
                  <button key={i} className="flex items-center gap-3 p-4 bg-surface-container-highest rounded-xl hover:bg-primary/5 transition-all group">
                    <div className="p-2 bg-surface-container rounded-lg text-outline group-hover:text-primary transition-colors">
                      <res.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline group-hover:text-primary">{res.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-4xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-headline font-bold text-primary uppercase flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profil Distributeur
                  </h3>
                  <button 
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-[10px] font-bold text-primary uppercase underline flex items-center gap-1"
                  >
                    {isEditingProfile ? 'Annuler' : <><Edit3 className="w-3 h-3" /> Modifier</>}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center gap-6 pb-4 border-b border-outline-variant/10">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-surface-container-highest border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                        {profileImageFile ? (
                          <img src={URL.createObjectURL(profileImageFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : profileData.photoURL ? (
                          <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-outline/30" />
                        )}
                      </div>
                      {isEditingProfile && (
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                          <Camera className="w-6 h-6 text-white" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setProfileImageFile(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">{distributor.name}</h4>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">{distributor.rank}</p>
                      <p className="text-xs text-outline">{distributor.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-label uppercase text-outline tracking-widest">Email (Non modifiable)</label>
                      <input 
                        disabled
                        value={distributor.email}
                        className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl p-3 text-sm text-outline opacity-50 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-label uppercase text-outline tracking-widest">Nom Public</label>
                      <input 
                        disabled={!isEditingProfile}
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl p-3 text-sm text-primary disabled:opacity-50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-label uppercase text-outline tracking-widest">ID NeoLife</label>
                      <input 
                        disabled={!isEditingProfile}
                        value={profileData.neolifeId}
                        onChange={(e) => setProfileData({...profileData, neolifeId: e.target.value})}
                        className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl p-3 text-sm text-primary disabled:opacity-50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase text-outline tracking-widest">Rang Actuel</label>
                    <select 
                      disabled={!isEditingProfile}
                      value={profileData.rank}
                      onChange={(e) => setProfileData({...profileData, rank: e.target.value})}
                      className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl p-3 text-sm text-primary disabled:opacity-50 focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="DISTRIBUTOR">Distributeur</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SENIOR_MANAGER">Senior Manager</option>
                      <option value="DIRECTOR">Directeur</option>
                      <option value="EMERALD_DIRECTOR">Directeur Émeraude</option>
                      <option value="WORLD_TEAM">World Team</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase text-outline tracking-widest">Bio / Slogan</label>
                    <textarea 
                      disabled={!isEditingProfile}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl p-3 text-sm text-primary disabled:opacity-50 h-24 resize-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Partagez votre vision..."
                    />
                  </div>

                  {isEditingProfile && (
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile}
                      className="w-full py-4 bg-primary text-on-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      {isUpdatingProfile ? (
                        <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Sauvegarder les modifications
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-xl font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Sécurité & Compte
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-surface-container-highest/30 rounded-xl border border-outline-variant/5">
                    <div>
                      <p className="text-sm font-bold text-on-surface">Email de connexion</p>
                      <p className="text-xs text-outline">{distributor.email}</p>
                    </div>
                    <button className="text-[10px] font-bold text-primary uppercase tracking-widest">Modifier</button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-surface-container-highest/30 rounded-xl border border-outline-variant/5">
                    <div>
                      <p className="text-sm font-bold text-on-surface">Mot de passe</p>
                      <p className="text-xs text-outline">Mis à jour il y a 3 mois</p>
                    </div>
                    <button className="text-[10px] font-bold text-primary uppercase tracking-widest">Changer</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-xl font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Nouveaux Prospects', enabled: true },
                    { label: 'Ventes Équipe', enabled: true },
                    { label: 'Rapports Hebdomadaires', enabled: false },
                    { label: 'Alertes Marketing AI', enabled: true },
                  ].map((notif, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-on-surface">{notif.label}</span>
                      <button className={cn(
                        "w-10 h-5 rounded-full relative transition-all",
                        notif.enabled ? "bg-primary" : "bg-outline/20"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          notif.enabled ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 space-y-6">
                <h3 className="text-xl font-headline font-bold text-primary uppercase flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Langue & Région
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase text-outline tracking-widest">Langue</label>
                    <select className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl p-3 text-sm text-primary">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label uppercase text-outline tracking-widest">Fuseau Horaire</label>
                    <select className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl p-3 text-sm text-primary">
                      <option value="GMT">GMT (Abidjan, Dakar)</option>
                      <option value="WAT">WAT (Lagos, Douala)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container p-8 rounded-2xl border border-outline-variant/20 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container font-bold text-xl">
                    {selectedLead.name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-primary uppercase">{selectedLead.name}</h3>
                    <p className="text-xs text-outline">ID: {selectedLead.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-surface-container-highest rounded-full text-outline transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-surface-container-highest rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-label uppercase text-outline tracking-widest">Notes Personnelles</p>
                    <button 
                      onClick={handleSaveLeadNotes}
                      disabled={isSavingNotes}
                      className="text-[8px] font-bold uppercase text-primary hover:underline flex items-center gap-1"
                    >
                      {isSavingNotes ? <Loader2 className="w-2 h-2 animate-spin" /> : <Save className="w-2 h-2" />}
                      Enregistrer
                    </button>
                  </div>
                  <textarea 
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Ajoutez des notes sur ce prospect (appels, intérêts spécifiques...)"
                    className="w-full bg-transparent border-none p-0 text-xs text-on-surface focus:ring-0 min-h-[60px] resize-none"
                  />
                </div>

                <div className="p-4 bg-surface-container-highest rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-label uppercase text-outline tracking-widest">Besoins & Diagnostic AI</p>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                      selectedLead.score > 70 ? "bg-green-500/10 text-green-500" : "bg-outline/10 text-outline"
                    )}>
                      Score Qualité: {selectedLead.score}%
                    </span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">{selectedLead.needs}</p>
                </div>

                {/* AI Follow-up Section */}
                <div className="p-4 bg-primary-container/5 border border-primary-container/20 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-label uppercase text-primary tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Relance Stratégique IA
                    </p>
                    <button 
                      onClick={() => generateFollowUp(selectedLead)}
                      className="text-[8px] font-bold uppercase text-primary hover:underline"
                    >
                      Régénérer
                    </button>
                  </div>
                  
                  {isGeneratingFollowUp ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-[10px] text-outline italic">José prépare votre message...</span>
                    </div>
                  ) : aiFollowUp ? (
                    <div className="space-y-3">
                      <p className="text-xs text-on-surface-variant italic leading-relaxed">"{aiFollowUp}"</p>
                      <button 
                        onClick={() => {
                          const text = encodeURIComponent(aiFollowUp);
                          window.open(`https://wa.me/${distributor.whatsapp}?text=${text}`, '_blank');
                        }}
                        className="w-full py-2 bg-primary-container text-on-primary rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Envoyer via WhatsApp
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => generateFollowUp(selectedLead)}
                      className="w-full py-3 border border-dashed border-primary-container/40 rounded-lg text-[10px] font-bold uppercase text-primary hover:bg-primary-container/5 transition-all"
                    >
                      Générer une relance personnalisée
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container-highest rounded-xl space-y-1">
                    <p className="text-[10px] font-label uppercase text-outline tracking-widest">Statut Actuel</p>
                    <select 
                      value={selectedLead.status}
                      onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                      className="bg-transparent border-none p-0 text-sm font-bold text-primary-container focus:ring-0"
                    >
                      <option value="NEW">Nouveau</option>
                      <option value="ACTIVE">En cours</option>
                      <option value="CONVERTED">Converti</option>
                      <option value="LOST">Perdu</option>
                    </select>
                  </div>
                  <div className="p-4 bg-surface-container-highest rounded-xl space-y-1">
                    <p className="text-[10px] font-label uppercase text-outline tracking-widest">Date d'entrée</p>
                    <p className="text-sm font-bold text-primary">
                      {selectedLead.createdAt?.toDate ? selectedLead.createdAt.toDate().toLocaleDateString() : 'Récemment'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/10 space-y-4">
                  <button 
                    onClick={() => setActiveTab('ANALYTICS')}
                    className="w-full py-3 bg-surface-container-highest rounded-xl text-[10px] font-bold uppercase text-outline hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Voir l'Historique de Conversation AI
                  </button>
                  
                  <div className="p-4 bg-surface-container-highest/30 rounded-xl border border-outline-variant/5 space-y-2">
                    <p className="text-[8px] font-label uppercase text-outline tracking-widest">Métadonnées Techniques</p>
                    <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-outline/60">
                      <p>Distributor ID: {distributor.uid.slice(0, 8)}...</p>
                      <p>Visitor ID: {selectedLead.id.slice(0, 8)}...</p>
                      <p>Source: SmartLink</p>
                      <p>Engine: Gemini 3 Flash</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <a 
                  href={`tel:${distributor.whatsapp}`}
                  className="flex-1 py-4 bg-primary-container text-on-primary rounded-xl font-label font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  Appeler
                </a>
                <button 
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="flex-1 py-4 bg-error/10 text-error rounded-xl font-label font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-error/20 transition-all border border-error/20"
                >
                  <Trash2 className="w-5 h-5" />
                  Supprimer
                </button>
                <button 
                  onClick={exportLeads}
                  className="flex-1 py-4 bg-surface-container-highest text-primary rounded-xl font-label font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all border border-outline-variant/20"
                >
                  <Download className="w-5 h-5" />
                  Exporter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4">
          <h4 className="font-headline font-bold text-primary uppercase text-sm">Liens Rapides</h4>
          <div className="grid grid-cols-2 gap-4">
            <a 
              href={distributor.shopUrl} 
              target="_blank" 
              className="flex items-center justify-center gap-2 p-4 bg-surface-container-highest rounded-lg hover:brightness-110 transition-all text-sm font-label uppercase tracking-widest text-primary"
            >
              <ShoppingCart className="w-4 h-4" />
              Ma Boutique
            </a>
            <a 
              href={`https://wa.me/${distributor.whatsapp}`} 
              target="_blank" 
              className="flex items-center justify-center gap-2 p-4 bg-surface-container-highest rounded-lg hover:brightness-110 transition-all text-sm font-label uppercase tracking-widest text-primary"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
        
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-label uppercase text-outline tracking-widest">Plan Actuel</p>
            <p className="text-xl font-headline font-bold text-primary uppercase">{distributor.plan}</p>
          </div>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className="px-6 py-3 bg-secondary text-on-secondary rounded font-label text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-all"
          >
            Changer de Plan
          </button>
        </div>
      </div>
      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container rounded-3xl border border-outline-variant/20 overflow-hidden shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-square bg-surface-container-highest overflow-hidden relative">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-primary text-on-primary rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {selectedProduct.pv} PV
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedProduct.category}</p>
                    <h3 className="text-3xl font-headline font-bold text-on-surface">{selectedProduct.name}</h3>
                    <p className="text-xl font-bold text-primary">{selectedProduct.price}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Description</h4>
                    <p className="text-sm text-outline leading-relaxed">
                      {selectedProduct.desc}
                    </p>
                  </div>

                  {selectedProduct.benefits && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Bénéfices Clés</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.benefits.map((benefit: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-surface-container-highest text-primary rounded-full text-[10px] font-bold uppercase tracking-tight">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Actions AI</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          setMarketingTopic(`Promotion du produit ${selectedProduct.name}`);
                          setMarketingType('POST');
                          setActiveTab('MARKETING');
                          setSelectedProduct(null);
                        }}
                        className="flex items-center justify-center gap-2 p-3 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        Créer Post
                      </button>
                      <button 
                        onClick={() => {
                          setMarketingTopic(`Script vidéo pour ${selectedProduct.name}`);
                          setMarketingType('SCRIPT');
                          setActiveTab('MARKETING');
                          setSelectedProduct(null);
                        }}
                        className="flex items-center justify-center gap-2 p-3 bg-surface-container-highest text-outline rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-all"
                      >
                        <Video className="w-4 h-4" />
                        Script Vidéo
                      </button>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-primary text-on-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                    Commander pour un client
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Actions FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('MARKETING')}
          className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:brightness-110 transition-all group relative"
        >
          <Sparkles className="w-6 h-6" />
          <div className="absolute right-full mr-4 px-3 py-1 bg-surface-container border border-outline-variant/10 rounded text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Assistant AI
          </div>
        </motion.button>
      </div>
    </div>
  );
}
