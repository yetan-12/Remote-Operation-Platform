export type ClipsCollectedPayload = {
  collector: string;
  sessionId: string;
  clipCount: number;
  clipIds: string[];
  device: string;
};

export type ClipAssignedPayload = {
  assignedBy: string;
  assigneeUsername: string;
  assigneeName: string;
  clipId: string;
};

export type ClipReviewedPayload = {
  reviewer: string;
  clipId: string;
  dataValidity: 'valid' | 'invalid';
  dataCompleteness: 'complete' | 'incomplete';
  errorTags: string[];
  reviewComment: string;
};

export type UserCreatedPayload = {
  createdBy: string;
  newUsername: string;
  newName: string;
  roles: string[];
};

export type UserRolesUpdatedPayload = {
  operator: string;
  targetUsername: string;
  targetName: string;
  newRoles: string[];
};

export type AppEventMap = {
  CLIPS_COLLECTED: ClipsCollectedPayload;
  CLIP_ASSIGNED: ClipAssignedPayload;
  CLIP_REVIEWED: ClipReviewedPayload;
  USER_CREATED: UserCreatedPayload;
  USER_ROLES_UPDATED: UserRolesUpdatedPayload;
};

type Handler<T> = (payload: T) => void;

class AppEventBus {
  private handlers: { [K in keyof AppEventMap]?: Set<Handler<AppEventMap[K]>> } = {};

  subscribe<K extends keyof AppEventMap>(type: K, handler: Handler<AppEventMap[K]>): () => void {
    if (!this.handlers[type]) this.handlers[type] = new Set();
    this.handlers[type]!.add(handler);
    return () => {
      this.handlers[type]!.delete(handler);
    };
  }

  publish<K extends keyof AppEventMap>(type: K, payload: AppEventMap[K]) {
    this.handlers[type]?.forEach((h) => h(payload));
  }
}

export const appEventBus = new AppEventBus();

