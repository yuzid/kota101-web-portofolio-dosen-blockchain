import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";
import { RippleButton } from "./ripple-button";
import { Clock, LogOut, RefreshCw } from "lucide-react";

interface SessionWarningDialogProps {
  open: boolean;
  expiresInSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SessionWarningDialog({
  open,
  expiresInSeconds,
  onExtend,
  onLogout,
}: SessionWarningDialogProps) {
  const [countdown, setCountdown] = useState(expiresInSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCountdown(expiresInSeconds);
  }, [expiresInSeconds, open]);

  useEffect(() => {
    if (!open) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, onLogout]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-sm border-amber-200 dark:border-amber-800">
        <AlertDialogHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3 py-2"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg text-center">
              Sesi Akan Berakhir
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Sesi Anda akan berakhir dalam waktu dekat. Perpanjang sesi untuk
              melanjutkan atau keluar sekarang.
            </AlertDialogDescription>
          </motion.div>
        </AlertDialogHeader>

        <div className="flex justify-center py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={countdown}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-4xl font-bold tabular-nums text-amber-600 dark:text-amber-400"
            >
              {formatCountdown(countdown)}
            </motion.div>
          </AnimatePresence>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar Sekarang
          </Button>
          <RippleButton
            onClick={onExtend}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Perpanjang Sesi
          </RippleButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
