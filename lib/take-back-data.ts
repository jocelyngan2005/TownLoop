export type TakeBackBrand = {
  id: string;
  name: string;
  reward: string;
  details: string;
  url: string;
  logoSrc?: string;
};

export type TakeBackCategory = {
  id: "apparel" | "beauty" | "electronics";
  title: string;
  description: string;
  brands: TakeBackBrand[];
};

export const takeBackCategories: TakeBackCategory[] = [
  {
    id: "apparel",
    title: "Apparel & fashion",
    description: "Drop off clothing, textiles and pre-loved pieces in store.",
    brands: [
      {
        id: "hm",
        name: "H&M",
        reward: "15% voucher per bag",
        details:
          "Accepts textiles of any brand at all physical branches. Rewards you with a 15% discount voucher per bag dropped off.",
        url: "https://www2.hm.com/en_my/sustainability-hm/services/garment-collecting.html",
        logoSrc: "/takeback/hnm-logo.png",
      },
      {
        id: "uniqlo",
        name: "UNIQLO",
        reward: "Donated to communities",
        details:
          "Strictly accepts UNIQLO-only garments for charitable redistribution to refugees or communities in need. They also partner with local upcycling social enterprises like Suri Lifestyle.",
        url: "https://faq-my.uniqlo.com/pkb_Home_UQ_MY?id=kA0Ie000000TNsF&l=en_US&fs=RelatedArticle",
        logoSrc: "/takeback/uniqlo-logo.png",
      },
      {
        id: "zalora",
        name: "ZALORA",
        reward: "Snap & Drop boxes",
        details:
          "An international digital platform operating the \u201cSnap & Drop\u201d textile collection box program across key retail spaces in partnership with REFASH Malaysia.",
        url: "https://www.zalora.com.my/sale/clothes-donation",
        logoSrc: "/takeback/zalora-logo.png",
      },
      {
        id: "refash",
        name: "REFASH",
        reward: "Cash or store credit",
        details:
          "A regional thrift-retail brand that lets you clean out your closet by trading in pre-loved womenswear or activewear for cash payouts or shopping credits.",
        url: "https://refash.my/pages/how-to-sell",
        logoSrc: "/takeback/refash-logo.png",
      },
    ],
  },
  {
    id: "beauty",
    title: "Beauty & cosmetics",
    description: "Return empty bottles, jars and packaging for rewards.",
    brands: [
      {
        id: "loccitane",
        name: "L'Occitane",
        reward: "Tiered gifts & vouchers",
        details:
          "Runs the comprehensive \u201cBig Little Things\u201d program. Accepts full-sized empty beauty packaging from any brand to reward members with tier-based free gifts or vouchers.",
        url: "https://my.loccitane.com/pages/big-little-things",
        logoSrc: "/takeback/loccitane-logo.png",
      },
      {
        id: "body-shop",
        name: "The Body Shop",
        reward: "RM1 instant rebate",
        details:
          "Accepts empty plastic packaging from any beauty brand for an instant RM1 rebate. They also promote aluminum bottle refills in-store to bypass single-use packaging entirely.",
        url: "https://www.thebodyshop.com.my/about-us/brand-values/sustainability/return-recycle-reuse",
        logoSrc: "/takeback/bodyshop-logo.png",
      },
      {
        id: "innisfree",
        name: "Innisfree",
        reward: "100 points (RM2) per bottle",
        details:
          "Accepts empty, thoroughly washed Innisfree plastic or glass bottles. Earn 100 loyalty points (worth RM2) per bottle deposited through their app.",
        url: "https://my.innisfree.com/blogs/blog/how-to-recycle-your-innisfree-empties",
        logoSrc: "/takeback/Innisfree-logo.png",
      },
      {
        id: "kiehls",
        name: "Kiehl's",
        reward: "Stamp card for free products",
        details:
          "Earn 1 stamp for every empty full-sized Kiehl's product container you return. Accumulating stamps yields deluxe travel-sized or full-sized hair and skin items.",
        url: "https://www.kiehls.com.my/en_MY/recycling-my.html",
        logoSrc: "/takeback/kiehls-logo.png",
      },
      {
        id: "mac",
        name: "M·A·C Cosmetics",
        reward: "Back-to-M·A·C recycling",
        details:
          "Features the historic \u201cBack-to-M.A.C\u201d program. Turn in clean primary M.A.C containers to participating counters for recycling.",
        url: "https://www.maccosmetics.com/pages/back-to-mac",
        logoSrc: "/takeback/mac-logo.png",
      },
    ],
  },
  {
    id: "electronics",
    title: "Electronics & e-waste",
    description: "Hand over devices and appliances to certified recyclers.",
    brands: [
      {
        id: "again",
        name: "Again",
        reward: "Instant DuitNow payout",
        details:
          "A high-growth, DOE-registered circular tech provider offering free doorstep pickup in Selangor and the Klang Valley. They pay instantly via DuitNow and offer certified data destruction.",
        url: "https://www.again.eco/",
      },
      {
        id: "erth",
        name: "ERTH",
        reward: "Cash via bank transfer",
        details:
          "A digital, on-demand e-waste solution (erth.app) that collects junk laptops, PCs, phones, and household appliances. They offer cash payouts via bank transfer and provide free pickup for eligible items.",
        url: "https://erth.app/",
      },
      {
        id: "senheng",
        name: "Senheng",
        reward: "Vouchers & S-Coin",
        details:
          "Allows consumers to bring non-bulky tech elements to any Senheng/SenQ branch for discount vouchers / S-Coin rewards. They arrange free home collection for massive e-waste items like refrigerators or washing machines.",
        url: "https://www.senheng.com.my/mygreen-rewards/",
        logoSrc: "/takeback/senheng-logo.jpg",
      },
      {
        id: "tbm",
        name: "TBM (Tan Boon Ming)",
        reward: "Reward e-vouchers",
        details:
          "Operates an official take-back drive aligned with the Department of Environment (DOE). Tracks dropped-off household appliances via an E-Manifest app to issue reward e-vouchers.",
        url: "https://shop.tbm.com.my/pages/e-waste",
        logoSrc: "/takeback/tbm-logo.png",
      },
      {
        id: "all-it",
        name: "ALL IT Hypermarket",
        reward: "Drop-off kiosks",
        details:
          "Hosts the \u201cTech The Emissions Down (TTED)\u201d program. Consumers can drop off legacy personal electronics at specific retail kiosks to route them to government-certified recyclers.",
        url: "https://www.allithypermarket.com.my/",
        logoSrc: "/takeback/allit-logo.webp",
      },
    ],
  },
];
