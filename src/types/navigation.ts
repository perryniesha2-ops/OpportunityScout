// src/types/navigation.ts
export type FeedStackParamList = {
  FeedMain: { userProfile?: any } | undefined;
  OpportunityDetail: { opportunity: any; userProfile?: any };
};

export type SavedStackParamList = {
  SavedMain: undefined;
  OpportunityDetail: { opportunity: any; userProfile?: any };
};
