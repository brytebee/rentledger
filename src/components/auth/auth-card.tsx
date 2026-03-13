import Link from "next/link";
import { Home } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-obsidian-glow flex flex-col items-center justify-center px-4 py-12 transition-colors duration-500">
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-15%] right-[-10%] w-125 h-125 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-125 h-125 bg-violet-200/15 dark:bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 font-bold text-foreground mb-8 hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-[10px] bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Home className="w-5 h-5 text-white" />
        </div>
        RentLedger
      </Link>

      {/* Card */}
      <Card className="w-full max-w-[420px] rounded-[24px] border border-border bg-card/95 dark:bg-card/95 backdrop-blur-sm shadow-2xl shadow-zinc-950/10 dark:shadow-zinc-950/50">
        <CardHeader className="pb-2 pt-8 px-8 space-y-1">
          <h1 className="text-[1.5rem] font-black tracking-[-0.025em] text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground font-[Roboto,sans-serif] leading-relaxed">
            {subtitle}
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-6">{children}</CardContent>
      </Card>

      {/* Footer link */}
      <p className="mt-8 text-sm text-muted-foreground font-[Roboto,sans-serif]">
        {footerText}{" "}
        <Link
          href={footerLinkHref}
          className="font-semibold text-blue-500 hover:text-blue-400 underline-offset-4 hover:underline transition-colors"
        >
          {footerLinkText}
        </Link>
      </p>
    </div>
  );
}
