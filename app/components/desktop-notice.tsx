import Image from "next/image";

export function DesktopNotice() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-5 px-8 text-center md:flex">
      <Image
        src="/mobile-notice.svg"
        alt="TownLoop shown on a desktop browser and mobile phone"
        width={800}
        height={540}
        className="h-auto w-full max-w-[360px]"
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-leaf-900">
          TownLoop is made for mobile
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-leaf-700/80">
          Switch to a mobile device or press Fn + F12 on your laptop to view the
          page.
        </p>
      </div>
    </div>
  );
}
