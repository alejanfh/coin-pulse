const CategoriesSkeleton = () => {
  return (
    <div id="categories" className="custom-scrollbar animate-pulse">
      <div className="bg-card rounded-lg p-6">
        {/* Header skeleton */}
        <h4 className="h-6 bg-muted rounded-md w-32 mb-4" />

        {/* Table skeleton */}
        <table className="w-full">
          <thead>
            <tr className="space-y-2">
              <th className="h-4 bg-muted rounded-md w-32" />
              <th className="h-4 bg-muted rounded-md w-32" />
              <th className="h-4 bg-muted rounded-md w-24" />
              <th className="h-4 bg-muted rounded-md w-32" />
              <th className="h-4 bg-muted rounded-md w-32" />
            </tr>
          </thead>
          <tbody className="space-y-2">
            {[...Array(10)].map((_, index) => (
              <tr key={index} className="space-y-2">
                {/* Category name skeleton */}
                <td className="py-3">
                  <div className="h-4 bg-muted rounded-md w-32" />
                </td>

                {/* Top gainers skeleton */}
                <td className="py-3">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-7 h-7 bg-muted rounded-full" />
                    ))}
                  </div>
                </td>

                {/* Change skeleton */}
                <td className="py-3">
                  <div className="h-4 bg-muted rounded-md w-20" />
                </td>

                {/* Market cap skeleton */}
                <td className="py-3">
                  <div className="h-4 bg-muted rounded-md w-32" />
                </td>

                {/* Volume skeleton */}
                <td className="py-3">
                  <div className="h-4 bg-muted rounded-md w-32" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesSkeleton;
