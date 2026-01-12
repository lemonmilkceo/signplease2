import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  WorkerReview, 
  RATING_LABELS, 
  RATING_COLORS,
  createReview, 
  updateReview, 
  getReviewByContract 
} from "@/lib/review-api";
import { toast } from "sonner";

interface WorkerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  employerId: string;
  workerId: string;
  workerName: string;
}

export function WorkerReviewModal({
  isOpen,
  onClose,
  contractId,
  employerId,
  workerId,
  workerName,
}: WorkerReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [existingReview, setExistingReview] = useState<WorkerReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isOpen && contractId) {
      fetchExistingReview();
    }
  }, [isOpen, contractId]);

  const fetchExistingReview = async () => {
    setIsFetching(true);
    try {
      const review = await getReviewByContract(contractId);
      if (review) {
        setExistingReview(review);
        setRating(review.rating);
        setComment(review.comment || "");
      } else {
        setExistingReview(null);
        setRating(0);
        setComment("");
      }
    } catch (error) {
      console.error("Error fetching review:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("평가를 선택해주세요");
      return;
    }

    setIsLoading(true);
    try {
      if (existingReview) {
        await updateReview(existingReview.id, rating, comment);
        toast.success("평가가 수정되었습니다");
      } else {
        await createReview(contractId, employerId, workerId, rating, comment);
        toast.success("평가가 등록되었습니다");
      }
      onClose();
    } catch (error) {
      console.error("Error saving review:", error);
      toast.error("평가 저장에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {workerName}님 평가하기
          </DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Rating Stars */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button
                    key={value}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(value)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        value <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              
              {/* Rating Label */}
              <AnimatePresence mode="wait">
                {displayRating > 0 && (
                  <motion.div
                    key={displayRating}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`px-4 py-2 rounded-full font-medium ${RATING_COLORS[displayRating]}`}
                  >
                    {RATING_LABELS[displayRating]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                추가 의견 (선택사항)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="함께 일하면서 느낀 점을 자유롭게 작성해주세요"
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/500
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {existingReview ? "평가 수정하기" : "평가 등록하기"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
