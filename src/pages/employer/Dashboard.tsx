import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { 
  Plus, FileText, Clock, CheckCircle2, ChevronRight, Building2, 
  Trash2, FolderPlus, X, MoreVertical, Folder, Edit2, FolderOpen,
  MessageCircle, Edit, MapPin, Calendar, Wallet, Briefcase
} from "lucide-react";
import { isContractEditable, getRemainingEditDays } from "@/lib/contract-utils";
import { CardSlide } from "@/components/ui/card-slide";
import { LoadingSpinner } from "@/components/ui/loading";
import { 
  getEmployerContracts, Contract, getFolders, ContractFolder, 
  deleteContracts, createFolder, deleteFolder, moveContractsToFolder, updateFolder 
} from "@/lib/contract-api";
import { CreditsBadge } from "@/components/CreditsBadge";
import { AppDrawer } from "@/components/AppDrawer";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const FOLDER_COLORS = [
  { name: 'gray', class: 'bg-muted text-muted-foreground' },
  { name: 'blue', class: 'bg-blue-500/10 text-blue-500' },
  { name: 'green', class: 'bg-green-500/10 text-green-500' },
  { name: 'yellow', class: 'bg-yellow-500/10 text-yellow-600' },
  { name: 'purple', class: 'bg-purple-500/10 text-purple-500' },
  { name: 'red', class: 'bg-red-500/10 text-red-500' },
];

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { isDemo, contracts: demoContracts, user: demoUser, updateContract: updateDemoContract } = useAppStore();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [folders, setFolders] = useState<ContractFolder[]>([]);
  const [demoFolders, setDemoFolders] = useState<ContractFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Folder view
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ContractFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('gray');
  
  // Contract preview modal
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (isDemo) {
        setIsLoading(false);
        return;
      }

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [contractsData, foldersData] = await Promise.all([
          getEmployerContracts(user.id),
          getFolders(user.id)
        ]);
        setContracts(contractsData);
        setFolders(foldersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
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
        folder_id: null,
      }))
    : contracts;

  // Filter by current folder
  const filteredContracts = currentFolderId 
    ? displayContracts.filter(c => c.folder_id === currentFolderId)
    : displayContracts.filter(c => !c.folder_id);

  const pendingContracts = filteredContracts.filter((c) => c.status === 'pending' || c.status === 'draft');
  const completedContracts = filteredContracts.filter((c) => c.status === 'completed');

  const displayName = isDemo ? demoUser?.name : profile?.name;
  const activeFolders = isDemo ? demoFolders : folders;
  const currentFolder = activeFolders.find(f => f.id === currentFolderId);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredContracts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContracts.map(c => c.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = async () => {
    if (isDemo) {
      // 데모 모드에서는 로컬 상태만 업데이트
      toast.success(`${selectedIds.size}개의 계약서가 삭제되었습니다. (데모)`);
      exitSelectionMode();
      setShowDeleteDialog(false);
      return;
    }
    
    try {
      await deleteContracts(Array.from(selectedIds));
      setContracts(prev => prev.filter(c => !selectedIds.has(c.id)));
      toast.success(`${selectedIds.size}개의 계약서가 삭제되었습니다.`);
      exitSelectionMode();
    } catch (error) {
      console.error("Error deleting contracts:", error);
      toast.error("계약서 삭제에 실패했습니다.");
    }
    setShowDeleteDialog(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    if (isDemo) {
      // 데모 모드에서는 로컬 상태만 업데이트
      const newFolder: ContractFolder = {
        id: `demo-folder-${Date.now()}`,
        user_id: 'demo',
        name: newFolderName.trim(),
        color: newFolderColor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (editingFolder) {
        setDemoFolders(prev => prev.map(f => 
          f.id === editingFolder.id 
            ? { ...f, name: newFolderName.trim(), color: newFolderColor }
            : f
        ));
        toast.success("폴더가 수정되었습니다. (데모)");
      } else {
        setDemoFolders(prev => [...prev, newFolder]);
        toast.success("폴더가 생성되었습니다. (데모)");
      }
      setShowFolderDialog(false);
      setNewFolderName('');
      setNewFolderColor('gray');
      setEditingFolder(null);
      return;
    }
    
    if (!user) return;
    
    try {
      if (editingFolder) {
        const updated = await updateFolder(editingFolder.id, { 
          name: newFolderName.trim(), 
          color: newFolderColor 
        });
        setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
        toast.success("폴더가 수정되었습니다.");
      } else {
        const newFolder = await createFolder(user.id, newFolderName.trim(), newFolderColor);
        setFolders(prev => [...prev, newFolder]);
        toast.success("폴더가 생성되었습니다.");
      }
      setShowFolderDialog(false);
      setNewFolderName('');
      setNewFolderColor('gray');
      setEditingFolder(null);
    } catch (error) {
      console.error("Error creating/updating folder:", error);
      toast.error("폴더 처리에 실패했습니다.");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (isDemo) {
      setDemoFolders(prev => prev.filter(f => f.id !== folderId));
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      toast.success("폴더가 삭제되었습니다. (데모)");
      return;
    }
    
    try {
      await deleteFolder(folderId);
      setFolders(prev => prev.filter(f => f.id !== folderId));
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      toast.success("폴더가 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("폴더 삭제에 실패했습니다.");
    }
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (isDemo) {
      // 데모 모드에서는 폴더 이동 시뮬레이션
      const folderName = folderId ? activeFolders.find(f => f.id === folderId)?.name : '전체';
      toast.success(`${selectedIds.size}개의 계약서를 '${folderName}'(으)로 이동했습니다. (데모)`);
      exitSelectionMode();
      setShowMoveDialog(false);
      return;
    }
    
    try {
      await moveContractsToFolder(Array.from(selectedIds), folderId);
      setContracts(prev => prev.map(c => 
        selectedIds.has(c.id) ? { ...c, folder_id: folderId } : c
      ));
      const folderName = folderId ? activeFolders.find(f => f.id === folderId)?.name : '전체';
      toast.success(`${selectedIds.size}개의 계약서를 '${folderName}'(으)로 이동했습니다.`);
      exitSelectionMode();
      setShowMoveDialog(false);
    } catch (error) {
      console.error("Error moving contracts:", error);
      toast.error("계약서 이동에 실패했습니다.");
    }
  };

  const openEditFolder = (folder: ContractFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color);
    setShowFolderDialog(true);
  };

  const getFolderColorClass = (colorName: string) => {
    return FOLDER_COLORS.find(c => c.name === colorName)?.class || FOLDER_COLORS[0].class;
  };

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

  const renderContractCard = (contract: Contract, index: number, section: 'pending' | 'completed') => {
    const isPending = section === 'pending';
    const delay = (isPending ? 0.3 : 0.5) + index * 0.05;
    const canEdit = isDemo || isContractEditable(contract.created_at);
    const remainingDays = getRemainingEditDays(contract.created_at);
    
    return (
      <motion.div
        key={contract.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <CardSlide
          onClick={() => {
            if (isSelectionMode) {
              toggleSelection(contract.id);
            } else {
              setPreviewContract(contract);
            }
          }}
          className="p-4"
        >
          <div className="flex items-center gap-3">
            {/* Selection checkbox */}
            {isSelectionMode && (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(contract.id)}
                  onCheckedChange={() => toggleSelection(contract.id)}
                />
              </div>
            )}
            
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isPending ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <FileText className={`w-5 h-5 ${isPending ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`} />
            </div>
            
            {/* Content - 이름과 매장정보만 */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">
                {contract.worker_name}
              </p>
              {contract.business_name && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {contract.business_name}
                </p>
              )}
            </div>
            
            {/* Right side */}
            {!isSelectionMode && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(contract.status)}
                {isPending && canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/employer/create?edit=${contract.id}`);
                    }}
                    className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                    title={`수정 가능: ${remainingDays}일 남음`}
                  >
                    수정
                  </button>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
        </CardSlide>
      </motion.div>
    );
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
            {currentFolderId ? (
              <button
                onClick={() => setCurrentFolderId(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span className="text-sm">전체 계약서</span>
              </button>
            ) : (
              <p className="text-body text-muted-foreground mb-1">안녕하세요,</p>
            )}
            <h1 className="text-title text-foreground flex items-center gap-2">
              {currentFolderId ? (
                <>
                  <FolderOpen className={`w-6 h-6 ${getFolderColorClass(currentFolder?.color || 'gray').split(' ')[1]}`} />
                  {currentFolder?.name}
                </>
              ) : (
                <>{displayName || '사장님'} 👋</>
              )}
            </h1>
          </motion.div>

          <AppDrawer userType="employer" />
        </div>
        
        {/* Credits Badge */}
        {!currentFolderId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <CreditsBadge />
          </motion.div>
        )}
      </div>

      {/* Selection Mode Header */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border max-w-md mx-auto"
          >
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={exitSelectionMode}>
                  <X className="w-6 h-6" />
                </button>
                <span className="font-semibold">{selectedIds.size}개 선택됨</span>
              </div>
              <button 
                onClick={handleSelectAll}
                className="text-primary font-medium"
              >
                {selectedIds.size === filteredContracts.length ? '선택 해제' : '전체 선택'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Actions */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border max-w-md mx-auto p-4"
          >
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setShowMoveDialog(true)}
              >
                <Folder className="w-4 h-4" />
                이동
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
<Button
            variant="toss"
            size="full"
            onClick={() => navigate('/employer/create')}
            className="gap-3 flex-1"
          >
            <Plus className="w-5 h-5" />
            새 계약서 작성
          </Button>
          {!isDemo && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditingFolder(null);
                setNewFolderName('');
                setNewFolderColor('gray');
                setShowFolderDialog(true);
              }}
              className="flex-shrink-0"
            >
              <FolderPlus className="w-5 h-5" />
            </Button>
          )}
        </motion.div>
      </div>

      {/* Folders */}
      {!currentFolderId && activeFolders.length > 0 && (
        <div className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-heading font-semibold text-foreground">폴더</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {activeFolders.map((folder, index) => {
                const folderContracts = displayContracts.filter(c => c.folder_id === folder.id);
                return (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex-shrink-0"
                  >
                    <div
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="w-32 p-3 rounded-xl bg-card border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFolderColorClass(folder.color)}`}>
                          <Folder className="w-5 h-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 rounded hover:bg-muted">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              openEditFolder(folder);
                            }}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="font-medium text-sm truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">{folderContracts.length}개</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Contract List Header with Edit Button */}
      {filteredContracts.length > 0 && (
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-heading font-semibold text-foreground">
              {currentFolderId ? '계약서' : '전체 계약서'}
            </h2>
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className="text-sm text-primary font-medium"
            >
              {isSelectionMode ? '취소' : '편집'}
            </button>
          </div>
        </div>
      )}

      {/* Pending Contracts */}
      {pendingContracts.length > 0 && (
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">진행 중</h3>
            <div className="space-y-3">
              {pendingContracts.map((contract, index) => 
                renderContractCard(contract, index, 'pending')
              )}
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
            <h3 className="text-sm font-medium text-muted-foreground mb-3">완료</h3>
            <div className="space-y-3">
              {completedContracts.map((contract, index) => 
                renderContractCard(contract, index, 'completed')
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {filteredContracts.length === 0 && (
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
            {currentFolderId ? '이 폴더에 계약서가 없어요' : '아직 작성한 계약서가 없어요'}
          </p>
        </motion.div>
      )}

      {/* Spacer for bottom actions */}
      {isSelectionMode && selectedIds.size > 0 && <div className="h-24" />}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계약서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}개의 계약서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder Create/Edit Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? '폴더 수정' : '새 폴더 만들기'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="폴더 이름"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div>
              <p className="text-sm font-medium mb-2">색상</p>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setNewFolderColor(color.name)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.class} ${
                      newFolderColor === color.name ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <Folder className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              {editingFolder ? '수정' : '만들기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더로 이동</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
            {/* Create New Folder Button */}
            <button
              onClick={() => {
                setShowMoveDialog(false);
                setEditingFolder(null);
                setNewFolderName('');
                setNewFolderColor('gray');
                setShowFolderDialog(true);
              }}
              className="w-full p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 flex items-center gap-3 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-primary">새 폴더 만들기</span>
            </button>
            
            <div className="border-t border-border my-2" />
            
            <button
              onClick={() => handleMoveToFolder(null)}
              className="w-full p-3 rounded-lg hover:bg-muted flex items-center gap-3 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium">전체 (폴더 해제)</span>
            </button>
            {activeFolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMoveToFolder(folder.id)}
                className="w-full p-3 rounded-lg hover:bg-muted flex items-center gap-3 text-left transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFolderColorClass(folder.color)}`}>
                  <Folder className="w-5 h-5" />
                </div>
                <span className="font-medium">{folder.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Preview Modal */}
      <Dialog open={!!previewContract} onOpenChange={(open) => !open && setPreviewContract(null)}>
        <DialogContent className="max-w-sm mx-auto">
          {previewContract && (() => {
            const canEdit = isDemo || isContractEditable(previewContract.created_at);
            const remainingDays = getRemainingEditDays(previewContract.created_at);
            const isPending = previewContract.status === 'pending' || previewContract.status === 'draft';
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isPending ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <FileText className={`w-5 h-5 ${isPending ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{previewContract.worker_name}</p>
                      {previewContract.business_name && (
                        <p className="text-sm text-muted-foreground font-normal">{previewContract.business_name}</p>
                      )}
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* 시급 */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">시급</p>
                      <p className="text-sm font-semibold">{previewContract.hourly_wage.toLocaleString()}원</p>
                    </div>
                  </div>
                  
                  {/* 근무일 */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">근무일</p>
                      <p className="text-sm font-semibold">
                        {previewContract.work_days.length > 0 
                          ? `주 ${previewContract.work_days.length}일 (${previewContract.work_days.join(', ')})`
                          : '미정'}
                      </p>
                    </div>
                  </div>
                  
                  {/* 근무시간 */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">근무시간</p>
                      <p className="text-sm font-semibold">{previewContract.work_start_time} ~ {previewContract.work_end_time}</p>
                    </div>
                  </div>
                  
                  {/* 근무지 */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">근무지</p>
                      <p className="text-sm font-semibold truncate">{previewContract.work_location || '미정'}</p>
                    </div>
                  </div>
                  
                  {/* 업무내용 */}
                  {previewContract.job_description && (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">업무내용</p>
                        <p className="text-sm font-semibold truncate">{previewContract.job_description}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 수정 가능 기간 안내 */}
                  {isPending && canEdit && remainingDays > 0 && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary">
                        ✏️ 수정 가능 기간: <strong>{remainingDays}일</strong> 남음
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter className="flex gap-2">
                  {isPending && canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreviewContract(null);
                        navigate(`/employer/create?edit=${previewContract.id}`);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      수정
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setPreviewContract(null);
                      navigate(`/employer/contract/${previewContract.id}`);
                    }}
                    className="flex-1"
                  >
                    상세보기
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
