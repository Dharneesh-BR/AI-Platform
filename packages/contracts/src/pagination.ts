export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface CursorPaginatedResponse<TItem> {
  items: TItem[];
  pageInfo: PageInfo;
}

