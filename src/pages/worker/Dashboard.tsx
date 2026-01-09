import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import { FileText, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { CardSlide } from "@/components/ui/card-slide";

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { contracts, user } = useAppStore();

  // In real app, would filter by worker's contracts
  const pendingContracts = contracts.filter((c) => c.status === 'pending');
  const completedContracts = contracts.filter((c) => c.status === 'completed');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <Clock className="w-3 h-3" />
            서명 필요
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-body text-muted-foreground mb-1">안녕하세요,</p>
          <h1 className="text-title text-foreground">
            {user?.name || '근로자'}님 👋
          </h1>
        </motion.div>
      </div>

      {/* Pending Contracts */}
      {pendingContracts.length > 0 && (
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-heading font-semibold text-foreground mb-4">
              서명이 필요해요
            </h2>
            <div className="space-y-3">
              {pendingContracts.map((contract, index) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <CardSlide
                    onClick={() => navigate(`/worker/contract/${contract.id}`)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <p className="text-body font-semibold text-foreground">
                          {contract.employerName}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          시급 {contract.hourlyWage.toLocaleString()}원 · {contract.workDays.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(contract.status)}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardSlide>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Completed Contracts */}
      {completedContracts.length > 0 && (
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-heading font-semibold text-foreground mb-4">
              완료된 계약
            </h2>
            <div className="space-y-3">
              {completedContracts.map((contract, index) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <CardSlide
                    onClick={() => navigate(`/worker/contract/${contract.id}`)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-body font-semibold text-foreground">
                          {contract.employerName}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {contract.startDate} 시작
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(contract.status)}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardSlide>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {contracts.length === 0 && (
        <motion.div
          className="px-6 py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-body text-muted-foreground">
            아직 받은 계약서가 없어요
          </p>
        </motion.div>
      )}
    </div>
  );
}
