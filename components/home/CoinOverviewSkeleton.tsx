const CoinOverviewSkeleton = () => {
  return (
    <div id="coin-overview" className="animate-pulse">
      <div className="bg-card rounded-lg p-6">
        {/* Chart skeleton */}
        <div className="h-80 bg-muted rounded-lg mb-6" />

        {/* Header skeleton */}
        <div className="flex items-center gap-4 pt-2">
          {/* Coin image skeleton */}
          <div className="w-14 h-14 bg-muted rounded-full" />

          {/* Info skeleton */}
          <div className="space-y-2 flex-1">
            {/* Coin name skeleton */}
            <div className="h-4 bg-muted rounded-md w-32" />

            {/* Price skeleton */}
            <div className="h-8 bg-muted rounded-md w-48" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinOverviewSkeleton;
