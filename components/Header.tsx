import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <header>
      <div className="main-container inner">
        <Link href="/">
          <Image src="logo.svg" alt="CoinPulse logo" width={132} height={40} />
        </Link>
      </div>
    </header>
  );
};

export default Header;
