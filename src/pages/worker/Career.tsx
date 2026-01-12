import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Briefcase, 
  Star, 
  Calendar, 
  MapPin, 
  Clock,
  Award,
  TrendingUp,
  Building2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkerCareerSummary, formatContractPeriod, CareerSummary, CareerItem } from '@/lib/career-api';
import { RATING_LABELS, RATING_COLORS } from '@/lib/review-api';
import { toast } from '@/hooks/use-toast';

export default function WorkerCareer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [careerSummary, setCareerSummary] = useState<CareerSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCareerData();
    }
  }, [user?.id]);

  const loadCareerData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const summary = await getWorkerCareerSummary(user.id);
      setCareerSummary(summary);
    } catch (error) {
      console.error('Failed to load career data:', error);
      toast({
        title: '경력 정보를 불러오지 못했습니다',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  const CareerItemCard = ({ item, index }: { item: CareerItem; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/worker/contract/${item.contract.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
              <h3 className="font-semibold text-foreground truncate">
                {item.contract.business_name || item.contract.employer_name}
              </h3>
            </div>
            
            {item.contract.job_description && (
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {item.contract.job_description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatContractPeriod(item.contract)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.durationText}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{item.contract.work_location}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-3">
            {item.review ? (
              <div className="flex flex-col items-end">
                {renderStars(item.review.rating)}
                <span className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${RATING_COLORS[item.review.rating]}`}>
                  {RATING_LABELS[item.review.rating]}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                평가 없음
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        
        {item.review?.comment && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{item.review.comment}"
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-6 w-24 mb-4" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/worker')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">내 경력</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Stats */}
        {careerSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">총 근무 이력</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {careerSummary.totalContracts}건
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">총 근무 기간</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {careerSummary.totalWorkDaysText}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">평균 평가</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-foreground">
                  {careerSummary.averageRating > 0 ? careerSummary.averageRating.toFixed(1) : '-'}
                </p>
                {careerSummary.ratingCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({careerSummary.ratingCount}개)
                  </span>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">근무지</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {careerSummary.workplaces.length}곳
              </p>
            </Card>
          </motion.div>
        )}

        {/* Job Types Tags */}
        {careerSummary && careerSummary.jobTypes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-2">경험한 업무</h2>
            <div className="flex flex-wrap gap-2">
              {careerSummary.jobTypes.map((job, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-sm bg-accent text-accent-foreground rounded-full"
                >
                  {job}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Career List */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">근무 이력</h2>
          
          {careerSummary && careerSummary.careers.length > 0 ? (
            <div className="space-y-3">
              {careerSummary.careers.map((item, index) => (
                <CareerItemCard key={item.contract.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">아직 완료된 근무 이력이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                계약이 완료되면 여기에 경력이 자동으로 추가됩니다
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
