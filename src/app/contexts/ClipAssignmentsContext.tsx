import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { appEventBus } from '../core/events/AppEventBus';

// Clip data interface matching AdminDashboard and ReviewerDashboard
export type ClipStatus = 'Pending' | 'Assigned' | 'Finished' | 'Invalid' | 'Disabled';

export interface ClipInfo {
  id: string;
  description: string;
  time: string;
  duration: string;
  frames: number;
  sessionId: string;
  collector: string;
  device: string;
  status: ClipStatus;
}

// Review result from reviewer submission
export interface ClipReviewResult {
  dataValidity: 'valid' | 'invalid';
  dataCompleteness: 'complete' | 'incomplete';
  errorTags: string[];
  reviewComment: string;
  reviewedBy: string;
  reviewedAt: string;
}

const STORAGE_KEY_ASSIGNMENTS = 'robodata_clip_assignments';
const STORAGE_KEY_REVIEWS = 'robodata_clip_reviews';
const STORAGE_KEY_DISABLED = 'robodata_clip_disabled';
const STORAGE_KEY_CLIPS_LIST = 'robodata_clips_list';

// Few test clips for data management (seed when storage is empty)
const DEFAULT_TEST_CLIPS: Omit<ClipInfo, 'status'>[] = [
  { id: 'C-TEST-01', description: '测试Clip：机械臂移至0度', time: '2025-12-28 10:00', duration: '00:42', frames: 24, sessionId: 'SE-TEST-001', collector: '测试员', device: 'FRANKA-01' },
  { id: 'C-TEST-02', description: '测试Clip：夹取方块放置', time: '2025-12-28 10:15', duration: '00:35', frames: 21, sessionId: 'SE-TEST-001', collector: '测试员', device: 'FRANKA-01' },
  { id: 'C-TEST-03', description: '测试Clip：机械臂复位', time: '2025-12-28 10:30', duration: '00:28', frames: 17, sessionId: 'SE-TEST-001', collector: '测试员', device: 'UR5-02' },
];

export type NewClipInput = Omit<ClipInfo, 'status'>;

function loadClipsList(): NewClipInput[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CLIPS_LIST);
    if (!stored) return [...DEFAULT_TEST_CLIPS];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_TEST_CLIPS];
  } catch {
    return [...DEFAULT_TEST_CLIPS];
  }
}

function saveClipsList(list: NewClipInput[]) {
  localStorage.setItem(STORAGE_KEY_CLIPS_LIST, JSON.stringify(list));
}

interface ClipAssignmentsContextValue {
  clips: ClipInfo[];
  assignments: Record<string, string>;
  reviews: Record<string, ClipReviewResult>;
  disabledClips: Set<string>;
  /** Add newly collected clips from data collection (decoupled: collector only calls this) */
  addCollectedClips: (items: NewClipInput[]) => void;
  /** Assign clip to reviewer; optional meta for operation log (who assigned, assignee display name) */
  assignClip: (clipId: string, assigneeUsername: string, meta?: { assignedBy: string; assigneeName: string }) => void;
  unassignClip: (clipId: string) => void;
  submitReview: (clipId: string, review: Omit<ClipReviewResult, 'reviewedBy' | 'reviewedAt'>, reviewedBy: string) => void;
  disableClip: (clipId: string) => void;
  enableClip: (clipId: string) => void;
  getClipsForUser: (username: string) => ClipInfo[];
  getClipReview: (clipId: string) => ClipReviewResult | undefined;
  getClipEffectiveStatus: (clipId: string) => ClipStatus;
}

const ClipAssignmentsContext = createContext<ClipAssignmentsContextValue | undefined>(undefined);

