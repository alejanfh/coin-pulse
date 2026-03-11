"use client";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Separator } from "./ui/separator";
import CandlestickChart from "./CandlestickChart";
import DataTable from "./DataTable";
import { useCoinData } from "@/hooks/useCoinData";

const LiveDataWrapper = ({
  coinId,
  poolId,
  coin,
  coinOHLCData,
  children,
}: {
  coinId: string;
  poolId: string;
  coin: CoinDetailsData;
  coinOHLCData: OHLCData;
  children: React.ReactNode;
}) => {
  // Connect to the websocket and listen for new data
  // const { trades } = useCoinGeckoWebSocket({ coinId, poolId });
  // const { trades } = useCoinGeckoPolling({ coinId, poolId });
  const { trades } = useCoinData({ coinId, poolId });

  const tradeColumns: DataTableColumn<Trade>[] = [
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: (trade) => (trade.price ? formatCurrency(trade.price) : "-"),
    },
    {
      header: "Amount",
      cellClassName: "amount-cell",
      cell: (trade) => trade.amount?.toFixed(4) ?? "-",
    },
    {
      header: "Value",
      cellClassName: "value-cell",
      cell: (trade) => (trade.value ? formatCurrency(trade.value) : "-"),
    },
    {
      header: "Buy/Sell",
      cellClassName: "type-cell",
      cell: (trade) => (
        <span
          className={trade.type === "b" ? "text-green-500" : "text-red-500"}
        >
          {trade.type === "b" ? "Buy" : "Sell"}
        </span>
      ),
    },
    {
      header: "Time",
      cellClassName: "time-cell",
      cell: (trade) => (trade.timestamp ? timeAgo(trade.timestamp) : "-"),
    },
  ];

  return (
    <section id="live-data-wrapper">
      <p>Live Data</p>

      <Separator className="divider" />

      <div className="trend">
        <CandlestickChart coinId={coinId} data={coinOHLCData}>
          <h4>Trend Overview</h4>
        </CandlestickChart>
      </div>

      <Separator className="divider" />

      {tradeColumns && (
        <div className="trades">
          <h4>Recent Trades</h4>

          <DataTable
            columns={tradeColumns}
            data={trades}
            rowKey={(_, index) => index}
            tableClassName="trades-table"
          />
        </div>
      )}
    </section>
  );
};

export default LiveDataWrapper;
