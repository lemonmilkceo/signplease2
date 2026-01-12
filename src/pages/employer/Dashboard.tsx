import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { Plus, FileText, Clock, CheckCircle2, ChevronRight, Building2 } from "lucide-react";
import { CardSlide } from "@/components/ui/card-slide";
import { LoadingSpinner } from "@/components/ui/loading";
import { getEmployerContracts, Contract } from "@/lib/contract-api";
import { CreditsBadge } from "@/components/CreditsBadge";
import { AppDrawer } from "@/components/AppDrawer";
import { toast } from "sonner";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isDemo, contracts: demoContracts, user: demoUser, contractForm } = useAppStore();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      if (isDemo) {
        setIsLoading(false);
        return;
      }

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getEmployerContracts(user.id);
        setContracts(data);
      } catch (error) {
        console.error("Error fetching contracts:", error);
        toast.error("계약서 목록을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchContracts();
    }
  }, [user, isDemo, authLoading]);


  // Use demo contracts in demo mode, real contracts otherwise
  const displayContracts = isDemo 
    ? demoContracts.map(c => ({
        id: c.id!,
        employer_id: 'demo',
        worker_id: null,
        employer_name: c.employerName,
        worker_name: c.workerName,
        hourly_wage: c.hourlyWage,
        start_date: c.startDate,
        work_days: c.workDays,
        work_start_time: c.workStartTime,
        work_end_time: c.workEndTime,
        work_location: c.workLocation,
        business_name: c.businessName || null,
        job_description: c.jobDescription || null,
        status: c.status as 'draft' | 'pending' | 'signed' | 'completed',
        employer_signature: c.employerSignature || null,
        worker_signature: c.workerSignature || null,
        contract_content: null,
        created_at: c.createdAt!,
        updated_at: c.createdAt!,
        signed_at: null,
      }))
    : contracts;

  const pendingContracts = displayContracts.filter((c) => c.status === 'pending' || c.status === 'draft');
  const completedContracts = displayContracts.filter((c) => c.status === 'completed');

  const displayName = isDemo ? demoUser?.name : profile?.name;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            임시저장
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <Clock className="w-3 h-3" />
            서명 대기
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

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="로딩 중..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-start justify-between mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-body text-muted-foreground mb-1">안녕하세요,</p>
            <h1 className="text-title text-foreground">
              {displayName || '사장님'} 👋
            </h1>
          </motion.div>

          {!isDemo && user && (
            <AppDrawer userType="employer" />
          )}
        </div>
        
        {/* Credits Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <CreditsBadge />
        </motion.div>
      </div>

      {/* Quick Action */}
      <div className="px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="toss"
            size="full"
            onClick={() => navigate('/employer/create')}
            className="gap-3"
          >
            <Plus className="w-5 h-5" />
            새 계약서 작성하기
          </Button>
        </motion.div>
      </div>

      {/* Pending Contracts */}
      {pendingContracts.length > 0 && (
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-heading font-semibold text-foreground mb-4">
              진행 중
            </h2>
            <div className="space-y-3">
              {pendingContracts.map((contract, index) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <CardSlide
                    onClick={() => navigate(`/employer/contract/${contract.id}`)}
                    className="p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-body font-semibold text-foreground truncate">
                            {contract.worker_name}
                          </p>
                          {getStatusBadge(contract.status)}
                        </div>
                        <div className="space-y-1">
                          {contract.business_name && (
                            <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{contract.business_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-caption text-muted-foreground">
                            <span>시급 {contract.hourly_wage.toLocaleString()}원</span>
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
            transition={{ delay: 0.4 }}
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
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <CardSlide
                    onClick={() => navigate(`/employer/contract/${contract.id}`)}
                    className="p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-body font-semibold text-foreground truncate">
                            {contract.worker_name}
                          </p>
                          {getStatusBadge(contract.status)}
                        </div>
                        <div className="space-y-1">
                          {contract.business_name && (
                            <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{contract.business_name}</span>
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
      {displayContracts.length === 0 && (
        <motion.div
          className="px-6 py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-body text-muted-foreground">
            아직 작성한 계약서가 없어요
          </p>
        </motion.div>
      )}
    </div>
  );
}