function loadAssignments(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function loadReviews(): Record<string, ClipReviewResult> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REVIEWS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function loadDisabled(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DISABLED);
    const arr = stored ? JSON.parse(stored) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDisabled(disabled: Set<string>) {
  localStorage.setItem(STORAGE_KEY_DISABLED, JSON.stringify([...disabled]));
}

function saveAssignments(assignments: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
}

function saveReviews(reviews: Record<string, ClipReviewResult>) {
  localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
}

export function ClipAssignmentsProvider({ children }: { children: ReactNode }) {
  const [clipsList, setClipsList] = useState<NewClipInput[]>(loadClipsList);
  const [assignments, setAssignments] = useState<Record<string, string>>(loadAssignments);
  const [reviews, setReviews] = useState<Record<string, ClipReviewResult>>(loadReviews);
  const [disabledClips, setDisabledClips] = useState<Set<string>>(loadDisabled);

  const addCollectedClips = useCallback((items: NewClipInput[]) => {
    if (items.length === 0) return;
    const first = items[0];
    appEventBus.publish('CLIPS_COLLECTED', {
      collector: first.collector,
      sessionId: first.sessionId,
      clipCount: items.length,
      clipIds: items.map((i) => i.id),
      device: first.device,
    });
    setClipsList((prev) => {
      const next = [...prev, ...items];
      saveClipsList(next);
      return next;
    });
  }, []);

  const assignClip = useCallback((clipId: string, assigneeUsername: string, meta?: { assignedBy: string; assigneeName: string }) => {
    if (meta) {
      appEventBus.publish('CLIP_ASSIGNED', {
        assignedBy: meta.assignedBy,
        assigneeUsername,
        assigneeName: meta.assigneeName,
        clipId,
      });
    }
    setAssignments((prev) => {
      const next = { ...prev, [clipId]: assigneeUsername };
      saveAssignments(next);
      return next;
    });
  }, []);

  const unassignClip = useCallback((clipId: string) => {
    setAssignments((prev) => {
      const { [clipId]: _, ...rest } = prev;
      saveAssignments(rest);
      return rest;
    });
  }, []);

  const disableClip = useCallback((clipId: string) => {
    setDisabledClips((prev) => {
      const next = new Set(prev);
      next.add(clipId);
      saveDisabled(next);
      return next;
    });
  }, []);

  const enableClip = useCallback((clipId: string) => {
    setDisabledClips((prev) => {
      const next = new Set(prev);
      next.delete(clipId);
      saveDisabled(next);
      return next;
    });
  }, []);

  const submitReview = useCallback((clipId: string, review: Omit<ClipReviewResult, 'reviewedBy' | 'reviewedAt'>, reviewedBy: string) => {
    const fullReview: ClipReviewResult = {
      ...review,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    };
    appEventBus.publish('CLIP_REVIEWED', {
      reviewer: reviewedBy,
      clipId,
      dataValidity: review.dataValidity,
      dataCompleteness: review.dataCompleteness,
      errorTags: review.errorTags ?? [],
      reviewComment: review.reviewComment ?? '',
    });
    setReviews((prev) => {
      const next = { ...prev, [clipId]: fullReview };
      saveReviews(next);
      return next;
    });
  }, []);

  const getClipEffectiveStatus = useCallback((clipId: string): ClipStatus => {
    if (disabledClips.has(clipId)) return 'Disabled';
    const review = reviews[clipId];
    if (review) {
      if (review.dataValidity === 'invalid') return 'Invalid';
      if (review.dataCompleteness === 'complete') return 'Finished';
      return 'Assigned'; // incomplete but submitted
    }
    return assignments[clipId] ? 'Assigned' : 'Pending';
  }, [assignments, reviews, disabledClips]);

  const getClipsForUser = useCallback(
    (username: string): ClipInfo[] => {
      return clipsList
        .filter((c) => !disabledClips.has(c.id) && assignments[c.id] === username && !reviews[c.id])
        .map((c) => ({
          ...c,
          status: getClipEffectiveStatus(c.id),
        }));
    },
    [clipsList, assignments, reviews, disabledClips, getClipEffectiveStatus]
  );

  const getClipReview = useCallback((clipId: string) => reviews[clipId], [reviews]);

  const clips: ClipInfo[] = clipsList.map((c) => ({
    ...c,
    status: getClipEffectiveStatus(c.id),
  }));

  const value: ClipAssignmentsContextValue = {
    clips,
    assignments,
    reviews,
    disabledClips,
    addCollectedClips,
    assignClip,
    unassignClip,
    submitReview,
    disableClip,
    enableClip,
    getClipsForUser,
    getClipReview,
    getClipEffectiveStatus,
  };

  return (
    <ClipAssignmentsContext.Provider value={value}>
      {children}
    </ClipAssignmentsContext.Provider>
  );
}

export function useClipAssignments() {
  const context = useContext(ClipAssignmentsContext);
  if (context === undefined) {
    throw new Error('useClipAssignments must be used within ClipAssignmentsProvider');
  }
  return context;
}
