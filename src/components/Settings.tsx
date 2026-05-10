import { motion } from 'motion/react';
import { 
  ChevronLeft,
  Moon,
  Sun,
  Bell,
  Languages,
  Eye,
  Type,
  Layout,
  Smartphone,
  Shield,
  HelpCircle,
  Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { useReader } from '../lib/ReaderContext';
import { cn } from '../lib/utils';
import { useState } from 'react';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize, isRedLetter, setIsRedLetter } = useReader();
  
  const [notifications, setNotifications] = useState(true);
  const [animations, setAnimations] = useState(true);

  const sections = [
    {
      title: 'Appearance',
      items: [
        { 
          name: 'Dark Mode', 
          description: 'Adjust the app visual style',
          icon: theme === 'dark' ? Moon : Sun, 
          action: toggleTheme, 
          type: 'toggle',
          value: theme === 'dark' 
        },
        { 
          name: 'Typography', 
          description: `Current font size: ${fontSize}px`,
          icon: Type, 
          type: 'slider',
          value: fontSize,
          min: 12,
          max: 32,
          onChange: (val: number) => setFontSize(val)
        },
        { 
          name: 'Red Letter Mode', 
          description: 'Highlight the words of Jesus',
          icon: Eye, 
          action: () => setIsRedLetter(!isRedLetter),
          type: 'toggle',
          value: isRedLetter
        }
      ]
    },
    {
      title: 'Accessibility',
      items: [
        { 
          name: 'UI Animations', 
          description: 'Smooth transitions and effects',
          icon: Smartphone, 
          action: () => setAnimations(!animations),
          type: 'toggle',
          value: animations
        },
        { 
          name: 'High Contrast', 
          description: 'Increase visibility of elements',
          icon: Layout, 
          type: 'toggle',
          value: false 
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          name: 'Notifications', 
          description: 'Daily verses and plan reminders',
          icon: Bell, 
          action: () => setNotifications(!notifications),
          type: 'toggle',
          value: notifications
        },
        { 
          name: 'Language', 
          description: 'Preferred app language',
          icon: Languages, 
          type: 'select',
          value: 'English' 
        }
      ]
    },
    {
      title: 'Data & Privacy',
      items: [
        { 
          name: 'Cloud Sync', 
          description: 'Back up your data across devices',
          icon: Database, 
          type: 'status',
          value: 'Active' 
        },
        { 
          name: 'Privacy Policy', 
          description: 'How we handle your data',
          icon: Shield, 
          type: 'link' 
        }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 pb-32 md:max-w-2xl md:mx-auto bg-app-bg min-h-screen"
    >
      <header className="flex items-center gap-4 mb-10 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-app-surface border border-app-border rounded-2xl text-app-text/40 hover:text-app-text transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.25} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/20">Customize your experience</p>
        </div>
      </header>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary mb-5 px-1 opacity-50">
              {section.title}
            </h2>
            <div className="flex flex-col gap-3">
              {section.items.map((item) => (
                <div 
                  key={item.name}
                  className="flex items-center justify-between p-4 bg-app-surface/50 border border-app-border rounded-[28px] group hover:bg-app-surface transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-app-text/5 flex items-center justify-center text-app-text/30 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                      <item.icon className="w-5 h-5" strokeWidth={1.25} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-app-text/80 group-hover:text-app-text transition-colors">{item.name}</h3>
                      <p className="text-[10px] text-app-text/30 font-medium">{item.description}</p>
                    </div>
                  </div>

                  {item.type === 'slider' && (
                    <div className="flex flex-col gap-2 w-32 shrink-0">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => item.onChange && item.onChange(Math.max(item.min || 12, (item.value as number) - 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-app-text/5 text-app-text/40 hover:text-brand-primary transition-colors"
                        >
                          -
                        </button>
                        <span className="text-[10px] font-black tabular-nums text-brand-primary">{item.value}px</span>
                        <button 
                          onClick={() => item.onChange && item.onChange(Math.min(item.max || 32, (item.value as number) + 1))}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-app-text/5 text-app-text/40 hover:text-brand-primary transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <input 
                        type="range"
                        min={item.min}
                        max={item.max}
                        value={item.value as number}
                        onChange={(e) => item.onChange && item.onChange(parseInt(e.target.value))}
                        className="w-full h-1 bg-app-text/5 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>
                  )}

                  {item.type === 'toggle' && (
                    <button 
                      onClick={item.action}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative p-1 cursor-pointer",
                        item.value ? "bg-brand-primary shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-app-text/10"
                      )}
                    >
                      <div className={cn(
                        "h-full aspect-square rounded-full bg-white transition-all shadow-sm",
                        item.value ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  )}

                  {item.type === 'link' && (
                    <button 
                      onClick={() => item.path && navigate(item.path)}
                      className="p-2 text-app-text/20 group-hover:text-app-text/40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </button>
                  )}

                  {item.type === 'select' && (
                    <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full border border-brand-primary/10">
                      {item.value}
                    </span>
                  )}

                  {item.type === 'status' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/10 text-green-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.value}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center">
        <div className="w-12 h-12 rounded-[20px] bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 mb-4 opacity-20">
          <div className="w-full h-full rounded-[18px] bg-app-bg flex items-center justify-center">
             <Layout className="w-5 h-5 text-brand-primary" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-app-text/10">Bleu Bible v1.2.0</p>
      </div>
    </motion.div>
  );
}
