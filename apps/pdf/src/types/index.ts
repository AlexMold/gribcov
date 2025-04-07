export interface PageData {
  id: string;
  docBytes: ArrayBuffer;
  pageIndex: number;
  originalIndex: number;
  fileName: string;
  removePage: (index: number) => void;
}