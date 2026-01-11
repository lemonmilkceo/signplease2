import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getContract, Contract } from "@/lib/contract-api";
import { FileText, ChevronRight, Clock, CheckCircle2, Loader2, MapPin, Building2, Wallet } from "lucide-react";
import { CardSlide } from "@/components/ui/card-slide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContracts() {
      try {
        // Fetch pending contracts (public access via RLS)
        const { data: pendingData, error: pendingError } = await supabase
          .from('contracts')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (pendingError) throw pendingError;

        // Fetch contracts assigned to this worker
        let assignedData: Contract[] = [];
        if (user) {
          const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('worker_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          assignedData = (data || []) as Contract[];
        }

        // Combine and deduplicate
        const allContracts = [...(pendingData || []), ...assignedData] as Contract[];
        const uniqueContracts = allContracts.filter(
          (contract, index, self) =>
            index === self.findIndex((c) => c.id === contract.id)
        );

        setContracts(uniqueContracts);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        toast.error('계약서를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchContracts();
  }, [user]);

  const pendingContracts = contracts.filter((c) => c.status === 'pending');
  const completedContracts = contracts.filter((c) => c.status === 'completed');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <Clock className="w-3 h-3" />
            서명 필요
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {profile?.name || '근로자'}님 👋
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
                    className="p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-body font-semibold text-foreground truncate">
                            {contract.employer_name}
                          </p>
                          {getStatusBadge(contract.status)}
                        </div>
                        <div className="space-y-1">
                          {(contract as any).business_name && (
                            <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{(contract as any).business_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-caption text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Wallet className="w-3.5 h-3.5" />
                              <span>시급 {contract.hourly_wage.toLocaleString()}원</span>
                            </div>
                            <span>·</span>
                            <span>{contract.work_days.length > 3 ? `주 ${contract.work_days.length}일` : contract.work_days.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
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
                    className="p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-body font-semibold text-foreground truncate">
                            {contract.employer_name}
                          </p>
                          {getStatusBadge(contract.status)}
                        </div>
                        <div className="space-y-1">
                          {(contract as any).business_name && (
                            <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{(contract as any).business_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-caption text-muted-foreground">
                            <span>{contract.start_date} 시작</span>
                            <span>·</span>
                            <span>{contract.work_start_time} ~ {contract.work_end_time}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
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