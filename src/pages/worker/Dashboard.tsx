import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Contract, getFolders, ContractFolder, 
  softDeleteContractsForWorker, restoreContractsForWorker, getWorkerTrashedContracts,
  createFolder, deleteFolder, moveContractsToFolder, updateFolder 
} from "@/lib/contract-api";
import { getUserPreferences, saveUserPreferences, SortOption } from "@/lib/preferences-api";
import { 
  FileText, ChevronRight, Clock, CheckCircle2, Loader2, Building2, Wallet, MessageCircle,
  X, Trash2, FolderPlus, MoreVertical, Folder, Edit2, FolderOpen, ArrowUpDown, 
  Calendar, User, GripVertical, RotateCcw, Briefcase
} from "lucide-react";
import { CardSlide } from "@/components/ui/card-slide";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const FOLDER_COLORS = [
  { name: 'gray', class: 'bg-muted text-muted-foreground' },
  { name: 'blue', class: 'bg-blue-500/10 text-blue-500' },
  { name: 'green', class: 'bg-green-500/10 text-green-500' },
  { name: 'yellow', class: 'bg-yellow-500/10 text-yellow-600' },
  { name: 'purple', class: 'bg-purple-500/10 text-purple-500' },
  { name: 'red', class: 'bg-red-500/10 text-red-500' },
];

// SortOption is now imported from preferences-api

