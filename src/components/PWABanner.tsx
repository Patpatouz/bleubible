import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';

export default function PWABanner() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needUpdate: [needUpdate, setNeedUpdate],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedUpdate(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needUpdate) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:w-80"
        >
          <div className="bg-[#1C1F26] border border-white/10 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-white">
                  {needUpdate ? 'Update Available' : 'App Ready Offline'}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {needUpdate 
                    ? 'A newer version is available. Update now for the latest features and fixes.' 
                    : 'The app is ready to work offline. You can access your bible anywhere.'}
                </p>
              </div>
              <button 
                onClick={close}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                id="close-pwa-banner"
              >
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            
            {needUpdate && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="w-full h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                id="update-app-button"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh App
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
