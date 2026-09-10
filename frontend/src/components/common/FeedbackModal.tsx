import React, { useState } from 'react';
import { Star, X, Check, ThumbsUp } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  workerName: string;
  serviceTitle: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workerName,
  serviceTitle,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, review);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 text-stone-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ThumbsUp className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-stone-100">Rate Service Experience</h3>
          <p className="text-xs text-stone-400 mt-1">
            How was <span className="text-emerald-400 font-semibold">{workerName}</span> for {serviceTitle}?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center space-x-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">
              Feedback / Review (Optional):
            </label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Punctual, polite, high quality work..."
              className="w-full bg-stone-800/60 border border-stone-700 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Submit Rating & Review</span>
          </button>
        </form>
      </div>
    </div>
  );
};