interface SortableContractCardProps {
  contract: Contract;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  navigate: (path: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function SortableContractCard({ 
  contract, 
  isSelectionMode, 
  selectedIds, 
  toggleSelection, 
  navigate,
  getStatusBadge 
}: SortableContractCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contract.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = contract.status === 'completed';

  return (
    <div ref={setNodeRef} style={style}>
      <CardSlide
        onClick={() => {
          if (isSelectionMode && isCompleted) {
            toggleSelection(contract.id);
          } else {
            navigate(`/worker/contract/${contract.id}`);
          }
        }}
        className="p-4"
      >
        <div className="flex items-start gap-4">
          {/* Drag handle - only in selection mode */}
          {isSelectionMode && isCompleted && (
            <div 
              {...attributes} 
              {...listeners}
              className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing touch-none"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          
          {/* Selection checkbox - only for completed contracts */}
          {isSelectionMode && isCompleted && (
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 pt-1">
              <Checkbox
                checked={selectedIds.has(contract.id)}
                onCheckedChange={() => toggleSelection(contract.id)}
              />
            </div>
          )}
          
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            contract.status === 'pending' ? 'bg-warning/10' : 'bg-success/10'
          }`}>
            <FileText className={`w-6 h-6 ${contract.status === 'pending' ? 'text-warning' : 'text-success'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-body font-semibold text-foreground truncate">
                {contract.employer_name}
              </p>
              {!isSelectionMode && getStatusBadge(contract.status)}
            </div>
            <div className="space-y-1">
              {contract.business_name && (
                <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{contract.business_name}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-caption text-muted-foreground">
                {contract.status === 'pending' ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>시급 {contract.hourly_wage.toLocaleString()}원</span>
                    </div>
                    <span>·</span>
                    <span>{contract.work_days.length > 3 ? `주 ${contract.work_days.length}일` : contract.work_days.join(', ')}</span>
                  </>
                ) : (
                  <>
                    <span>{contract.start_date} 시작</span>
                    <span>·</span>
                    <span>{contract.work_start_time} ~ {contract.work_end_time}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {!isSelectionMode && (
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
          )}
        </div>
      </CardSlide>
    </div>
  );
}

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [folders, setFolders] = useState<ContractFolder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Folder view
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isTrashView, setIsTrashView] = useState(false);
  const [trashedContracts, setTrashedContracts] = useState<Contract[]>([]);
  
  // Sorting
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  
  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ContractFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('gray');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchData() {
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

        // Filter out soft-deleted contracts for the worker
        const visibleContracts = uniqueContracts.filter(c => !c.worker_deleted_at);

        setContracts(visibleContracts);
        
        // Fetch folders, preferences, and trashed contracts
        if (user) {
          const [foldersData, prefsData, trashedData] = await Promise.all([
            getFolders(user.id),
            getUserPreferences(user.id, 'worker'),
            getWorkerTrashedContracts(user.id)
          ]);
          setFolders(foldersData);
          setTrashedContracts(trashedData);
          
          // Load saved preferences
          if (prefsData) {
            setSortOption(prefsData.sort_option);
            setCustomOrder(prefsData.custom_order);
          } else {
            // Initialize custom order with completed contracts
            const completedIds = uniqueContracts
              .filter(c => c.status === 'completed')
              .map(c => c.id);
            setCustomOrder(completedIds);
          }
        } else {
          // Initialize custom order with completed contracts
          const completedIds = uniqueContracts
            .filter(c => c.status === 'completed')
            .map(c => c.id);
          setCustomOrder(completedIds);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('데이터를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Save preferences when sort option or custom order changes
  useEffect(() => {
    const savePrefs = async () => {
      if (!user || loading) return;
      
      try {
        await saveUserPreferences(user.id, 'worker', sortOption, customOrder);
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    };

    // Debounce saving
    const timeoutId = setTimeout(savePrefs, 500);
    return () => clearTimeout(timeoutId);
  }, [sortOption, customOrder, user, loading]);

  // Filter by current folder - only completed contracts can be in folders
  const filteredContracts = currentFolderId 
    ? contracts.filter(c => c.folder_id === currentFolderId && c.status === 'completed')
    : contracts.filter(c => !c.folder_id || c.status === 'pending');

  const pendingContracts = filteredContracts.filter((c) => c.status === 'pending');
  
  // Apply sorting to completed contracts
  const completedContractsRaw = currentFolderId 
    ? filteredContracts.filter(c => c.status === 'completed')
    : contracts.filter((c) => c.status === 'completed' && !c.folder_id);

  const completedContracts = useMemo(() => {
    const sorted = [...completedContractsRaw];
    
    switch (sortOption) {
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case 'name-asc':
        return sorted.sort((a, b) => 
          a.employer_name.localeCompare(b.employer_name, 'ko')
        );
      case 'name-desc':
        return sorted.sort((a, b) => 
          b.employer_name.localeCompare(a.employer_name, 'ko')
        );
      case 'custom':
        return sorted.sort((a, b) => {
          const indexA = customOrder.indexOf(a.id);
          const indexB = customOrder.indexOf(b.id);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      default:
        return sorted;
    }
  }, [completedContractsRaw, sortOption, customOrder]);

  const currentFolder = folders.find(f => f.id === currentFolderId);

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
    if (isTrashView) {
      // In trash view, select all trashed contracts
      if (selectedIds.size === trashedContracts.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(trashedContracts.map(c => c.id)));
      }
    } else {
      // Only select completed contracts (only those can be managed)
      const selectableContracts = filteredContracts.filter(c => c.status === 'completed');
      if (selectedIds.size === selectableContracts.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(selectableContracts.map(c => c.id)));
      }
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const exitTrashView = () => {
    setIsTrashView(false);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleDelete = async () => {
    try {
      // Use soft delete for workers - data is preserved for career history
      await softDeleteContractsForWorker(Array.from(selectedIds));
      const deletedContracts = contracts.filter(c => selectedIds.has(c.id)).map(c => ({
        ...c,
        worker_deleted_at: new Date().toISOString()
      }));
      setTrashedContracts(prev => [...deletedContracts, ...prev]);
      setContracts(prev => prev.filter(c => !selectedIds.has(c.id)));
      setCustomOrder(prev => prev.filter(id => !selectedIds.has(id)));
      toast.success(`${selectedIds.size}개의 계약서가 휴지통으로 이동되었습니다.`);
      exitSelectionMode();
    } catch (error) {
      console.error("Error deleting contracts:", error);
      toast.error("계약서 삭제에 실패했습니다.");
    }
    setShowDeleteDialog(false);
  };

  const handleRestore = async () => {
    try {
      await restoreContractsForWorker(Array.from(selectedIds));
      const restoredContracts = trashedContracts
        .filter(c => selectedIds.has(c.id))
        .map(c => ({ ...c, worker_deleted_at: null }));
      setContracts(prev => [...restoredContracts, ...prev]);
      setTrashedContracts(prev => prev.filter(c => !selectedIds.has(c.id)));
      toast.success(`${selectedIds.size}개의 계약서가 복원되었습니다.`);
      exitSelectionMode();
      
      // Exit trash view if empty
      if (trashedContracts.length - selectedIds.size === 0) {
        setIsTrashView(false);
      }
    } catch (error) {
      console.error("Error restoring contracts:", error);
      toast.error("계약서 복원에 실패했습니다.");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !user) return;
    
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
    try {
      await moveContractsToFolder(Array.from(selectedIds), folderId);
      setContracts(prev => prev.map(c => 
        selectedIds.has(c.id) ? { ...c, folder_id: folderId } : c
      ));
      const folderName = folderId ? folders.find(f => f.id === folderId)?.name : '전체';
      toast.success(`${selectedIds.size}개의 계약서를 '${folderName}'(으)로 이동했습니다.`);
      exitSelectionMode();
      setShowMoveDialog(false);
    } catch (error) {
      console.error("Error moving contracts:", error);
      toast.error("계약서 이동에 실패했습니다.");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSortOption('custom');
      setCustomOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        
        // If items don't exist in customOrder, add them
        if (oldIndex === -1 || newIndex === -1) {
          const newItems = completedContracts.map(c => c.id);
          const oldIdx = newItems.indexOf(active.id as string);
          const newIdx = newItems.indexOf(over.id as string);
          return arrayMove(newItems, oldIdx, newIdx);
        }
        
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success("순서가 변경되었습니다.");
    }
  };

  const openEditFolder = (folder: ContractFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color || 'gray');
    setShowFolderDialog(true);
  };

  const getFolderColorClass = (colorName: string) => {
    return FOLDER_COLORS.find(c => c.name === colorName)?.class || FOLDER_COLORS[0].class;
  };

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

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest': return '최신순';
      case 'oldest': return '오래된순';
      case 'name-asc': return '이름 (ㄱ-ㅎ)';
      case 'name-desc': return '이름 (ㅎ-ㄱ)';
      case 'custom': return '직접 정렬';
    }
  };

  const renderContractCard = (contract: Contract, index: number, section: 'pending' | 'completed') => {
    const isPending = section === 'pending';
    const delay = (isPending ? 0.2 : 0.4) + index * 0.05;
    const isCompleted = contract.status === 'completed';
    
    return (
      <motion.div
        key={contract.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <CardSlide
          onClick={() => {
            if (isSelectionMode && isCompleted) {
              toggleSelection(contract.id);
            } else {
              navigate(`/worker/contract/${contract.id}`);
            }
          }}
          className="p-4"
        >
          <div className="flex items-start gap-4">
            {/* Selection checkbox - only for completed contracts */}
            {isSelectionMode && isCompleted && (
              <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 pt-1">
                <Checkbox
                  checked={selectedIds.has(contract.id)}
                  onCheckedChange={() => toggleSelection(contract.id)}
                />
              </div>
            )}
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isPending ? 'bg-warning/10' : 'bg-success/10'
            }`}>
              <FileText className={`w-6 h-6 ${isPending ? 'text-warning' : 'text-success'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-body font-semibold text-foreground truncate">
                  {contract.employer_name}
                </p>
                {!isSelectionMode && getStatusBadge(contract.status)}
              </div>
              <div className="space-y-1">
                {contract.business_name && (
                  <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{contract.business_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-caption text-muted-foreground">
                  {isPending ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" />
                        <span>시급 {contract.hourly_wage.toLocaleString()}원</span>
                      </div>
                      <span>·</span>
                      <span>{contract.work_days.length > 3 ? `주 ${contract.work_days.length}일` : contract.work_days.join(', ')}</span>
                    </>
                  ) : (
                    <>
                      <span>{contract.start_date} 시작</span>
                      <span>·</span>
                      <span>{contract.work_start_time} ~ {contract.work_end_time}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {!isSelectionMode && (
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
            )}
          </div>
        </CardSlide>
      </motion.div>
    );
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
        <div className="flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentFolderId || isTrashView ? (
              <button
                onClick={() => {
                  if (isTrashView) {
                    exitTrashView();
                  } else {
                    setCurrentFolderId(null);
                  }
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span className="text-sm">전체 계약서</span>
              </button>
            ) : (
              <p className="text-body text-muted-foreground mb-1">안녕하세요,</p>
            )}
            <h1 className="text-title text-foreground flex items-center gap-2">
              {isTrashView ? (
                <>
                  <Trash2 className="w-6 h-6 text-destructive" />
                  휴지통
                </>
              ) : currentFolderId ? (
                <>
                  <FolderOpen className={`w-6 h-6 ${getFolderColorClass(currentFolder?.color || 'gray').split(' ')[1]}`} />
                  {currentFolder?.name}
                </>
              ) : (
                <>{profile?.name || '근로자'}님 👋</>
              )}
            </h1>
          </motion.div>
          
          {user && !isSelectionMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/worker/chat')}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <AppDrawer userType="worker" />
            </div>
          )}
        </div>
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
                {selectedIds.size === (isTrashView ? trashedContracts : completedContracts).length ? '선택 해제' : '전체 선택'}
              </button>
            </div>
            
            {/* Selection Actions */}
            <div className="px-6 py-3 flex items-center gap-2 border-t border-border overflow-x-auto">
              {isTrashView ? (
                // Trash view actions
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-2 text-primary hover:text-primary flex-shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  복원
                </Button>
              ) : (
                // Normal view actions
                <>
                  {/* Sort dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        {getSortLabel(sortOption)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSortOption('newest')}>
                        <Calendar className="w-4 h-4 mr-2" />
                        최신순
                        {sortOption === 'newest' && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('oldest')}>
                        <Calendar className="w-4 h-4 mr-2" />
                        오래된순
                        {sortOption === 'oldest' && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSortOption('name-asc')}>
                        <User className="w-4 h-4 mr-2" />
                        이름 (ㄱ-ㅎ)
                        {sortOption === 'name-asc' && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('name-desc')}>
                        <User className="w-4 h-4 mr-2" />
                        이름 (ㅎ-ㄱ)
                        {sortOption === 'name-desc' && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSortOption('custom')}>
                        <GripVertical className="w-4 h-4 mr-2" />
                        직접 정렬 (드래그)
                        {sortOption === 'custom' && <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoveDialog(true)}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <Folder className="w-4 h-4" />
                    폴더 이동
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Career Button - Only show when not in a folder and not in trash */}
      {!currentFolderId && !isTrashView && !isSelectionMode && (
        <div className="px-6 mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.03 }}
          >
            <button
              onClick={() => navigate('/worker/career')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">내 경력</h3>
                  <p className="text-xs text-muted-foreground">근무 이력 및 평가 확인</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Folders Section - Only show when not in a folder and not in trash */}
      {!currentFolderId && !isTrashView && !isSelectionMode && (
        <div className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-heading font-semibold text-foreground">폴더</h2>
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setNewFolderName('');
                  setNewFolderColor('gray');
                  setShowFolderDialog(true);
                }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <FolderPlus className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex-shrink-0"
                >
                  <div className="relative group">
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${getFolderColorClass(folder.color || 'gray')} transition-colors min-w-[100px]`}
                    >
                      <Folder className="w-4 h-4" />
                      <span className="font-medium text-sm truncate max-w-[100px]">{folder.name}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute -top-1 -right-1 p-1 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditFolder(folder)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              
              {/* Trash folder */}
              {trashedContracts.length > 0 && (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setIsTrashView(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive transition-colors min-w-[100px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="font-medium text-sm">휴지통</span>
                    <span className="text-xs bg-destructive/20 px-1.5 py-0.5 rounded-full">{trashedContracts.length}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Mode Toggle - Only show when there are completed contracts */}
      {completedContracts.length > 0 && !isSelectionMode && (
        <div className="px-6 mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-end"
          >
            <button
              onClick={() => setIsSelectionMode(true)}
              className="text-sm text-primary font-medium"
            >
              편집
            </button>
          </motion.div>
        </div>
      )}

      {/* Pending Contracts - Only show when not in a folder and not in trash */}
      {!currentFolderId && !isTrashView && pendingContracts.length > 0 && (
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
              {pendingContracts.map((contract, index) => 
                renderContractCard(contract, index, 'pending')
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Trash View */}
      {isTrashView && (
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Edit button for trash */}
            {trashedContracts.length > 0 && !isSelectionMode && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="text-sm text-primary font-medium"
                >
                  편집
                </button>
              </div>
            )}
            
            {trashedContracts.length > 0 ? (
              <div className="space-y-3">
                {trashedContracts.map((contract, index) => (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <CardSlide
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelection(contract.id);
                        }
                      }}
                      className="p-4 opacity-75"
                    >
                      <div className="flex items-start gap-4">
                        {isSelectionMode && (
                          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 pt-1">
                            <Checkbox
                              checked={selectedIds.has(contract.id)}
                              onCheckedChange={() => toggleSelection(contract.id)}
                            />
                          </div>
                        )}
                        
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-body font-semibold text-foreground truncate">
                              {contract.employer_name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {contract.worker_deleted_at && new Date(contract.worker_deleted_at).toLocaleDateString('ko-KR')} 삭제됨
                            </span>
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
                      </div>
                    </CardSlide>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-body text-muted-foreground">
                  휴지통이 비어있어요
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Completed Contracts - Only show when not in trash */}
      {!isTrashView && completedContracts.length > 0 && (
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading font-semibold text-foreground">
                {currentFolderId ? '계약서' : '완료된 계약'}
              </h2>
              {!isSelectionMode && (
                <span className="text-caption text-muted-foreground">
                  {getSortLabel(sortOption)}
                </span>
              )}
            </div>
            
            {isSelectionMode && sortOption === 'custom' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={completedContracts.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {completedContracts.map((contract) => (
                      <SortableContractCard
                        key={contract.id}
                        contract={contract}
                        isSelectionMode={isSelectionMode}
                        selectedIds={selectedIds}
                        toggleSelection={toggleSelection}
                        navigate={navigate}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-3">
                {completedContracts.map((contract, index) => 
                  renderContractCard(contract, index, 'completed')
                )}
              </div>
            )}
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

      {/* Folder Empty State */}
      {currentFolderId && completedContracts.length === 0 && (
        <motion.div
          className="px-6 py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-body text-muted-foreground">
            이 폴더에 계약서가 없어요
          </p>
        </motion.div>
      )}

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
            <DialogTitle>{editingFolder ? '폴더 수정' : '새 폴더'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">폴더 이름</label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="폴더 이름을 입력하세요"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">색상</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setNewFolderColor(color.name)}
                    className={`w-8 h-8 rounded-full ${color.class} flex items-center justify-center transition-transform ${
                      newFolderColor === color.name ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                    }`}
                  >
                    {newFolderColor === color.name && <CheckCircle2 className="w-4 h-4" />}
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
              {editingFolder ? '수정' : '생성'}
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
          <div className="space-y-2">
            <button
              onClick={() => handleMoveToFolder(null)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="font-medium">전체 (폴더 없음)</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMoveToFolder(folder.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFolderColorClass(folder.color || 'gray')}`}>
                  <Folder className="w-5 h-5" />
                </div>
                <span className="font-medium">{folder.name}</span>
              </button>
            ))}
            <button
              onClick={() => {
                setShowMoveDialog(false);
                setEditingFolder(null);
                setNewFolderName('');
                setNewFolderColor('gray');
                setShowFolderDialog(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left text-primary"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderPlus className="w-5 h-5" />
              </div>
              <span className="font-medium">새 폴더 만들기</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
