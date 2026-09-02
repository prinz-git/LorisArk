"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import styles from "./HeroLogoMotion.module.css";

type Motion = {
  scroll: number;
  x: number;
  y: number;
};

export default function HeroLogoMotion() {
  const [motion, setMotion] = useState<Motion>({ scroll: 0, x: 0, y: 0 });

  useEffect(() => {
    const updateScroll = () => {
      const progress = Math.min(window.scrollY / 420, 1);
      setMotion((current) => ({ ...current, scroll: progress }));
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <div
      className={styles.logoStage}
      style={
        {
          "--logo-scroll": motion.scroll,
          "--logo-tilt-x": `${motion.y * -10}deg`,
          "--logo-tilt-y": `${motion.x * 12}deg`,
        } as CSSProperties
      }
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setMotion((current) => ({
          ...current,
          x: (event.clientX - rect.left) / rect.width - 0.5,
          y: (event.clientY - rect.top) / rect.height - 0.5,
        }));
      }}
      onPointerLeave={() => setMotion((current) => ({ ...current, x: 0, y: 0 }))}
      aria-label="Animated LorisArk logo"
    >
      <div className={styles.logoPlate}>
        <Image
          src="/LorisArklogoCircle.svg"
          alt="LorisArk"
          width={510}
          height={489}
          loading="eager"
          className={styles.logoMark}
        />
      </div>
    </div>
  );
}
