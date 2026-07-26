import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  WifiOff,
  Home,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorType = "500" | "TOKEN_EXPIRED" | "NETWORK_ERROR" | "GENERIC";

interface ErrorPageProps {
  errorCode?: ErrorType;
  title?: string;
  description?: string;
  onRetry?: () => void;
  showBackButton?: boolean;
}

const errorConfig: Record<
  ErrorType,
  { icon: typeof AlertTriangle; color: string; bg: string; border: string; label: string; title: string; description: string }
> = {
  "500": {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500",
    label: "Error 500",
    title: "Terjadi Kesalahan Server",
    description:
      "Server mengalami gangguan yang tidak terduga. Tim teknis telah diberitahu. Silakan coba lagi dalam beberapa saat.",
  },
  TOKEN_EXPIRED: {
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500",
    label: "Sesi Berakhir",
    title: "Sesi Telah Berakhir",
    description:
      "Sesi login Anda telah berakhir karena sudah melewati batas waktu. Silakan login kembali untuk melanjutkan.",
  },
  NETWORK_ERROR: {
    icon: WifiOff,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    label: "Koneksi Gagal",
    title: "Gagal Terhubung ke Server",
    description:
      "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.",
  },
  GENERIC: {
    icon: AlertCircle,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-muted-foreground/30",
    label: "Terjadi Kesalahan",
    title: "Ada Yang Salah",
    description:
      "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.",
  },
};

export function ErrorPage({
  errorCode = "GENERIC",
  title,
  description,
  onRetry,
  showBackButton = true,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const config = errorConfig[errorCode];
  const Icon = config.icon;

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
          <div className={`w-24 h-24 rounded-full ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-12 h-12 ${config.color}`} />
          </div>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`absolute inset-0 rounded-full border-2 ${config.border}`}
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <p className={`text-sm font-semibold uppercase tracking-widest ${config.color}`}>
            {config.label}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {title || config.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description || config.description}
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          {showBackButton && (
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          )}
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </Button>
          )}
          <Button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Ke Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
