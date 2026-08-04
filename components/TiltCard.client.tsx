"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const rotateX = (e.clientY - rect.top - rect.height / 2) / 20;
    const rotateY = (rect.width / 2 - (e.clientX - rect.left)) / 20;
    setRotate({ x: rotateX, y: rotateY });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      style={{ transformStyle: "preserve-3d", rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
};
