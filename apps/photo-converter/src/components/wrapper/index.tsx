'use client';
import React from "react";
import { ServerWrapper } from "./server";
import dynamic from "next/dynamic";

const DynamicConverter = dynamic(() => import('../converter').then(i => i.Converter), { ssr: false });

export const Wrapper = () => {
  return (
    <ServerWrapper>
      <DynamicConverter />
    </ServerWrapper>
  );
};
