import Image from "next/image";
import type { ReactNode } from "react";
import { Apple } from "lucide-react";

import { Button } from "@/components/ui/button";
import goldfishIcon from "@/assets/Goldfish-Icon.png";
import goldfishHeadphones from "@/assets/goldfish-headphones-rightfacing.png";
import waterRipples from "@/assets/watter-ripples-transparent.png";
import youMakeMusicTitle from "@/assets/you-make-music-title.png";

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-text-primary">
      <Image
        src={waterRipples}
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none select-none object-cover object-center opacity-55"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[calc(50%+95px)] top-1/2 z-[5] hidden w-[min(52.7vw,765px)] [transform:translate(-64.65%,-48.82%)] lg:block"
      >
        <Image
          src={goldfishHeadphones}
          alt=""
          priority
          sizes="765px"
          className="h-auto w-full select-none object-contain drop-shadow-[0_24px_36px_rgba(249,115,22,0.12)]"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-6 py-7 sm:px-10 lg:px-16 lg:py-14">
        <div className="flex items-center gap-3">
          <Image
            src={goldfishIcon}
            alt=""
            width={48}
            height={48}
            priority
            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
          />
          <span className="font-[family-name:var(--font-display)] text-[30px] font-bold leading-none text-primary-hover sm:text-[34px]">
            Goldfish
          </span>
        </div>

        <section className="relative grid flex-1 items-center gap-12 py-10 lg:grid-cols-[minmax(520px,0.95fr)_minmax(220px,0.72fr)_minmax(380px,0.9fr)] lg:gap-0 lg:py-0 xl:grid-cols-[minmax(560px,0.95fr)_minmax(220px,0.72fr)_minmax(400px,0.9fr)]">
          <div className="relative z-10 mx-auto flex w-full max-w-[620px] flex-col items-start lg:mx-0 lg:h-[520px] lg:max-w-[660px] lg:self-center xl:max-w-[700px]">
            <div className="relative mx-auto aspect-square w-full max-w-[640px] lg:hidden">
              <Image
                src={goldfishHeadphones}
                alt="Goldfish wearing headphones."
                fill
                priority
                sizes="(max-width: 1024px) 88vw, 640px"
                className="object-contain drop-shadow-[0_24px_36px_rgba(249,115,22,0.12)]"
              />
            </div>

            <div className="relative -mt-16 aspect-square w-[min(86vw,520px)] sm:-mt-24 lg:absolute lg:left-0 lg:top-[-320px] lg:mt-0 lg:-ml-[220px] lg:w-[756px] xl:-ml-[224px] xl:w-[798px]">
              <Image
                src={youMakeMusicTitle}
                alt="You make music. Goldfish finds the magic."
                fill
                priority
                sizes="(max-width: 1024px) 86vw, 798px"
                className="select-none object-contain"
              />
            </div>

            <div className="-mt-16 max-w-[620px] text-left sm:-mt-20 lg:absolute lg:left-0 lg:top-[275px] lg:mt-0 lg:max-w-[660px] lg:pl-1 xl:max-w-[700px]">
              <h1 className="font-[family-name:var(--font-display)] text-[32px] font-semibold leading-[1.08] text-text-primary sm:text-[40px] lg:text-[42px] xl:text-[46px]">
                <span className="lg:whitespace-nowrap">Your best ideas</span>
                <br />
                <span className="lg:whitespace-nowrap">
                  are <span className="text-primary-hover">worth</span>{" "}
                  remembering.
                </span>
              </h1>
              <p className="mt-5 max-w-[430px] text-base leading-relaxed text-text-primary sm:text-lg">
                Goldfish finds the moments in your jam sessions where
                excitement peaks&mdash;and turns them into 1-minute clips you
                can relive and build on.
              </p>
            </div>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[454px] flex-col lg:col-start-3 lg:mx-0 lg:ml-auto lg:self-center">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.08em] text-primary-hover sm:text-base lg:text-left">
              Ready to get started?
            </p>
            <div className="mx-auto mt-5 h-0.5 w-11 bg-primary-hover lg:mx-0" />

            <div className="mt-8 flex flex-col gap-4">
              <AuthButton label="Continue with Apple" icon={<AppleIcon />} />
              <AuthButton label="Continue with Google" icon={<GoogleIcon />} />
            </div>

            <p className="mt-5 text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <span className="font-semibold text-primary-hover underline-offset-4">
                Login
              </span>
            </p>

            <div className="mt-12 border-t border-border/80 pt-9">
              <Button
                type="button"
                variant="outline"
                className="soft-focus-ring h-[76px] w-full rounded-[14px] border-border bg-surface/80 text-base font-semibold text-text-primary shadow-[var(--shadow-card)] transition-colors hover:bg-primary-wash hover:text-primary-hover sm:h-[84px] sm:text-lg"
              >
                Continue as Guest
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthButton({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="soft-focus-ring grid h-[78px] w-full grid-cols-[42px_minmax(0,1fr)_42px] items-center rounded-[14px] border-border bg-surface/80 px-4 text-sm font-semibold text-text-primary shadow-[var(--shadow-card)] transition-colors hover:bg-primary-wash hover:text-text-primary sm:h-[94px] sm:grid-cols-[54px_minmax(0,1fr)_54px] sm:px-6 sm:text-xl"
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="min-w-0 whitespace-normal text-center leading-snug">
        {label}
      </span>
      <span aria-hidden="true" />
    </Button>
  );
}

function AppleIcon() {
  return <Apple className="h-7 w-7 fill-current stroke-[1.7] text-black" />;
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.1 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.8h3.7c2.1-2 3.5-4.9 3.5-8.3Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1 7.6-2.9l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9a11.5 11.5 0 0 0 10.2 6.4Z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4V6.9H1.8a11.5 11.5 0 0 0 0 10.2l3.8-2.9Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.1 11.1 0 0 0 12 .5 11.5 11.5 0 0 0 1.8 6.9l3.8 2.9C6.5 7.1 9 5.1 12 5.1Z"
      />
    </svg>
  );
}
