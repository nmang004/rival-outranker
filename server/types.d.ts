declare global {
  namespace NodeJS {
    interface Global {
      rivalRankTrackerResults: {
        [key: string]: any;
      };
    }
  }
}