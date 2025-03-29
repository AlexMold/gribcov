'use client';
import dynamic from "next/dynamic";
import React from "react";

const DynamicConverter = dynamic(() => import('../converter').then(i => i.Converter), { ssr: false });

export const Wrapper = () => {
  return <DynamicConverter />;
};
