import Categories from "@/components/home/Categories";
import CoinOverview from "@/components/home/CoinOverview";
import TrendingCoins from "@/components/home/TrendingCoins";
import CoinOverviewSkeleton from "@/components/home/CoinOverviewSkeleton";
import TrendingCoinsSkeleton from "@/components/home/TrendingCoinsSkeleton";
import CategoriesSkeleton from "@/components/home/CategoriesSkeleton";
import { Suspense } from "react";

const Page = async () => {
  return (
    <main className="main-container">
      <section className="home-grid">
        <Suspense fallback={<CoinOverviewSkeleton />}>
          <CoinOverview />
        </Suspense>

        <Suspense fallback={<TrendingCoinsSkeleton />}>
          <TrendingCoins />
        </Suspense>
      </section>

      <section className="w-full mt-7 space-y-4">
        <Suspense fallback={<CategoriesSkeleton />}>
          <Categories />
        </Suspense>
      </section>
    </main>
  );
};

export default Page;
