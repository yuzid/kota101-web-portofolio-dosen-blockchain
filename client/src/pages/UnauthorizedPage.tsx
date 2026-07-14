import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { ShieldOff, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-md w-full gap-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 250, damping: 20 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="w-12 h-12 text-destructive" />
          </div>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute inset-0 rounded-full border-2 border-destructive"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-destructive">
            Error 403
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Akses Ditolak
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Anda tidak memiliki izin untuk mengakses halaman ini.
            <br />
            Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <Button onClick={() => navigate("/dashboard", { replace: true })} className="gap-2">
            <Home className="w-4 h-4" />
            Ke Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
