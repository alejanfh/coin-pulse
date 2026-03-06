const TrendingCoinsSkeleton = () => {
  return (
    <div id="trending-coins" className="animate-pulse">
      <div className="bg-card rounded-lg p-6">
        {/* Header skeleton */}
        <h4 className="h-6 bg-muted rounded-md w-40 mb-4" />

        {/* Table skeleton */}
        <table className="w-full">
          <thead>
            <tr>
              <th className="h-4 bg-muted rounded-md w-24" />
              <th className="h-4 bg-muted rounded-md w-32" />
              <th className="h-4 bg-muted rounded-md w-20" />
            </tr>
          </thead>
          <tbody className="space-y-2">
            {[...Array(6)].map((_, index) => (
              <tr key={index} className="space-y-2">
                {/* Name cell skeleton */}
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-muted rounded-full" />
                    <div className="h-4 bg-muted rounded-md w-24" />
                  </div>
                </td>

                {/* Change cell skeleton */}
                <td className="py-3">
                  <div className="h-4 bg-muted rounded-md w-16" />
                </td>

                {/* Price cell skeleton */}
                <td className="py-3">
                  <div className="h-4 bg-muted rounded-md w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendingCoinsSkeleton;
